import express from 'express';
import { loadVotes, saveVotes } from './storage.js';
import { verifyVoteSignature } from './crypto.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Trust ledger server running on http://localhost:${PORT}`);
});
