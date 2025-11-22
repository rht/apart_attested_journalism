#!/usr/bin/env node

/**
 * Deterministic Wallet Generator
 *
 * Generates a deterministic set of test mnemonics and wallet credentials
 * for simulating trust networks and sybil attacks.
 *
 * Usage:
 *   node generate-wallets.js <count> <prefix>
 *
 * Example:
 *   node generate-wallets.js 10 legitimate
 *   node generate-wallets.js 20 sybil
 */

import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs';

/**
 * Generate a deterministic mnemonic from a seed string
 * Uses SHA-256 hash as entropy source for reproducibility
 */
function generateDeterministicMnemonic(seed) {
  // Create deterministic entropy (32 bytes = 256 bits for 24-word mnemonic)
  const hash = crypto.createHash('sha256').update(seed).digest();

  // Use ethers to create mnemonic from entropy
  const mnemonic = ethers.Mnemonic.fromEntropy(hash);
  return mnemonic.phrase;
}

/**
 * Generate multiple deterministic wallet credentials
 */
function generateWallets(count, seedPrefix) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const seed = `${seedPrefix}-${i}`;
    const mnemonic = generateDeterministicMnemonic(seed);
    const wallet = ethers.Wallet.fromPhrase(mnemonic);

    wallets.push({
      id: `${seedPrefix}-${i}`,
      address: wallet.address,
      mnemonic: mnemonic,
      seed: seed
    });
  }

  return wallets;
}

/**
 * Save wallet credentials to JSON files
 */
function saveWalletCredentials(wallets, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  wallets.forEach(wallet => {
    const filename = `${outputDir}/${wallet.id}.json`;
    const credentials = {
      mnemonic: wallet.mnemonic,
      dampingFactor: 0.2
    };
    fs.writeFileSync(filename, JSON.stringify(credentials, null, 2));
  });

  // Also save a summary file
  const summary = wallets.map(w => ({
    id: w.id,
    address: w.address,
    seed: w.seed,
    credentialFile: `${w.id}.json`
  }));

  fs.writeFileSync(
    `${outputDir}/wallets-summary.json`,
    JSON.stringify(summary, null, 2)
  );

  return summary;
}

// CLI execution
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node generate-wallets.js <count> <prefix>');
    console.error('Example: node generate-wallets.js 10 legitimate');
    process.exit(1);
  }

  const count = parseInt(args[0]);
  const prefix = args[1];

  if (isNaN(count) || count <= 0) {
    console.error('Count must be a positive integer');
    process.exit(1);
  }

  console.log(`Generating ${count} deterministic wallets with prefix "${prefix}"...`);

  const wallets = generateWallets(count, prefix);
  const outputDir = `tests/credentials/${prefix}`;
  const summary = saveWalletCredentials(wallets, outputDir);

  console.log(`\nGenerated ${wallets.length} wallets:`);
  summary.forEach(w => {
    console.log(`  ${w.id}: ${w.address}`);
  });

  console.log(`\nCredentials saved to: ${outputDir}/`);
  console.log(`Summary saved to: ${outputDir}/wallets-summary.json`);
}

export { generateDeterministicMnemonic, generateWallets, saveWalletCredentials };
