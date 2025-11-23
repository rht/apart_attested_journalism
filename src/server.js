import express from 'express';
import cors from 'cors';
import { loadVotes, saveVotes } from './storage.js';
import { verifyVoteSignature } from './crypto.js';
import { calculateTrustVector } from './trust.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(cors());                    // <-- allow frontend requests
app.use(express.json());
 // <-- serve the frontend from ./public

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
      txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`
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
      const filtered = votes.filter(v =>
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
   returns the same structure produced by calculateTrustVector()
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
   returns nodes[] and edges[]
--------------------------*/
app.get('/api/graph', (req, res) => {
  try {
    const votes = loadVotes();

    const nodes = {};   // address -> node
    const edges = [];   // res edges

    votes.forEach(v => {
      const from = v.vote.from.toLowerCase();
      const to = v.vote.to.toLowerCase();

      if (!nodes[from]) nodes[from] = { id: from, label: from };
      if (!nodes[to])   nodes[to]   = { id: to,   label: to };

      edges.push({
        source: from,
        target: to,
        weight: v.vote.weight !== undefined ? v.vote.weight : (v.vote.trust ? Number(v.vote.trust) : 1),
        txHash: v.txHash,
        timestamp: v.vote.timestamp || null
      });
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
