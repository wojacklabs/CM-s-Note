#!/bin/bash
curl -X POST https://devnet.irys.xyz/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetCMPermissions { transactions( tags: [{ name: \"Content-Type\", values: [\"application/json\"] }, { name: \"irys-cm-permission\", values: [\"permission\"] }, { name: \"irys-cm-note-project\", values: [\"irys\"] }], order: DESC ) { edges { node { id tags { name value } timestamp } } } }"
  }' | jq '.'
