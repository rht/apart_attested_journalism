import { loadVotes, loadConfig } from './storage.js';

function calculatePretrustVector(queryingAddress, votes, nodeList, nodeIndex) {
  const n = nodeList.length;
  const pretrustVector = Array(n).fill(0);

  if (!queryingAddress) {
    // No querying address, use uniform distribution
    for (let i = 0; i < n; i++) {
      pretrustVector[i] = 1 / n;
    }
    return pretrustVector;
  }

  const queryingAddr = queryingAddress.toLowerCase();
  const queryingIdx = nodeIndex[queryingAddr];

  if (queryingIdx === undefined) {
    // Querying address not in network, use uniform distribution
    for (let i = 0; i < n; i++) {
      pretrustVector[i] = 1 / n;
    }
    return pretrustVector;
  }

  // Find direct trust votes from the querying user (1-hop peers)
  const directTrusts = votes.filter(v =>
    v.vote.from.toLowerCase() === queryingAddr && v.vote.trust
  );

  if (directTrusts.length > 0) {
    // Set pretrust based on who the querying user directly trusts
    directTrusts.forEach(v => {
      const trustedAddr = v.vote.to.toLowerCase();
      const trustedIdx = nodeIndex[trustedAddr];
      if (trustedIdx !== undefined) {
        pretrustVector[trustedIdx] = 1;
      }
    });

    // Normalize pretrust vector
    const pretrustSum = pretrustVector.reduce((a, b) => a + b, 0);
    if (pretrustSum > 0) {
      for (let i = 0; i < n; i++) {
        pretrustVector[i] /= pretrustSum;
      }
    }
  } else {
    // No direct trusts, use uniform distribution
    for (let i = 0; i < n; i++) {
      pretrustVector[i] = 1 / n;
    }
  }

  return pretrustVector;
}

export function calculateTrustScores(targetAddress, dampingFactor, queryingAddress) {
  const votes = loadVotes();
  const config = loadConfig();

  if (votes.length === 0) {
    return 0;
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

  // Calculate pretrust vector based on querying user's direct trust votes (1-hop peers)
  const pretrustVector = calculatePretrustVector(queryingAddress, votes, nodeList, nodeIndex);

  let trustVector = Array(n).fill(1 / n);

  for (let iter = 0; iter < config.eigenTrustIterations; iter++) {
    const newTrustVector = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      // Apply damping factor: t_i = (1-a) * sum(C_ji * t_j) + a * p_i
      let propagatedTrust = 0;
      for (let j = 0; j < n; j++) {
        propagatedTrust += trustMatrix[j][i] * trustVector[j];
      }
       //Core implementation of Damping Factor within eigentrust.js on top of other files
      if (dampingFactor > 0 && queryingAddress) {
        newTrustVector[i] = (1 - dampingFactor) * propagatedTrust + dampingFactor * pretrustVector[i];
      } else {
        newTrustVector[i] = propagatedTrust;
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

  return scores[targetAddress.toLowerCase()] || 0;
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
