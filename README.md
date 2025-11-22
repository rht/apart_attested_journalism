# TrustNet

CLI for attested journalism trust network with sybil attack detection.

## Overview

TrustNet creates a trust graph of journalists' public-key-based accounts on top of the Aqua data provenance protocol, making it computationally and economically expensive for attackers to orchestrate botnet-driven misinformation campaigns.

Trust is modeled as a multidimensional vector with four components:

1. **X.509 Credentials**: Domain authority-issued certificates (e.g., email ownership proof)
2. **Peer-to-Peer Votes**: Community-driven reputation (PGP web of trust style)
3. **Time-Based Trust**: Account age and attestation timing evaluation
4. **Graph-Based Trust**: EigenTrust algorithm for transitive trust propagation

## Installation

```bash
npm install
chmod +x src/index.js
npm link
```

## Quick Start

### 1. Start the Mock Ledger Server

In one terminal:

```bash
npm run server
```

The server runs on `http://localhost:3000`.

### 2. Register Your Account

```bash
npm exec tn mint account
```

This creates a wallet if you don't have one and registers your address in the network.

### 3. Submit a Trust Vote

```bash
npm exec tn trust 0x1234567890123456789012345678901234567890
```

To submit a distrust vote:

```bash
npm exec tn trust 0x1234567890123456789012345678901234567890 --distrust
```

### 4. Inspect Trust Vector

```bash
npm exec tn inspect 0x1234567890123456789012345678901234567890
```

With detailed vote information:

```bash
npm exec tn inspect 0x1234567890123456789012345678901234567890 --verbose
```

### 5. Mint Email Proof Credential

```bash
npm exec tn mint email --email journalist@nytimes.com
```

This creates an Aqua-verified credential linking your Ethereum address to your email domain.

## Configuration

View current configuration:

```bash
npm exec tn config
```

Update configuration:

```bash
npm exec tn config --min-account-age 30 --min-attestation-age 7
npm exec tn config --eigen-iterations 25 --eigen-epsilon 0.0001
npm exec tn config --time-decay 0.6
```

Configuration parameters:
- `min-account-age`: Minimum account age in days (default: 30)
- `min-attestation-age`: Minimum attestation age in days (default: 7)
- `eigen-iterations`: EigenTrust algorithm iterations (default: 20)
- `eigen-epsilon`: EigenTrust convergence threshold (default: 0.001)
- `time-decay`: Time-based trust decay factor (default: 0.5)

## Trust Vector Components

### X.509 Score (25% weight)
- Based on domain credentials verified via Aqua protocol
- Trusted domains (NYTimes, Reuters, AP, etc.) score 1.0
- Other verified domains score 0.5
- No credentials score 0

### Peer Vote Score (35% weight)
- Binary trust/distrust votes from network participants
- Only counts attestations older than `min-attestation-age`
- Score = positive votes / total votes

### Time-Based Score (15% weight)
- Accounts younger than `min-account-age` receive reduced scores
- Score increases with account age up to 12 months
- Newer accounts start at 0-50% of maximum score

### Graph Score (25% weight)
- EigenTrust algorithm for transitive trust computation
- If C trusts B and B trusts A, then C partially trusts A
- Iteratively converges to global trust distribution
- Resistant to sybil attacks through trust propagation

### Overall Score
Weighted sum of all components, normalized to 0-100%.

## Wallet Management

TrustNet looks for credentials in:
1. `./credentials.json` (mnemonic field)
2. `./.env` (MNEMONIC field)
3. Creates new random wallet if none found

Example `credentials.json`:
```json
{
  "mnemonic": "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12",
  "alchemy_key": "your-alchemy-api-key",
  "witness_eth_network": "sepolia",
  "witness_method": "metamask"
}
```

Example `.env`:
```
MNEMONIC=word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12
ALCHEMY_KEY=your-alchemy-api-key
```

## Architecture

```
src/
├── index.js              # CLI entry point
├── server.js             # Mock ledger REST API
├── storage.js            # Data persistence
├── crypto.js             # Ethereum signing utilities
├── eigentrust.js         # EigenTrust algorithm
├── trust.js              # Trust vector calculation
└── commands/
    ├── trust.js          # Vote submission
    ├── inspect.js        # Trust inspection
    └── mint.js           # Credential minting
data/
├── votes.json            # Vote ledger
├── accounts.json         # Account registry
└── config.json           # System configuration
credentials/              # Aqua-verified credentials
```

## API Endpoints

The mock ledger server provides:

- `POST /api/vote` - Submit signed vote
- `GET /api/votes?address=<addr>` - Query votes for address
- `GET /api/votes/<address>` - Get received/sent votes

## Example Workflow

```bash
# Terminal 1: Start server
npm run server

# Terminal 2: Set up accounts
tn mint account
ALICE=$(cat data/accounts.json | jq -r 'keys[0]')

# Create another wallet for Bob (in separate directory or modify credentials)
tn mint account
BOB=$(cat data/accounts.json | jq -r 'keys[1]')

# Mint email credential
tn mint email --email alice@nytimes.com

# Alice trusts Bob
tn trust $BOB

# Inspect Bob's trust
tn inspect $BOB --verbose

# Inspect Alice's trust
tn inspect $ALICE --verbose
```

## Security Considerations

- All votes are cryptographically signed with Ethereum private keys
- Signature verification happens server-side
- Vote timestamps are tamper-evident
- EigenTrust algorithm provides sybil resistance
- Time-based scoring prevents new account attacks
- Aqua protocol ensures credential provenance

## License

Apache-2.0

## Future Work

- Decentralized ledger integration (replace mock server)
- Additional credential types (GitHub, Twitter/X verification)
- Advanced graph algorithms (PageRank variants)
- Revocation mechanisms for compromised keys
- Federation between multiple trust networks
