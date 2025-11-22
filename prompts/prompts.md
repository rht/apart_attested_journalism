# 1
can you read @README.md and add `--config` flag to the `tn` CLI so that i can easily act as a tn account completely based a given credentials.json? this is going to be very useful for testing
# 2
can you read @README.md as a context and add the CLI flag to export the output of `tn inspect` as a json for easy parsing
# 3
can you read @README.md and write a bash+js script to generate 2 communities of network. the 2nd network will be sybil
nodes that are very loosely connected to the 1st network. the script must generate the wallet seed phrases
deterministically. put the code and documentation in tests/ folder. the folder doesn't exist yet and you must create it.
# 4
can you read @README.md and implement damping factor of 0.2 to the eigentrust algorithm? make it configurable so that every user can choose their own damping factor, but include the damping factor number in the inspect output (both text and json output). i emphasize that the damping is a subjective user-specific param, not a global param, so that it should be stored in the acount's credentials.json and NOT ever read from .env or any server config. to implement this version of the damping factor, you need to also take into account of damping_factor * (pretrusted immediate 1-hop peers)
