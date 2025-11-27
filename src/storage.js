// Browser-compatible storage module
// Supports both Node.js (fs-based) and browser (in-memory) contexts

let isBrowser = false;
let browserData = { votes: [], accounts: {}, config: {} };

// Detect browser environment
try {
  if (typeof window !== 'undefined') {
    isBrowser = true;
  }
} catch (e) {
  isBrowser = false;
}

// Node.js imports (only loaded in Node.js context)
let fs, path, DATA_DIR, VOTES_FILE, ACCOUNTS_FILE, CONFIG_FILE;

if (!isBrowser) {
  fs = await import('fs');
  path = await import('path');
  DATA_DIR = path.join(import.meta.dirname, 'data');
  VOTES_FILE = path.join(DATA_DIR, 'votes.json');
  ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
  CONFIG_FILE = path.join(DATA_DIR, 'config.json');
}

export function setBrowserData(votes, accounts, config) {
  if (isBrowser) {
    browserData.votes = votes;
    browserData.accounts = accounts;
    browserData.config = config;
  }
}

export function ensureDataDir() {
  if (isBrowser) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadVotes() {
  if (isBrowser) return browserData.votes;
  ensureDataDir();
  if (!fs.existsSync(VOTES_FILE)) return [];
  return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
}

export function saveVotes(votes) {
  if (isBrowser) {
    browserData.votes = votes;
    return;
  }
  ensureDataDir();
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

export function loadAccounts() {
  if (isBrowser) return browserData.accounts;
  ensureDataDir();
  if (!fs.existsSync(ACCOUNTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
}

export function saveAccounts(accounts) {
  if (isBrowser) {
    browserData.accounts = accounts;
    return;
  }
  ensureDataDir();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

export function loadConfig() {
  if (isBrowser) return browserData.config;
  ensureDataDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      minAccountAge: 30 * 24 * 60 * 60 * 1000,
      minAttestationAge: 7 * 24 * 60 * 60 * 1000,
      eigenTrustIterations: 20,
      eigenTrustEpsilon: 0.001,
      timeDecayFactor: 0.5
    };
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveConfig(config) {
  if (isBrowser) {
    browserData.config = config;
    return;
  }
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
