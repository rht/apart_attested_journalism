// app.js - simple Trust Explorer (uses vis-network)
(async function () {
  // helpers
  function qs(sel) { return document.querySelector(sel); }
  function el(text) { const d = document.createElement('div'); d.textContent = text; return d; }

  const networkContainer = qs('#network');
  const searchInput = qs('#searchInput');
  const searchBtn = qs('#searchBtn');
  const clearBtn = qs('#clearBtn');
  const selectedAddressEl = qs('#selectedAddress');
  const receivedList = qs('#receivedList');
  const sentList = qs('#sentList');
  const trustScoreEl = qs('#trustScore');

  // fetch graph data
  async function fetchGraph() {
    const res = await fetch('/api/graph');
    return res.json();
  }

  // fetch votes for an address
  async function fetchVotesForAddress(addr) {
    const res = await fetch('/api/votes/' + addr);
    if (!res.ok) return null;
    return res.json();
  }

  // fetch trust summary
  async function fetchTrust(addr) {
    const res = await fetch('/api/trust/' + addr);
    if (!res.ok) return null;
    return res.json();
  }

  // build vis datasets
  const graph = await fetchGraph();
  const nodes = new vis.DataSet(graph.nodes.map(n => ({
    id: n.id,
    label: n.label,
    title: n.label
  })));

  const edges = new vis.DataSet(graph.edges.map((e, i) => ({
    id: 'e' + i,
    from: e.source,
    to: e.target,
    value: e.weight || 1,
    title: `weight: ${e.weight} tx: ${e.txHash || 'n/a'}`
  })));

  // vis network options
  const container = networkContainer;
  const data = { nodes, edges };
  const options = {
    nodes: {
      shape: 'dot',
      size: 10,
      font: { size: 12 }
    },
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      smooth: { enabled: true, type: 'continuous' },
      width: 1
    },
    physics: {
      stabilization: false,
      barnesHut: {
        gravitationalConstant: -20000,
        springLength: 150,
        springConstant: 0.001,
        avoidOverlap: 0.8
      }
    },
    interaction: {
      hover: true,
      multiselect: false,
      navigationButtons: true,
      keyboard: true
    }
  };

  const network = new vis.Network(container, data, options);

  // node click handler
  network.on('click', async function (params) {
    if (params.nodes && params.nodes.length) {
      const nodeId = params.nodes[0];
      selectNode(nodeId);
    } else {
      clearSelection();
    }
  });

  async function selectNode(nodeId) {
    selectedAddressEl.textContent = 'Selected: ' + nodeId;
    // fetch votes
    const votes = await fetchVotesForAddress(nodeId);
    if (votes) {
      // populate received
      receivedList.innerHTML = '';
      if (votes.received && votes.received.length) {
        votes.received.forEach(r => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `<div><strong>From:</strong> ${r.vote.from}</div><div style="font-size:12px;color:#999;"><strong>Trust:</strong> ${r.vote.trust || r.vote.weight || 1} • tx: ${r.txHash || 'n/a'}</div>`;
          receivedList.appendChild(div);
        });
      } else {
        receivedList.innerHTML = '<div class="item">No received votes</div>';
      }

      // populate sent
      sentList.innerHTML = '';
      if (votes.sent && votes.sent.length) {
        votes.sent.forEach(s => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `<div><strong>To:</strong> ${s.vote.to}</div><div style="font-size:12px;color:#999;"><strong>Trust:</strong> ${s.vote.trust || s.vote.weight || 1} • tx: ${s.txHash || 'n/a'}</div>`;
          sentList.appendChild(div);
        });
      } else {
        sentList.innerHTML = '<div class="item">No sent votes</div>';
      }
    } else {
      receivedList.innerHTML = '<div class="item">No data</div>';
      sentList.innerHTML = '<div class="item">No data</div>';
    }

    // fetch trust score (might be expensive on server — caching recommended later)
    const trust = await fetchTrust(nodeId);
    if (trust && typeof trust.overallScore !== 'undefined') {
      trustScoreEl.textContent = `Overall score: ${((trust.overallScore || 0) * 100).toFixed(2)}%`;
    } else {
      trustScoreEl.textContent = 'Overall score: n/a';
    }
  }

  function clearSelection() {
    selectedAddressEl.textContent = 'Selected: —';
    receivedList.innerHTML = '';
    sentList.innerHTML = '';
    trustScoreEl.textContent = '';
  }

  // search
  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;
    if (!nodes.get(q)) {
      alert('Address not found in graph');
      return;
    }
    // move camera to node
    network.focus(q, { scale: 0.1, animation: true });
    selectNode(q);
  });

  clearBtn.addEventListener('click', () => {
    clearSelection();
    network.unselectAll();
  });

  // initial hint
  clearSelection();
})();
