#!/bin/bash
curl -X POST https://devnet.irys.xyz/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { transactions( tags: [{ name: \"App-Name\", values: [\"irys-cm-note-unified\"] }], first: 100, order: DESC ) { edges { node { id tags { name value } } } } }"
  }' | jq '.data.transactions.edges[] | select(.node.tags[] | select(.name == "irys-cm-note-data" and (.value | contains("yo!kang") or contains("meowth") or contains("tayo") or contains("TAYO") or contains("Meowth"))))'
