# Deploy to Railway (Recommended for Public Access)

## Quick Deploy (5 minutes)

### 1. Prepare server for deployment
Create `server/package.json` if not exists:
```json
{
  "name": "cm-metaverse-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 2. Deploy to Railway
1. Visit https://railway.app
2. Click "Start New Project"
3. Choose "Deploy from GitHub repo" or "Deploy from CLI"

#### Option A: GitHub Deploy
- Push server folder to GitHub
- Connect Railway to your repo
- Select the server folder

#### Option B: CLI Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# In server folder
cd server
railway link
railway up
```

### 3. Get public URL
Railway will provide URL like:
```
https://your-app.up.railway.app
```

### 4. Update client .env
```
VITE_SOCKET_SERVER_URL=https://your-app.up.railway.app
```

## Alternative: Render.com

### 1. Create account at render.com
### 2. New > Web Service
### 3. Connect GitHub repo
### 4. Configure:
- Name: cm-metaverse-server
- Root Directory: server
- Build Command: npm install
- Start Command: npm start

### 5. Deploy and get URL
```
https://cm-metaverse-server.onrender.com
```

## Benefits of Cloud Deployment:
✅ Public URL automatically
✅ HTTPS included
✅ No router configuration
✅ Professional hosting
✅ Free tier available
✅ Auto-scaling options
