import express from 'express';
import cors from 'cors';
import { loadVotes, saveVotes, loadAccounts, loadConfig } from './storage.js';
import { verifyVoteSignature } from './crypto.js';
import { calculateTrustVector } from './trust.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// serve frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* -------------------------
   Submit Signed Vote
--------------------------*/
app.post('/api/vote', (req, res) => {
  try {
    const signedVote = req.body;

    if (!signedVote.vote || !signedVote.signature) {
      return res.status(400).json({ error: 'Invalid vote format' });
    }

    if (!verifyVoteSignature(signedVote)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const votes = loadVotes();
    const voteWithHash = {
      ...signedVote,
      txHash: `0x${Date.now().toString(16)}${Math.random()
        .toString(16)
        .slice(2, 10)}`
    };

    votes.push(voteWithHash);
    saveVotes(votes);

    res.json({
      success: true,
      txHash: voteWithHash.txHash,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------
   Get All Votes
--------------------------*/
app.get('/api/votes', (req, res) => {
  try {
    const votes = loadVotes();
    const { address } = req.query;

    if (address) {
      const filtered = votes.filter(
        v =>
          v.vote.from.toLowerCase() === address.toLowerCase() ||
          v.vote.to.toLowerCase() === address.toLowerCase()
      );
      return res.json(filtered);
    }

    res.json(votes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------
   Votes for a specific address
--------------------------*/
app.get('/api/votes/:address', (req, res) => {
  try {
    const votes = loadVotes();
    const address = req.params.address.toLowerCase();

    const received = votes.filter(v => v.vote.to.toLowerCase() === address);
    const sent = votes.filter(v => v.vote.from.toLowerCase() === address);

    res.json({ address, received, sent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------
   Trust Score for a Node
--------------------------*/
app.get('/api/trust/:address', (req, res) => {
  try {
    const { damping = 0.2, query = null } = req.query;

    const score = calculateTrustVector(
      req.params.address,
      parseFloat(damping),
      query
    );

    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------
   Graph Data for Visualization
   (ENRICHED VERSION)
--------------------------*/
app.get('/api/graph', (req, res) => {
  try {
    const votes = loadVotes();
    const accounts = loadAccounts();
    const config = loadConfig();

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
        weight:
          v.vote.weight !== undefined
            ? v.vote.weight
            : v.vote.trust
            ? Number(v.vote.trust)
            : 1,
        txHash: v.txHash,
        timestamp: v.vote.timestamp || null
      });
    });

    // Enrich nodes with accounts.json + heuristics
    const TRUSTED_DOMAINS = [
      'nytimes.com',
      'bbc.com',
      'reuters.com',
      'apnews.com',
      'theguardian.com',
      'aljazeera.com'
    ];

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

    res.json({
      nodes: Object.values(nodes),
      edges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Trust ledger server running on http://localhost:${PORT}`);
});
