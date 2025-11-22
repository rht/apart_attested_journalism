import { calculateTrustVector } from '../trust.js';
import { loadVotes } from '../storage.js';
import { loadWallet, loadDampingFactor } from '../crypto.js';

export async function inspectCommand(address, options) {
  try {
    // Load damping factor and querying address from credentials
    const dampingFactor = loadDampingFactor(options.configPath);
    const wallet = loadWallet(options.configPath);
    const queryingAddress = wallet.address;

    const trustVector = calculateTrustVector(address, dampingFactor, queryingAddress);

    if (options.json) {
      // JSON output mode
      const output = {
        address: address,
        overallScore: trustVector.overallScore,
        dampingFactor: trustVector.dampingFactor,
        componentScores: {
          x509: trustVector.x509Score,
          peerVote: trustVector.peerVoteScore,
          timeBased: trustVector.timeBasedScore,
          graph: trustVector.graphScore
        },
        accountAgeDays: Math.floor(trustVector.metadata.accountAge / (24 * 60 * 60 * 1000)),
        x509Credentials: trustVector.metadata.x509Credentials
      };

      if (options.verbose) {
        const votes = loadVotes();
        const received = votes.filter(v => v.vote.to.toLowerCase() === address.toLowerCase());
        const sent = votes.filter(v => v.vote.from.toLowerCase() === address.toLowerCase());

        output.votesReceived = received.map(v => ({
          from: v.vote.from,
          trust: v.vote.trust,
          timestamp: v.vote.timestamp
        }));

        output.votesSent = sent.map(v => ({
          to: v.vote.to,
          trust: v.vote.trust,
          timestamp: v.vote.timestamp
        }));
      }

      console.log(JSON.stringify(output, null, 2));
    } else {
      // Human-readable output mode
      console.log(`\n═══════════════════════════════════════════════════════`);
      console.log(`  Trust Vector for ${address}`);
      console.log(`═══════════════════════════════════════════════════════`);
      console.log(`\n  Overall Trust Score: ${(trustVector.overallScore * 100).toFixed(2)}%`);
      console.log(`\n  Damping Factor: ${trustVector.dampingFactor}`);
      console.log(`\n  Component Scores:`);
      console.log(`    X.509 Credentials:  ${(trustVector.x509Score * 100).toFixed(2)}%`);
      console.log(`    Peer Votes:         ${(trustVector.peerVoteScore * 100).toFixed(2)}%`);
      console.log(`    Time-Based:         ${(trustVector.timeBasedScore * 100).toFixed(2)}%`);
      console.log(`    Graph (EigenTrust): ${(trustVector.graphScore * 100).toFixed(2)}%`);

      const accountAgeDays = Math.floor(trustVector.metadata.accountAge / (24 * 60 * 60 * 1000));
      console.log(`\n  Account Age: ${accountAgeDays} days`);

      if (trustVector.metadata.x509Credentials.length > 0) {
        console.log(`\n  X.509 Credentials (${trustVector.metadata.x509Credentials.length}):`);
        trustVector.metadata.x509Credentials.forEach(cred => {
          console.log(`    • ${cred.domain} (${cred.issuer})`);
        });
      } else {
        console.log(`\n  X.509 Credentials: None`);
      }

      if (options.verbose) {
        const votes = loadVotes();
        const received = votes.filter(v => v.vote.to.toLowerCase() === address.toLowerCase());
        const sent = votes.filter(v => v.vote.from.toLowerCase() === address.toLowerCase());

        console.log(`\n  Votes Received: ${received.length}`);
        received.forEach(v => {
          const trust = v.vote.trust ? 'TRUST' : 'DISTRUST';
          console.log(`    ${trust} from ${v.vote.from}`);
        });

        console.log(`\n  Votes Sent: ${sent.length}`);
        sent.forEach(v => {
          const trust = v.vote.trust ? 'TRUST' : 'DISTRUST';
          console.log(`    ${trust} to ${v.vote.to}`);
        });
      }

      console.log(`\n═══════════════════════════════════════════════════════\n`);
    }
  } catch (error) {
    console.error('Error inspecting address:', error.message);
  }
}
