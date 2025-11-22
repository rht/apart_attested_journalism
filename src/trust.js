import { loadAccounts, loadConfig } from './storage.js';
import { calculateTrustScores, calculatePeerVoteScore } from './eigentrust.js';

export function calculateTrustVector(address, dampingFactor, queryingAddress) {
  const accounts = loadAccounts();
  const config = loadConfig();
  const now = Date.now();

  const account = accounts[address.toLowerCase()] || {
    address: address.toLowerCase(),
    createdAt: now,
    credentials: []
  };

  const x509Score = calculateX509Score(account);
  const peerVoteScore = calculatePeerVoteScore(address);
  const timeBasedScore = calculateTimeBasedScore(account, config, now);
  const graphScore = calculateTrustScores(address, dampingFactor, queryingAddress);

  const weights = { x509: 0.25, peer: 0.35, time: 0.15, graph: 0.25 };
  const overallScore =
    x509Score * weights.x509 +
    peerVoteScore * weights.peer +
    timeBasedScore * weights.time +
    graphScore * weights.graph;

  return {
    address: address.toLowerCase(),
    x509Score,
    peerVoteScore,
    timeBasedScore,
    graphScore,
    overallScore,
    dampingFactor,
    metadata: {
      x509Credentials: account.credentials || [],
      accountAge: now - account.createdAt,
      lastUpdated: now
    }
  };
}

function calculateX509Score(account) {
  if (!account.credentials || account.credentials.length === 0) return 0;

  const validCreds = account.credentials.filter(cred => {
    return cred.domain && cred.verificationHash;
  });

  const trustedDomains = ['nytimes.com', 'washingtonpost.com', 'reuters.com', 'apnews.com'];
  const hasTrustedDomain = validCreds.some(cred =>
    trustedDomains.some(td => cred.domain.includes(td))
  );

  if (hasTrustedDomain) return 1.0;
  if (validCreds.length > 0) return 0.5;
  return 0;
}

function calculateTimeBasedScore(account, config, now) {
  const accountAge = now - account.createdAt;

  if (accountAge < config.minAccountAge) {
    return accountAge / config.minAccountAge * 0.5;
  }

  const monthsOld = accountAge / (30 * 24 * 60 * 60 * 1000);
  const score = Math.min(1.0, 0.5 + (monthsOld / 12) * 0.5);

  return score;
}
