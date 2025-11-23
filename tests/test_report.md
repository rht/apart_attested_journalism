================================================================================
NETWORK TRUST ANALYSIS
================================================================================

Observer Node (Point of View):
-------------------------------------------
  legitimate-0 (0x6157364aB3A83aA357f769Af11314B0b573C91C1)

All trust scores are calculated from this node's perspective.

Analyzing Legitimate Network...
-------------------------------------------
  legitimate-0: 27.04% (x509: 100.0%, peer: 0.0%, time: 0.5%, graph: 7.9%)
  legitimate-1: 27.78% (x509: 100.0%, peer: 0.0%, time: 0.5%, graph: 10.8%)
  legitimate-2: 27.76% (x509: 100.0%, peer: 0.0%, time: 0.5%, graph: 10.8%)
  legitimate-3: 15.24% (x509: 50.0%, peer: 0.0%, time: 0.5%, graph: 10.6%)
  legitimate-4: 15.30% (x509: 50.0%, peer: 0.0%, time: 0.5%, graph: 10.9%)
  legitimate-5: 27.88% (x509: 100.0%, peer: 0.0%, time: 0.5%, graph: 11.2%)
  legitimate-6: 27.98% (x509: 100.0%, peer: 0.0%, time: 0.5%, graph: 11.6%)
  legitimate-7: 27.27% (x509: 100.0%, peer: 0.0%, time: 0.5%, graph: 8.8%)
  legitimate-8: 14.70% (x509: 50.0%, peer: 0.0%, time: 0.5%, graph: 8.5%)
  legitimate-9: 14.63% (x509: 50.0%, peer: 0.0%, time: 0.5%, graph: 8.2%)

Analyzing Sybil Network...
-------------------------------------------
  sybil-0: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-1: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-2: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-3: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-4: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-5: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-6: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-7: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-8: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-9: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-10: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-11: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-12: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-13: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-14: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-15: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-16: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-17: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-18: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)
  sybil-19: 0.08% (x509: 0.0%, peer: 0.0%, time: 0.5%, graph: 0.0%)

================================================================================
STATISTICAL SUMMARY
================================================================================

Overall Trust Score Statistics:
-------------------------------------------
Legitimate Network:
  Mean:   22.56%
  Median: 27.27%
  Range:  14.63% - 27.98%
  StdDev: 6.21%

Sybil Network:
  Mean:   0.08%
  Median: 0.08%
  Range:  0.08% - 0.08%
  StdDev: 0.00%

Component Score Comparison:
-------------------------------------------

X.509 Credentials:
  Legitimate: 80.00%
  Sybil:      0.00%
  Difference: +80.00%

Peer Votes:
  Legitimate: 0.00%
  Sybil:      0.00%
  Difference: +0.00%

Time-Based:
  Legitimate: 0.50%
  Sybil:      0.50%
  Difference: -0.00%

Graph (EigenTrust):
  Legitimate: 9.93%
  Sybil:      0.03%
  Difference: +9.90%

Detection Effectiveness Analysis:
-------------------------------------------
  Overall Trust Score Gap: 22.47% (99.6% relative difference)

  ✓ GOOD: Clear separation between legitimate and sybil networks
    The system effectively distinguishes sybil accounts from legitimate ones.

Credential Coverage:
-------------------------------------------
  Legitimate accounts with X.509 credentials: 10/10 (100.0%)
  Sybil accounts with X.509 credentials:      0/20 (0.0%)

================================================================================
Detailed results saved to: tests/analysis-results.json
