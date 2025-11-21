import { loadVotes, loadConfig } from './storage.js';

export function calculateTrustScores(targetAddress = null) {
  const votes = loadVotes();
  const config = loadConfig();

  if (votes.length === 0) {
    return targetAddress ? { address: targetAddress, score: 0 } : {};
  }

  const nodes = new Set();
  votes.forEach(v => {
    nodes.add(v.vote.from.toLowerCase());
    nodes.add(v.vote.to.toLowerCase());
  });

  const nodeList = Array.from(nodes);
  const n = nodeList.length;
  const nodeIndex = {};
  nodeList.forEach((node, i) => nodeIndex[node] = i);

  const trustMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
  const voteCounts = Array(n).fill(0);

  votes.forEach(v => {
    const from = v.vote.from.toLowerCase();
    const to = v.vote.to.toLowerCase();
    const fromIdx = nodeIndex[from];
    const toIdx = nodeIndex[to];

    if (v.vote.trust) {
      trustMatrix[fromIdx][toIdx] = 1;
      voteCounts[fromIdx]++;
    }
  });

  for (let i = 0; i < n; i++) {
    if (voteCounts[i] > 0) {
      for (let j = 0; j < n; j++) {
        trustMatrix[i][j] /= voteCounts[i];
      }
    } else {
      for (let j = 0; j < n; j++) {
        trustMatrix[i][j] = 1 / n;
      }
    }
  }

  let trustVector = Array(n).fill(1 / n);

  for (let iter = 0; iter < config.eigenTrustIterations; iter++) {
    const newTrustVector = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newTrustVector[i] += trustMatrix[j][i] * trustVector[j];
      }
    }

    const sum = newTrustVector.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      newTrustVector[i] /= sum;
    }

    const delta = newTrustVector.reduce((acc, val, i) =>
      acc + Math.abs(val - trustVector[i]), 0);

    trustVector = newTrustVector;

    if (delta < config.eigenTrustEpsilon) break;
  }

  const scores = {};
  nodeList.forEach((node, i) => {
    scores[node] = trustVector[i];
  });

  return targetAddress ? scores[targetAddress.toLowerCase()] || 0 : scores;
}

export function calculatePeerVoteScore(address) {
  const votes = loadVotes();
  const config = loadConfig();
  const now = Date.now();

  let positiveVotes = 0;
  let totalVotes = 0;

  votes.forEach(v => {
    if (v.vote.to.toLowerCase() === address.toLowerCase()) {
      const age = now - v.vote.timestamp;
      if (age >= config.minAttestationAge) {
        totalVotes++;
        if (v.vote.trust) positiveVotes++;
      }
    }
  });

  return totalVotes > 0 ? positiveVotes / totalVotes : 0;
}
