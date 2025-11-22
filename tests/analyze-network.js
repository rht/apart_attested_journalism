#!/usr/bin/env node

/**
 * Network Trust Analysis Script
 *
 * Analyzes trust scores across legitimate and sybil networks
 * to demonstrate the effectiveness of sybil attack detection.
 *
 * Usage:
 *   node analyze-network.js
 *
 * Requirements:
 *   - Must run after setup-sybil-test.sh
 *   - Mock ledger server must be running
 *   - tests/addresses.json must exist
 */

import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Get trust score for an address using the CLI with --json flag
 */
function getTrustScore(address, configFile) {
  try {
    const configFlag = configFile ? `--config ${configFile}` : '';
    const cmd = `npm exec tn -- ${configFlag} inspect ${address} --json`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

    // Parse JSON output (much cleaner than regex!)
    const data = JSON.parse(output);

    return {
      overall: data.overallScore * 100,  // Convert to percentage
      x509: data.componentScores.x509 * 100,
      peer: data.componentScores.peerVote * 100,
      time: data.componentScores.timeBased * 100,
      graph: data.componentScores.graph * 100,
      accountAge: data.accountAgeDays,
      credentials: data.x509Credentials || []
    };
  } catch (error) {
    console.error(`Error getting trust score for ${address}:`, error.message);
    return {
      overall: 0,
      x509: 0,
      peer: 0,
      time: 0,
      graph: 0,
      accountAge: 0,
      credentials: []
    };
  }
}

/**
 * Calculate statistics for a set of scores
 */
function calculateStats(scores, component = 'overall') {
  const values = scores.map(s => s[component]);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate standard deviation
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return { mean, median, min, max, stdDev };
}

/**
 * Main analysis function
 */
