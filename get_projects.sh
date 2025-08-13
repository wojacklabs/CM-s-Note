#!/bin/bash
curl -X POST https://devnet.irys.xyz/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { transactions( tags: [{ name: \"App-Name\", values: [\"irys-cm-note-unified\"] }], first: 10, order: DESC ) { edges { node { tags { name value } } } } }"
  }' | jq '.data.transactions.edges[].node.tags[] | select(.name == "irys-cm-note-project") | .value' | sort | uniq
