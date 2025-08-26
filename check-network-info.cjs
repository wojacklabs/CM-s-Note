#!/usr/bin/env node

const os = require('os');
const { exec } = require('child_process');

console.log('=== Network Information for Port Forwarding ===\n');

// Get local IP addresses
const interfaces = os.networkInterfaces();
const addresses = [];

Object.keys(interfaces).forEach(ifname => {
  interfaces[ifname].forEach(iface => {
    if ('IPv4' !== iface.family || iface.internal !== false) return;
    addresses.push({
      interface: ifname,
      address: iface.address
    });
  });
});

console.log('📍 Local IP Addresses:');
addresses.forEach(addr => {
  console.log(`   ${addr.interface}: ${addr.address}`);
});

console.log('\n📡 Server Configuration:');
console.log(`   Port: 8547`);
console.log(`   URL: http://${addresses[0]?.address || 'YOUR_IP'}:8547`);

// Get public IP
console.log('\n🌐 Checking Public IP...');
exec('curl -s ifconfig.me', (error, stdout, stderr) => {
  if (error) {
    console.log('   Could not retrieve public IP');
    console.log('   Visit https://whatismyipaddress.com to check manually');
  } else {
    const publicIP = stdout.trim();
    console.log(`   Public IP: ${publicIP}`);
    console.log(`\n🔧 Port Forwarding Configuration:`);
    console.log(`   External Port: 8547 → Internal IP: ${addresses[0]?.address || 'YOUR_LOCAL_IP'}:8547`);
    console.log(`\n🌍 External Access URL:`);
    console.log(`   http://${publicIP}:8547`);
    console.log(`\n📝 Client .env Configuration:`);
    console.log(`   VITE_SOCKET_SERVER_URL=http://${publicIP}:8547`);
  }
  
  console.log('\n⚠️  Security Reminder:');
  console.log('   - Only keep port forwarding enabled when needed');
  console.log('   - Monitor server logs for unauthorized access');
  console.log('   - Consider using VPN for better security');
});
