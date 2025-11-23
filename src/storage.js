import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// THIS file is in: src/storage.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory is ALWAYS: src/data/
const DATA_DIR = path.join(__dirname, 'data');

const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadVotes() {
  ensureDataDir();
  if (!fs.existsSync(VOTES_FILE)) return [];
  return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
}

export function saveVotes(votes) {
  ensureDataDir();
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

export function loadAccounts() {
  ensureDataDir();
  if (!fs.existsSync(ACCOUNTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
}

export function saveAccounts(accounts) {
  ensureDataDir();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

export function loadConfig() {
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
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
