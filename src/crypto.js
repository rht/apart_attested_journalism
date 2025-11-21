import { ethers } from 'ethers';
import fs from 'fs';

export function loadWallet() {
  if (fs.existsSync('./credentials.json')) {
    const creds = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));
    if (creds.mnemonic) {
      return ethers.Wallet.fromPhrase(creds.mnemonic);
    }
  }

  if (fs.existsSync('./.env')) {
    const envContent = fs.readFileSync('./.env', 'utf-8');
    const match = envContent.match(/MNEMONIC=(.+)/);
    if (match) {
      return ethers.Wallet.fromPhrase(match[1].trim());
    }
  }

  const wallet = ethers.Wallet.createRandom();
  console.log('Created new wallet:', wallet.address);
  console.log('Save this mnemonic:', wallet.mnemonic.phrase);
  return wallet;
}

export async function signVote(wallet, voteData) {
  const message = JSON.stringify(voteData);
  const signature = await wallet.signMessage(message);
  return { vote: voteData, signature };
}

export function verifyVoteSignature(signedVote) {
  const message = JSON.stringify(signedVote.vote);
  const recoveredAddress = ethers.verifyMessage(message, signedVote.signature);
  return recoveredAddress.toLowerCase() === signedVote.vote.from.toLowerCase();
}