async function analyzeNetwork() {
  console.log('================================================================================');
  console.log('NETWORK TRUST ANALYSIS');
  console.log('================================================================================');
  console.log('');

  // Check if addresses file exists
  if (!fs.existsSync('tests/addresses.json')) {
    console.error('Error: tests/addresses.json not found');
    console.error('Please run setup-sybil-test.sh first');
    process.exit(1);
  }

  // Load addresses
  const addresses = JSON.parse(fs.readFileSync('tests/addresses.json', 'utf-8'));

  console.log('Analyzing Legitimate Network...');
  console.log('-------------------------------------------');

  const legitimateScores = [];
  for (const account of addresses.legitimate) {
    const score = getTrustScore(account.address, `tests/credentials/legitimate/${account.id}.json`);
    legitimateScores.push(score);
    console.log(`  ${account.id}: ${score.overall.toFixed(2)}% (x509: ${score.x509.toFixed(1)}%, peer: ${score.peer.toFixed(1)}%, time: ${score.time.toFixed(1)}%, graph: ${score.graph.toFixed(1)}%)`);
  }

  console.log('');
  console.log('Analyzing Sybil Network...');
  console.log('-------------------------------------------');

  const sybilScores = [];
  for (const account of addresses.sybil) {
    const score = getTrustScore(account.address, `tests/credentials/sybil/${account.id}.json`);
    sybilScores.push(score);
    console.log(`  ${account.id}: ${score.overall.toFixed(2)}% (x509: ${score.x509.toFixed(1)}%, peer: ${score.peer.toFixed(1)}%, time: ${score.time.toFixed(1)}%, graph: ${score.graph.toFixed(1)}%)`);
  }

  console.log('');
  console.log('================================================================================');
  console.log('STATISTICAL SUMMARY');
  console.log('================================================================================');

  // Overall scores
  const legitStats = calculateStats(legitimateScores, 'overall');
  const sybilStats = calculateStats(sybilScores, 'overall');

  console.log('');
  console.log('Overall Trust Score Statistics:');
  console.log('-------------------------------------------');
  console.log(`Legitimate Network:`);
  console.log(`  Mean:   ${legitStats.mean.toFixed(2)}%`);
  console.log(`  Median: ${legitStats.median.toFixed(2)}%`);
  console.log(`  Range:  ${legitStats.min.toFixed(2)}% - ${legitStats.max.toFixed(2)}%`);
  console.log(`  StdDev: ${legitStats.stdDev.toFixed(2)}%`);

  console.log('');
  console.log(`Sybil Network:`);
  console.log(`  Mean:   ${sybilStats.mean.toFixed(2)}%`);
  console.log(`  Median: ${sybilStats.median.toFixed(2)}%`);
  console.log(`  Range:  ${sybilStats.min.toFixed(2)}% - ${sybilStats.max.toFixed(2)}%`);
  console.log(`  StdDev: ${sybilStats.stdDev.toFixed(2)}%`);

  // Component breakdown
  console.log('');
  console.log('Component Score Comparison:');
  console.log('-------------------------------------------');

  const components = ['x509', 'peer', 'time', 'graph'];
  const componentNames = {
    x509: 'X.509 Credentials',
    peer: 'Peer Votes',
    time: 'Time-Based',
    graph: 'Graph (EigenTrust)'
  };

  for (const comp of components) {
    const legitComp = calculateStats(legitimateScores, comp);
    const sybilComp = calculateStats(sybilScores, comp);
    const diff = legitComp.mean - sybilComp.mean;

    console.log(`\n${componentNames[comp]}:`);
    console.log(`  Legitimate: ${legitComp.mean.toFixed(2)}%`);
    console.log(`  Sybil:      ${sybilComp.mean.toFixed(2)}%`);
    console.log(`  Difference: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`);
  }

  console.log('');
  console.log('Detection Effectiveness Analysis:');
  console.log('-------------------------------------------');
  const diff = legitStats.mean - sybilStats.mean;
  const diffPercent = (diff / legitStats.mean) * 100;
  console.log(`  Overall Trust Score Gap: ${diff.toFixed(2)}% (${diffPercent.toFixed(1)}% relative difference)`);
  console.log('');

  if (diff > 30) {
    console.log('  ✓ EXCELLENT: Very clear separation between networks');
    console.log('    The system successfully identifies sybil accounts with significantly lower trust.');
  } else if (diff > 20) {
    console.log('  ✓ GOOD: Clear separation between legitimate and sybil networks');
    console.log('    The system effectively distinguishes sybil accounts from legitimate ones.');
  } else if (diff > 10) {
    console.log('  ~ MODERATE: Some separation between networks');
    console.log('    The system shows sybil detection capability but could be improved.');
  } else {
    console.log('  ✗ POOR: Insufficient separation');
    console.log('    The system struggles to distinguish sybil accounts from legitimate ones.');
  }

  // Credential analysis
  const legitWithCreds = legitimateScores.filter(s => s.credentials.length > 0).length;
  const sybilWithCreds = sybilScores.filter(s => s.credentials.length > 0).length;

  console.log('');
  console.log('Credential Coverage:');
  console.log('-------------------------------------------');
  console.log(`  Legitimate accounts with X.509 credentials: ${legitWithCreds}/${legitimateScores.length} (${(legitWithCreds / legitimateScores.length * 100).toFixed(1)}%)`);
  console.log(`  Sybil accounts with X.509 credentials:      ${sybilWithCreds}/${sybilScores.length} (${(sybilWithCreds / sybilScores.length * 100).toFixed(1)}%)`);

  console.log('');
  console.log('================================================================================');

  // Save results to JSON
  const results = {
    timestamp: new Date().toISOString(),
    legitimate: {
      scores: legitimateScores,
      statistics: {
        overall: legitStats,
        components: {
          x509: calculateStats(legitimateScores, 'x509'),
          peer: calculateStats(legitimateScores, 'peer'),
          time: calculateStats(legitimateScores, 'time'),
          graph: calculateStats(legitimateScores, 'graph')
        }
      },
      credentialCoverage: legitWithCreds / legitimateScores.length
    },
    sybil: {
      scores: sybilScores,
      statistics: {
        overall: sybilStats,
        components: {
          x509: calculateStats(sybilScores, 'x509'),
          peer: calculateStats(sybilScores, 'peer'),
          time: calculateStats(sybilScores, 'time'),
          graph: calculateStats(sybilScores, 'graph')
        }
      },
      credentialCoverage: sybilWithCreds / sybilScores.length
    },
    comparison: {
      overallDifference: diff,
      percentDifference: diffPercent,
      componentDifferences: {
        x509: calculateStats(legitimateScores, 'x509').mean - calculateStats(sybilScores, 'x509').mean,
        peer: calculateStats(legitimateScores, 'peer').mean - calculateStats(sybilScores, 'peer').mean,
        time: calculateStats(legitimateScores, 'time').mean - calculateStats(sybilScores, 'time').mean,
        graph: calculateStats(legitimateScores, 'graph').mean - calculateStats(sybilScores, 'graph').mean
      }
    }
  };

  fs.writeFileSync('tests/analysis-results.json', JSON.stringify(results, null, 2));
  console.log('Detailed results saved to: tests/analysis-results.json');
  console.log('');
}

// Run analysis
analyzeNetwork().catch(error => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
