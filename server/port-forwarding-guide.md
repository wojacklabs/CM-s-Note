# Port Forwarding Setup Guide

## Router Configuration

### 1. Find your router's IP
```bash
# Windows
ipconfig
# Look for "Default Gateway"

# Mac/Linux
netstat -nr | grep default
```

### 2. Access router admin panel
1. Open browser: http://192.168.1.1 (or your gateway IP)
2. Login with admin credentials

### 3. Port Forwarding Settings
Look for:
- Port Forwarding
- Virtual Server
- NAT Forwarding
- Application & Gaming

### 4. Add new rule
- Service Name: CM_Metaverse
- External Port: 3001
- Internal Port: 3001
- Internal IP: Your server PC's local IP
- Protocol: TCP
- Enable: Yes

### 5. Find your public IP
```bash
curl ifconfig.me
# or visit: https://whatismyipaddress.com
```

### 6. Update client configuration
```
VITE_SOCKET_SERVER_URL=http://YOUR_PUBLIC_IP:3001
```

## Security Considerations
⚠️ **WARNING**: This exposes your server to the internet!

### Recommended Security Measures:
1. Use a reverse proxy (nginx)
2. Add authentication
3. Use HTTPS (Let's Encrypt)
4. Limit access by IP
5. Monitor access logs
