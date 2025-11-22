#!/usr/bin/env bash

##############################################################################
# Sybil Attack Simulation Setup Script
#
# This script creates two communities:
# 1. Legitimate Network: Well-connected journalists with email credentials
# 2. Sybil Network: Attackers with dense internal connections but sparse
#    connections to the legitimate network
#
# Usage:
#   ./setup-sybil-test.sh [options]
#
# Options:
#   --legitimate-count N    Number of legitimate accounts (default: 10)
#   --sybil-count N        Number of sybil accounts (default: 20)
#   --bridge-connections N  Number of connections between networks (default: 2)
#   --clean                Clean existing test data before setup
#
# Requirements:
#   - Mock ledger server must be running (npm run server)
#   - Node.js and npm must be installed
##############################################################################

set -e  # Exit on error

# Default configuration
LEGITIMATE_COUNT=10
SYBIL_COUNT=20
BRIDGE_CONNECTIONS=2
CLEAN_DATA=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --legitimate-count)
      LEGITIMATE_COUNT="$2"
      shift 2
      ;;
    --sybil-count)
      SYBIL_COUNT="$2"
      shift 2
      ;;
    --bridge-connections)
      BRIDGE_CONNECTIONS="$2"
      shift 2
      ;;
    --clean)
      CLEAN_DATA=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--legitimate-count N] [--sybil-count N] [--bridge-connections N] [--clean]"
      exit 1
      ;;
  esac
done

echo "========================================="
echo "Sybil Attack Simulation Setup"
echo "========================================="
echo "Legitimate accounts: $LEGITIMATE_COUNT"
echo "Sybil accounts: $SYBIL_COUNT"
echo "Bridge connections: $BRIDGE_CONNECTIONS"
echo "========================================="
echo ""

# Clean existing test data if requested
if [ "$CLEAN_DATA" = true ]; then
  echo "Cleaning existing test data..."
  rm -rf tests/credentials/
  rm -rf data/
  mkdir -p data
  echo "{}" > data/accounts.json
  echo "[]" > data/votes.json
  echo ""
fi

# Generate deterministic wallets
echo "Step 1: Generating deterministic wallets..."
echo "-------------------------------------------"
node tests/generate-wallets.js $LEGITIMATE_COUNT legitimate
node tests/generate-wallets.js $SYBIL_COUNT sybil
echo ""

# Register all accounts
echo "Step 2: Registering accounts..."
echo "-------------------------------------------"

echo "Registering legitimate accounts..."
for i in $(seq 0 $((LEGITIMATE_COUNT - 1))); do
  npm exec tn -- --config tests/credentials/legitimate/legitimate-$i.json mint account > /dev/null 2>&1
  echo "  Registered legitimate-$i"
done

echo "Registering sybil accounts..."
for i in $(seq 0 $((SYBIL_COUNT - 1))); do
  npm exec tn -- --config tests/credentials/sybil/sybil-$i.json mint account > /dev/null 2>&1
  echo "  Registered sybil-$i"
done
echo ""

# Extract addresses using jq
echo "Step 3: Extracting addresses..."
echo "-------------------------------------------"
declare -a LEGIT_ADDRS
declare -a SYBIL_ADDRS

for i in $(seq 0 $((LEGITIMATE_COUNT - 1))); do
  ADDR=$(cat tests/credentials/legitimate/wallets-summary.json | jq -r ".[$i].address")
  LEGIT_ADDRS[$i]=$ADDR
  echo "  legitimate-$i: $ADDR"
done

for i in $(seq 0 $((SYBIL_COUNT - 1))); do
  ADDR=$(cat tests/credentials/sybil/wallets-summary.json | jq -r ".[$i].address")
  SYBIL_ADDRS[$i]=$ADDR
  echo "  sybil-$i: $ADDR"
done
echo ""

# Mint email credentials for legitimate accounts
echo "Step 4: Minting email credentials for legitimate accounts..."
echo "-------------------------------------------"
TRUSTED_DOMAINS=("nytimes.com" "reuters.com" "apnews.com" "bbc.com" "theguardian.com")

