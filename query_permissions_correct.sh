#!/bin/bash
curl -X POST https://devnet.irys.xyz/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { transactions( tags: [{ name: \"App-Name\", values: [\"irys-cm-note-permission\"] }], first: 10, order: DESC ) { edges { node { id tags { name value } timestamp } } } }"
  }' | jq '.'
