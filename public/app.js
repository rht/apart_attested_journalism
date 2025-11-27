// app.js - simple Trust Explorer (uses vis-network)
import { calculateTrustVector } from './src/trust.js';
import { setBrowserData } from './src/storage.js';

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

  // Load data directly from JSON files
  async function loadData() {
    const [votesRes, accountsRes, configRes] = await Promise.all([
      fetch('data/votes.json'),
      fetch('data/accounts.json'),
      fetch('data/config.json')
    ]);
    const votes = await votesRes.json();
    const accounts = await accountsRes.json();
    const config = await configRes.json();

    // Set data for browser-based storage module
    setBrowserData(votes, accounts, config);

    return { votes, accounts, config };
  }

  // Build graph from votes and accounts (client-side)
  function buildGraph(votes, accounts) {
    const TRUSTED_DOMAINS = [
      'nytimes.com',
      'bbc.com',
      'reuters.com',
      'apnews.com',
      'theguardian.com',
      'aljazeera.com'
    ];

    const nodes = {};
    const edges = [];

    // Build edges and node base entries
    votes.forEach(v => {
      const from = v.vote.from.toLowerCase();
      const to = v.vote.to.toLowerCase();

      if (!nodes[from]) nodes[from] = { id: from };
      if (!nodes[to]) nodes[to] = { id: to };

      edges.push({
        source: from,
        target: to,
        weight: v.vote.weight !== undefined ? v.vote.weight : (v.vote.trust ? Number(v.vote.trust) : 1),
        txHash: v.txHash,
        timestamp: v.vote.timestamp || null
      });
    });

    // Enrich nodes with accounts data
    Object.keys(nodes).forEach(addr => {
      const account = accounts[addr] || {
        createdAt: null,
        credentials: []
      };

      const credentials = account.credentials || [];
      const credentialDomains = credentials.map(c => c.domain);
      const credentialCount = credentials.length;

      const hasTrustedDomain = credentialDomains.some(d =>
        TRUSTED_DOMAINS.includes(d)
      );

      let accountAgeDays = null;
      if (account.createdAt) {
        accountAgeDays = Math.floor(
          (Date.now() - account.createdAt) / (1000 * 86400)
        );
      }

      const outboundEdges = edges.filter(e => e.source === addr).length;

      const isSybil =
        (!hasTrustedDomain &&
          credentialCount === 0 &&
          accountAgeDays !== null &&
          accountAgeDays < 3) ||
        outboundEdges > 20;

      nodes[addr] = {
        id: addr,
        label: addr.slice(0, 10) + '...',
        credentialCount,
        credentialDomains,
        hasTrustedDomain,
        accountAgeDays,
        outboundEdges,
        isSybil
      };
    });

    return {
      nodes: Object.values(nodes),
      edges
    };
  }

  // Get votes for a specific address
  function getVotesForAddress(votes, addr) {
    const address = addr.toLowerCase();
    const received = votes.filter(v => v.vote.to.toLowerCase() === address);
    const sent = votes.filter(v => v.vote.from.toLowerCase() === address);
    return { address, received, sent };
  }

  const data = await loadData();
  const graph = buildGraph(data.votes, data.accounts);

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
  const networkData = { nodes, edges };

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

  const network = new vis.Network(container, networkData, options);

  // --- ✅ UI FIX 1: Force initial render properly
  requestAnimationFrame(() => {
    network.redraw();
    network.fit({ animation: false });
    network.moveTo({ scale: 0.5, animation: false });
  });

  // --- ✅ UI FIX 2: Auto-resize when container size changes
  new ResizeObserver(() => {
    network.redraw();
    network.fit({ animation: false });
  }).observe(networkContainer);

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
    const votesData = getVotesForAddress(data.votes, id);

    receivedList.innerHTML = '';
    sentList.innerHTML = '';

    if (votesData) {
      if (votesData.received.length === 0) {
        receivedList.innerHTML = '<div class="item">No received votes</div>';
      } else {
        votesData.received.forEach(r => {
          const div = document.createElement('div');
          div.className = "item";
          div.innerHTML = `<div><strong>From:</strong> ${r.vote.from}</div><div style="font-size:12px;color:#999;">Trust: ${r.vote.trust || r.vote.weight || 1} • tx: ${r.txHash}</div>`;
          receivedList.appendChild(div);
        });
      }

      if (votesData.sent.length === 0) {
        sentList.innerHTML = '<div class="item">No sent votes</div>';
      } else {
        votesData.sent.forEach(s => {
          const div = document.createElement('div');
          div.className = "item";
          div.innerHTML = `<div><strong>To:</strong> ${s.vote.to}</div><div style="font-size:12px;color:#999;">Trust: ${s.vote.trust || s.vote.weight || 1} • tx: ${s.txHash}</div>`;
          sentList.appendChild(div);
        });
      }
    }

    const queryingAddress = '0x6157364ab3a83aa357f769af11314b0b573c91c1'; // nytimes.com
    const trust = calculateTrustVector(id, 0.2, queryingAddress);

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