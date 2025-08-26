#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Metaverse External Server Setup ===\n');

rl.question('Enter the server IP address (e.g., 192.168.1.100): ', (ip) => {
  rl.question('Enter the server port (default: 3001): ', (port) => {
    const serverPort = port || '3001';
    const serverUrl = `http://${ip}:${serverPort}`;
    
    const envContent = `# Metaverse Socket Server URL
VITE_SOCKET_SERVER_URL=${serverUrl}
`;
    
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Configuration saved to .env file');
    console.log(`📡 Server URL: ${serverUrl}`);
    console.log('\nTo start the client, run: npm run dev');
    console.log('\nMake sure the server is running on the specified address!');
    
    rl.close();
  });
});
