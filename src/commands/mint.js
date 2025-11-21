import Aquafier from 'aqua-js-sdk';
import fs from 'fs';
import { loadWallet } from '../crypto.js';
import { loadAccounts, saveAccounts } from '../storage.js';

export async function mintCommand(type, options) {
  try {
    const wallet = loadWallet();

    if (type === 'email') {
      await mintEmailProof(wallet, options);
    } else if (type === 'account') {
      await mintAccount(wallet, options);
    } else {
      console.error(`Unknown credential type: ${type}`);
      console.log('Available types: email, account');
    }
  } catch (error) {
    console.error('Error minting credential:', error.message);
  }
}

async function mintEmailProof(wallet, options) {
  const email = options.email;
  const domain = email.split('@')[1];

  if (!email || !email.includes('@')) {
    console.error('Invalid email format. Use: tn mint email --email user@domain.com');
    return;
  }

  console.log('Minting email proof credential...');
  console.log(`  Email: ${email}`);
  console.log(`  Domain: ${domain}`);
  console.log(`  Address: ${wallet.address}`);

  const credData = {
    type: 'email-proof',
    email,
    domain,
    address: wallet.address,
    timestamp: Date.now()
  };

  const fileObject = {
    fileName: `email-proof-${wallet.address}.json`,
    fileContent: JSON.stringify(credData, null, 2),
    path: `./credentials/email-proof-${wallet.address}.json`
  };

  let creds = {
    did_key: wallet.privateKey.slice(2),
    mnemonic: wallet.mnemonic?.phrase || '',
    alchemy_key: process.env.ALCHEMY_KEY || '',
    nostr_sk: '',
    witness_eth_network: 'sepolia',
    witness_method: 'metamask'
  };

  if (fs.existsSync('./credentials.json')) {
    creds = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));
  }

  const aquafier = new Aquafier();
  const genesisResult = await aquafier.createGenesisRevision(fileObject);

  if (!genesisResult.isOk()) {
    console.error('Failed to create genesis revision:', genesisResult.data);
    return;
  }

  const aquaWrapper = {
    aquaTree: genesisResult.data.aquaTree,
    fileObject,
    revision: ''
  };

  const signedResult = await aquafier.signAquaTree(aquaWrapper, 'cli', creds, true);

  if (!signedResult.isOk()) {
    console.error('Failed to sign credential:', signedResult.data);
    return;
  }

  const verificationHash = signedResult.data.aquaTree.treeMapping.latestHash;

  const accounts = loadAccounts();
  const address = wallet.address.toLowerCase();

  if (!accounts[address]) {
    accounts[address] = {
      address,
      createdAt: Date.now(),
      credentials: []
    };
  }

  accounts[address].credentials.push({
    domain,
    issuer: 'self',
    issuedAt: Date.now(),
    verificationHash
  });

  saveAccounts(accounts);

  if (!fs.existsSync('./credentials')) {
    fs.mkdirSync('./credentials', { recursive: true });
  }
  fs.writeFileSync(fileObject.path, fileObject.fileContent);
  fs.writeFileSync(
    `${fileObject.path}.aqua.json`,
    JSON.stringify(signedResult.data.aquaTree, null, 2)
  );

  console.log('✓ Email proof credential minted successfully');
  console.log(`  Verification Hash: ${verificationHash}`);
  console.log(`  Saved to: ${fileObject.path}`);
}

async function mintAccount(wallet, options) {
  console.log('Registering account in trust network...');
  console.log(`  Address: ${wallet.address}`);

  const accounts = loadAccounts();
  const address = wallet.address.toLowerCase();

  if (accounts[address]) {
    console.log('✓ Account already registered');
    console.log(`  Created: ${new Date(accounts[address].createdAt).toISOString()}`);
    return;
  }

  accounts[address] = {
    address,
    createdAt: Date.now(),
    credentials: []
  };

  saveAccounts(accounts);

  console.log('✓ Account registered successfully');
  console.log(`  Created: ${new Date(accounts[address].createdAt).toISOString()}`);
}
