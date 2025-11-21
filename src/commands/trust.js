import { loadWallet, signVote } from '../crypto.js';

export async function trustCommand(targetAddress, options) {
  try {
    const wallet = loadWallet();
    const trust = !options.distrust;

    const voteData = {
      from: wallet.address,
      to: targetAddress,
      trust,
      timestamp: Date.now()
    };

    const signedVote = await signVote(wallet, voteData);

    const serverUrl = options.server || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signedVote)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to submit vote:', result.error);
      return;
    }

    console.log(`✓ Vote submitted successfully`);
    console.log(`  From: ${wallet.address}`);
    console.log(`  To: ${targetAddress}`);
    console.log(`  Trust: ${trust}`);
    console.log(`  TX Hash: ${result.txHash}`);
  } catch (error) {
    console.error('Error submitting vote:', error.message);
  }
}
