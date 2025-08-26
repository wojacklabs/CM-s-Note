# Metaverse Server Setup Guide

## Running Server on Different PC

### 1. Server PC Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Start Server**
   ```bash
   npm start
   ```
   
   The server will display:
   ```
   Server running on 0.0.0.0:3001
   Local: http://localhost:3001
   Network: http://192.168.1.100:3001  # Your actual IP will be different
   ```

3. **Configure Firewall**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: Allow incoming connections when prompted
   - Linux: `sudo ufw allow 3001`

### 2. Client PC Setup

1. **Create .env file** (copy from env.example)
   ```bash
   cp env.example .env
   ```

2. **Edit .env file**
   ```
   VITE_SOCKET_SERVER_URL=http://SERVER_IP:3001
   ```
   Replace `SERVER_IP` with the actual IP address shown in the server console.

3. **Start Client**
   ```bash
   npm run dev
   ```

### 3. Network Requirements

- Both PCs must be on the same network
- Port 3001 must be open on the server PC
- No proxy/VPN blocking the connection

### 4. Troubleshooting

**Connection Failed**
- Check if server is running: `http://SERVER_IP:3001/health`
- Verify firewall settings
- Ensure correct IP address in .env file

**CORS Issues**
- Server already configured to accept connections from any origin
- Check browser console for specific error messages

### 5. Production Deployment

For internet-accessible deployment:

1. **Use a Cloud Service** (Heroku, Railway, Render, etc.)
   ```json
   // package.json in server folder
   {
     "scripts": {
       "start": "node index.js"
     },
     "engines": {
       "node": ">=14.0.0"
     }
   }
   ```

2. **Update Client .env**
   ```
   VITE_SOCKET_SERVER_URL=https://your-server.herokuapp.com
   ```

3. **Use HTTPS**
   Most cloud services provide HTTPS automatically

### 6. Testing Multiple Connections

1. Open multiple browser tabs/windows
2. Each should show as a different player
3. Movement should sync in real-time
4. Check "Players: X" counter updates correctly

### Example Network Configurations

**Home Network:**
```
Server PC: 192.168.1.100
Client PC: 192.168.1.101
.env: VITE_SOCKET_SERVER_URL=http://192.168.1.100:3001
```

**Public Server:**
```
Server: your-metaverse.herokuapp.com
.env: VITE_SOCKET_SERVER_URL=https://your-metaverse.herokuapp.com
```

**Local Development:**
```
Same PC for both
.env: VITE_SOCKET_SERVER_URL=http://localhost:3001
```
