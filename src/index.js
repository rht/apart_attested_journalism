#!/usr/bin/env node

import { Command } from 'commander';
import { trustCommand } from './commands/trust.js';
import { inspectCommand } from './commands/inspect.js';
import { mintCommand } from './commands/mint.js';
import { loadConfig, saveConfig } from './storage.js';

const program = new Command();

program
  .name('tn')
  .description('TrustNet - CLI for attested journalism trust network')
  .version('1.0.0')
  .option('-c, --config <path>', 'Path to credentials.json file');

program
  .command('trust <address>')
  .description('Submit a trust vote for an address')
  .option('-d, --distrust', 'Submit a distrust vote instead')
  .option('-s, --server <url>', 'Ledger server URL', 'http://localhost:3000')
  .action((address, options, command) => {
    const globalOpts = command.parent.opts();
    trustCommand(address, { ...options, configPath: globalOpts.config });
  });

program
  .command('inspect <address>')
  .description('Inspect trust vector for an address')
  .option('-v, --verbose', 'Show detailed vote information')
  .action((address, options, command) => {
    const globalOpts = command.parent.opts();
    inspectCommand(address, { ...options, configPath: globalOpts.config });
  });

program
  .command('mint <type>')
  .description('Mint a credential (types: email, account)')
  .option('-e, --email <email>', 'Email address for email proof')
  .action((type, options, command) => {
    const globalOpts = command.parent.opts();
    mintCommand(type, { ...options, configPath: globalOpts.config });
  });

program
  .command('config')
  .description('View or update configuration')
  .option('--min-account-age <days>', 'Minimum account age in days')
  .option('--min-attestation-age <days>', 'Minimum attestation age in days')
  .option('--eigen-iterations <num>', 'EigenTrust iterations')
  .option('--eigen-epsilon <num>', 'EigenTrust convergence threshold')
  .option('--time-decay <num>', 'Time decay factor (0-1)')
  .action((options) => {
    const config = loadConfig();

    if (options.minAccountAge) {
      config.minAccountAge = parseInt(options.minAccountAge) * 24 * 60 * 60 * 1000;
    }
    if (options.minAttestationAge) {
      config.minAttestationAge = parseInt(options.minAttestationAge) * 24 * 60 * 60 * 1000;
    }
    if (options.eigenIterations) {
      config.eigenTrustIterations = parseInt(options.eigenIterations);
    }
    if (options.eigenEpsilon) {
      config.eigenTrustEpsilon = parseFloat(options.eigenEpsilon);
    }
    if (options.timeDecay) {
      config.timeDecayFactor = parseFloat(options.timeDecay);
    }

    saveConfig(config);

    console.log('\nCurrent Configuration:');
    console.log(`  Min Account Age: ${config.minAccountAge / (24 * 60 * 60 * 1000)} days`);
    console.log(`  Min Attestation Age: ${config.minAttestationAge / (24 * 60 * 60 * 1000)} days`);
    console.log(`  EigenTrust Iterations: ${config.eigenTrustIterations}`);
    console.log(`  EigenTrust Epsilon: ${config.eigenTrustEpsilon}`);
    console.log(`  Time Decay Factor: ${config.timeDecayFactor}\n`);
  });

program.parse();