for i in $(seq 0 $((LEGITIMATE_COUNT - 1))); do
  DOMAIN=${TRUSTED_DOMAINS[$((i % ${#TRUSTED_DOMAINS[@]}))]}
  EMAIL="journalist$i@$DOMAIN"
  npm exec tn -- --config tests/credentials/legitimate/legitimate-$i.json mint email --email $EMAIL > /dev/null 2>&1
  echo "  legitimate-$i: $EMAIL"
done
echo ""

# Create trust relationships in legitimate network
echo "Step 5: Creating trust relationships in legitimate network..."
echo "-------------------------------------------"
echo "Building dense connections (each account trusts ~60% of others)..."

for i in $(seq 0 $((LEGITIMATE_COUNT - 1))); do
  # Each legitimate account trusts about 60% of other legitimate accounts
  TRUST_COUNT=$((LEGITIMATE_COUNT * 60 / 100))

  for j in $(seq 0 $((TRUST_COUNT - 1))); do
    TARGET_IDX=$(( (i + j + 1) % LEGITIMATE_COUNT ))
    if [ $TARGET_IDX -ne $i ]; then
      TARGET_ADDR=${LEGIT_ADDRS[$TARGET_IDX]}
      npm exec tn -- --config tests/credentials/legitimate/legitimate-$i.json trust $TARGET_ADDR > /dev/null 2>&1
    fi
  done
  echo "  legitimate-$i created $TRUST_COUNT trust relationships"
done
echo ""

# Create trust relationships in sybil network
echo "Step 6: Creating trust relationships in sybil network..."
echo "-------------------------------------------"
echo "Building very dense connections (each account trusts ~90% of others)..."

for i in $(seq 0 $((SYBIL_COUNT - 1))); do
  # Each sybil account trusts about 90% of other sybil accounts
  TRUST_COUNT=$((SYBIL_COUNT * 90 / 100))

  for j in $(seq 0 $((TRUST_COUNT - 1))); do
    TARGET_IDX=$(( (i + j + 1) % SYBIL_COUNT ))
    if [ $TARGET_IDX -ne $i ]; then
      TARGET_ADDR=${SYBIL_ADDRS[$TARGET_IDX]}
      npm exec tn -- --config tests/credentials/sybil/sybil-$i.json trust $TARGET_ADDR > /dev/null 2>&1
    fi
  done
  echo "  sybil-$i created $TRUST_COUNT trust relationships"
done
echo ""

# Create sparse bridge connections
echo "Step 7: Creating bridge connections between networks..."
echo "-------------------------------------------"
echo "Creating $BRIDGE_CONNECTIONS sparse connections from sybil to legitimate network..."

for i in $(seq 0 $((BRIDGE_CONNECTIONS - 1))); do
  SYBIL_IDX=$((i % SYBIL_COUNT))
  LEGIT_IDX=$((i % LEGITIMATE_COUNT))

  LEGIT_ADDR=${LEGIT_ADDRS[$LEGIT_IDX]}
  npm exec tn -- --config tests/credentials/sybil/sybil-$SYBIL_IDX.json trust $LEGIT_ADDR > /dev/null 2>&1
  echo "  sybil-$SYBIL_IDX -> legitimate-$LEGIT_IDX"
done
echo ""

# Generate analysis report
echo "Step 8: Generating analysis report..."
echo "-------------------------------------------"

cat > tests/network-analysis.txt << EOF
================================================================================
SYBIL ATTACK SIMULATION - NETWORK ANALYSIS
================================================================================
Generated: $(date)

NETWORK CONFIGURATION:
- Legitimate accounts: $LEGITIMATE_COUNT
- Sybil accounts: $SYBIL_COUNT
- Bridge connections: $BRIDGE_CONNECTIONS

LEGITIMATE NETWORK CHARACTERISTICS:
- All accounts have verified email credentials from trusted domains
- Dense trust graph: ~60% connectivity
- Accounts registered at similar times (recent)
- Strong peer-to-peer vote scores
- High X.509 credential scores (trusted domains)

SYBIL NETWORK CHARACTERISTICS:
- No email credentials (or untrusted domains)
- Very dense internal trust graph: ~90% connectivity
- All accounts created simultaneously (red flag)
- High internal peer-to-peer vote scores
- Low X.509 credential scores (no credentials)
- Minimal connections to legitimate network ($BRIDGE_CONNECTIONS connections)

EXPECTED DETECTION RESULTS:
The trust scoring system should detect sybil accounts through:
1. X.509 Score: Sybil accounts lack verified email credentials (0 vs 0.5-1.0)
2. Time-Based Score: All sybil accounts created at same time (temporal clustering)
3. Graph Score: EigenTrust should downweight sybil cluster due to sparse
   connections to high-trust legitimate network
4. Overall: Sybil accounts should score significantly lower (<30%) than
   legitimate accounts (>60%)

ADDRESS MAPPING:
EOF

echo "" >> tests/network-analysis.txt
echo "Legitimate Network:" >> tests/network-analysis.txt
for i in $(seq 0 $((LEGITIMATE_COUNT - 1))); do
  echo "  legitimate-$i: ${LEGIT_ADDRS[$i]}" >> tests/network-analysis.txt
done

echo "" >> tests/network-analysis.txt
echo "Sybil Network:" >> tests/network-analysis.txt
for i in $(seq 0 $((SYBIL_COUNT - 1))); do
  echo "  sybil-$i: ${SYBIL_ADDRS[$i]}" >> tests/network-analysis.txt
done

echo "" >> tests/network-analysis.txt
echo "Bridge Connections:" >> tests/network-analysis.txt
for i in $(seq 0 $((BRIDGE_CONNECTIONS - 1))); do
  SYBIL_IDX=$((i % SYBIL_COUNT))
  LEGIT_IDX=$((i % LEGITIMATE_COUNT))
  echo "  sybil-$SYBIL_IDX (${SYBIL_ADDRS[$SYBIL_IDX]}) -> legitimate-$LEGIT_IDX (${LEGIT_ADDRS[$LEGIT_IDX]})" >> tests/network-analysis.txt
done

echo "" >> tests/network-analysis.txt
echo "================================================================================" >> tests/network-analysis.txt

cat tests/network-analysis.txt
echo ""

# Save addresses to JSON for programmatic access
cat > tests/addresses.json << EOF
{
  "legitimate": [
$(for i in $(seq 0 $((LEGITIMATE_COUNT - 1))); do
  echo "    {\"id\": \"legitimate-$i\", \"address\": \"${LEGIT_ADDRS[$i]}\"}"
  if [ $i -lt $((LEGITIMATE_COUNT - 1)) ]; then echo ","; fi
done)
  ],
  "sybil": [
$(for i in $(seq 0 $((SYBIL_COUNT - 1))); do
  echo "    {\"id\": \"sybil-$i\", \"address\": \"${SYBIL_ADDRS[$i]}\"}"
  if [ $i -lt $((SYBIL_COUNT - 1)) ]; then echo ","; fi
done)
  ]
}
EOF

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo "Credentials saved to: tests/credentials/"
echo "Network analysis: tests/network-analysis.txt"
echo "Address mapping: tests/addresses.json"
echo ""
echo "Next steps:"
echo "  1. Run analysis: npm exec tn inspect <address> --verbose"
echo "  2. Check trust scores: node tests/analyze-network.js"
echo "  3. Inspect specific accounts from tests/addresses.json"
echo ""
