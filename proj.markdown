# Attested Journalism – TrustNet  
**Technical & Theoretical Documentation**  
Apart Research def/acc Hackathon – November 2025  
Apache-2.0 |  pure theory, principles, concepts  

---

### 1. Core Thesis (one sentence)
We apply Bitcoin-style economic + cryptographic + social finality to the problem of journalistic identity and reputation, making misinformation botnets (Sybil attacks) economically and socially prohibitive.

---

### 2. Threat Model
| Attacker Goal                              | Current Cost | Desired Cost After TrustNet |
|--------------------------------------------|--------------|------------------------------|
| Pretend to be 10 000 real journalists     | ~$0          | >$100 000 + real-world identity + years of reputation |
| Flood narrative with coordinated fake news | trivial      | computationally & socially impossible |

---

### 3. Four Layers of Trust – The Multidimensional Vector  
(not a single “trust score” like NewsGuard)

| Layer                        | Technical Mechanism                         | Anti-Sybil Property                            | Real-World Analogy                     |
|------------------------------|---------------------------------------------|--------------------------------------------------|----------------------------------------|
| 1. Real-World Identity       | C2PA + Aqua EmailOwnershipProof (x509-style) | Attacker needs control of nytimes.com, reuters.com, etc. | Press pass + official ID              |
| 2. Direct Peer Vouching      | Ethereum signed messages (PGP Web of Trust) | Need to convince real humans to vouch            | Senior editors signing off on juniors |
| 3. Time Proof                | Age of oldest vouch + credential            | Cannot create 10 000 “6-month-old” accounts overnight | Reputation built over years           |
| 4. Graph Structure / Transitivity | PageRank-style propagation over vouch graph | Isolated bot clusters score near zero            | “Trusted by people who are trusted”   |

Final trust = weighted vector of all four dimensions → nuanced, transparent, attack-resistant.

---

### 4. Key Technical Concepts & Standards

| Concept                        | Standard / Protocol               | Why It Matters                                                                 |
|--------------------------------|-----------------------------------|---------------------------------------------------------------------------------|
| C2PA (Coalition for Content Provenance and Authenticity) | Adobe + Microsoft + NYT + BBC + Twitter | Industry standard for proving who created/modified media |
| Aqua Protocol                  | Open-source C2PA implementation   | Gives us EmailOwnershipProof for free (no cert authority needed)                |
| EIP-191 / Ethereum Signed Messages | `signMessage` with 0x19 prefix     | Globally verifiable identity without spending ETH                               |
| Web of Trust (WoT)             | Same model as PGP since 1992      | Decentralized reputation – no central rating agency                             |
| Sybil Resistance via Cost     | Identity + Time + Social + (future) Economic | Four independent cost layers – attacker must pay all four                       |
| Transitive Trust / EigenTrust / PageRank-lite | Graph algorithms                  | Kills bot farms even if they vouch each other                                   |

---

### 5. Comparison With Existing Solutions

| Project / Tool      | Trust Source            | Sybil Resistance | Transparency | Bias Handling          | Our Advantage |
|---------------------|-------------------------|------------------|--------------|------------------------|-------------|
| NewsGuard           | 20–30 human analysts    | None             | Opaque       | Centralized labels     | Fully decentralized + provable |
| Ground News         | Media bias charts       | None             | Partial      | Left/Right only        | Multidimensional vector + crypto proof |
| Community Notes (X) | Crowd voting            | Weak             | Visible      | Majority can be gamed  | Requires real identity + time + graph math |
| TrustNet (us)       | 4-layer crypto + social | Very high        | Fully auditable | Nuanced vector         | Wins on all axes |

---

### 6. Dialectic Engine – Thesis vs Antithesis Done Right
Instead of “here are two articles, one left one right”, we show:

| Article A                              | Article B                              |
|----------------------------------------|----------------------------------------|
| Author: 0xAlice…                       | Author: 0xBob…                         |
| Proof: alice@nytimes.com (C2PA)        | No email proof                         |
| 312 days old, 47 direct vouches        | Created 3 hours ago, 0 vouches         |
| Transitive score 0.96                  | Transitive score 0.03                  |
| → Reader instantly sees which side has skin in the game |

True dialectic: not “both sides” – but “which side paid the cryptographic and social cost of being real?”

---

### 7. Cryptographic Primitives Used

| Primitive                     | Implementation           | Purpose |
|-------------------------------|--------------------------|---------|
| ECDSA secp256k1               | ethers.js Wallet         | Prove wallet ownership |
| Keccak-256 + 0x19 prefix      | EIP-191 signed messages  | Prevent signature replay |
| CBOR + JUMBF boxes            | C2PA / Aqua              | Embed provenance in assets |
| DNS TXT + cryptographic challenge | Aqua EmailOwnershipProof | Prove domain control without exposing email |

---

### 8. Future-Proof Extensions (already designed)

| Feature                        | Technical Path                     |
|-------------------------------|------------------------------------|
| Chrome/Firefox extension      | Same core library, just UI layer   |
| On-chain economic cost        | Pay 0.001 ETH to vouch             |
| Bias sub-vectors              | Add fields: pro-crypto, pro-vax, etc. |
| Decentralized ledger          | IPFS + The Graph + ENS             |
| Manifest embedding            | Attach C2PA manifest directly to articles/images |

---

### 9. One-Sentence Pitch for Judges
“Bitcoin solved double-spending of money with economic finality;  
TrustNet solves double-spending of truth with identity + time + social + cryptographic finality.”

This document contains 100% of the theory, principles, and technical concepts we discussed – zero code, pure knowledge ammunition for presentations, white-paper, and judging sessions.

