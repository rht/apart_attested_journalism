// app.js - simple Trust Explorer (uses vis-network)
(async function () {
  function qs(sel) { return document.querySelector(sel); }

  const networkContainer = qs('#network');
  const searchInput = qs('#searchInput');
  const searchBtn = qs('#searchBtn');
  const clearBtn = qs('#clearBtn');
  const selectedAddressEl = qs('#selectedAddress');
  const receivedList = qs('#receivedList');
  const sentList = qs('#sentList');
  const trustScoreEl = qs('#trustScore');

  async function fetchGraph() {
    const res = await fetch('/api/graph');
    return res.json();
  }

  async function fetchVotesForAddress(addr) {
    const res = await fetch('/api/votes/' + addr);
    if (!res.ok) return null;
    return res.json();
  }

  async function fetchTrust(addr) {
    const res = await fetch('/api/trust/' + addr);
    if (!res.ok) return null;
    return res.json();
  }

  const graph = await fetchGraph();

  // 🚀 ENRICHED NODE DATASET (colors, sizes, labels)
  const nodes = new vis.DataSet(
    graph.nodes.map(n => {
      let color = "#77b7ff"; // default: blue (unknown)

      if (n.hasTrustedDomain) color = "#4ade80";    // green = real journalist (trusted newsroom)
      if (!n.hasTrustedDomain && n.credentialCount > 0) color = "#facc15"; // yellow = independent journo
      if (n.isSybil) color = "#f87171";             // red = sybil

      let size = 10 + (n.credentialCount * 2);
      if (n.hasTrustedDomain) size += 6;

      return {
        id: n.id,
        label: n.label,
        size,
        color: { background: color, border: "#ffffff22" },
        title: `
          ${n.id}<br>
          <b>Credentials:</b> ${n.credentialCount}<br>
          <b>Trusted newsroom:</b> ${n.hasTrustedDomain}<br>
          <b>Sybil:</b> ${n.isSybil}<br>
          <b>Account age:</b> ${n.accountAgeDays || "n/a"} days<br>
        `
      };
    })
  );

  const edges = new vis.DataSet(
    graph.edges.map((e, i) => ({
      id: 'e' + i,
      from: e.source,
      to: e.target,
      value: e.weight || 1,
      title: `weight: ${e.weight} tx: ${e.txHash || 'n/a'}`
    }))
  );

  const container = networkContainer;
  const data = { nodes, edges };

  const options = {
    nodes: {
      shape: 'dot',
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
      navigationButtons: true,
      keyboard: true
    }
  };

  const network = new vis.Network(container, data, options);

  // node click
  network.on('click', async function (params) {
    if (params.nodes && params.nodes.length) {
      const id = params.nodes[0];
      selectNode(id);
    } else {
      clearSelection();
    }
  });

  async function selectNode(id) {
    selectedAddressEl.textContent = "Selected: " + id;
    const votes = await fetchVotesForAddress(id);

    receivedList.innerHTML = '';
    sentList.innerHTML = '';

    if (votes) {
      if (votes.received.length === 0) {
        receivedList.innerHTML = '<div class="item">No received votes</div>';
      } else {
        votes.received.forEach(r => {
          const div = document.createElement('div');
          div.className = "item";
          div.innerHTML = `<div><strong>From:</strong> ${r.vote.from}</div><div style="font-size:12px;color:#999;">Trust: ${r.vote.trust || r.vote.weight || 1} • tx: ${r.txHash}</div>`;
          receivedList.appendChild(div);
        });
      }

      if (votes.sent.length === 0) {
        sentList.innerHTML = '<div class="item">No sent votes</div>';
      } else {
        votes.sent.forEach(s => {
          const div = document.createElement('div');
          div.className = "item";
          div.innerHTML = `<div><strong>To:</strong> ${s.vote.to}</div><div style="font-size:12px;color:#999;">Trust: ${s.vote.trust || s.vote.weight || 1} • tx: ${s.txHash}</div>`;
          sentList.appendChild(div);
        });
      }
    }

    const trust = await fetchTrust(id);
    if (trust && typeof trust.overallScore !== "undefined") {
      trustScoreEl.textContent = `Overall score: ${(trust.overallScore * 100).toFixed(2)}%`;
    } else {
      trustScoreEl.textContent = "Overall score: n/a";
    }
  }

  function clearSelection() {
    selectedAddressEl.textContent = "Selected: —";
    receivedList.innerHTML = '';
    sentList.innerHTML = '';
    trustScoreEl.textContent = '';
  }

  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;

    if (!nodes.get(q)) {
      alert("Address not found in graph");
      return;
    }

    network.focus(q, { scale: 0.12, animation: true });
    selectNode(q);
  });

  clearBtn.addEventListener('click', () => {
    clearSelection();
    network.unselectAll();
  });

  clearSelection();
})();
