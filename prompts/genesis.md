Attested journalism: this project aims to detect misinformation botnet (aka sybil attack) by creating a trust graph of the journalists' public-key-based account (in this case, Ethereum wallet) on top of a data provenance protocol, that makes it computationally and economically expensive for the attackers to orchestrate lots of nodes to publish misleading news articles.
The data provenance protocol I use is the Aqua protocol (see https://github.com/inblockio/aqua-js-sdk and the @aqua_example folder) i.e. privacy-preserving, decentralized, cryptographic verification of content origins and integrity along the line of the C2PA standard (https://c2pa.org/).

I want you to build a CLI-only program with concise code instead of web UI, because this is currently an academic exercise. You will use nodejs. Ask me questions if there are parts that are unclear.

I model the trust score as a multidimensional vector which enables nuanced evaluations beyond binary scores.
It consists of:
1. x509 certificates issued by domain authorities. This can be in the form of e.g. an email ownership proof with a domain nytimes.com. No need to implement this because the feature already exists in the Aqua protocol's aquafier. Just set up a field for this in the trust vector.
2. peer-to-peer votes by the network participants, similar to a PGP web of trust. This captures community-driven reputation, where journalists, fact-checkers, and users vouch for each other's reliability. For simplicity, for now, assume that the public ledger is a centralized server that accept a REST POST that contains a cryptographically signed vote from an Ethereum address (you sign prgrammatically via the `ethers` library).
3. Time based trust evaluation: Considering issuing times of attestations as part to form and weigh trust vectors. E.g. the attestation of the account must be at least 1 month prior to
4. "Local graph structure" trust algorithms: processing of attestations to quantify directional trust between nodes. For instance, consider a journalist A, publisher B, and the reader C. As an independent journalist, journalist A may not have the email proof credential, but C sees that A is trusted by B, then C may deem A to be trustworthy, at least in this trust dimension.

The CLI program name is `tn` (stands for "trustnet") and will have commands such as `trust` (to create a signed vouch of an Ethereum address to be sent to the public ledger), `inspect` (to reveal the trust vector of an account), `mint` (to mint a credential, e.g. email proof).
