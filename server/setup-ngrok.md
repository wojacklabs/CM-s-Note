# Public Access Setup with ngrok

## 1. Install ngrok

### Mac:
```bash
brew install ngrok/ngrok/ngrok
```

### Windows/Linux:
Download from https://ngrok.com/download

## 2. Create ngrok account
1. Sign up at https://ngrok.com
2. Get your auth token from dashboard
3. Configure ngrok:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## 3. Start the server
```bash
cd server
npm start
```

## 4. Create tunnel
In a new terminal:
```bash
ngrok http 3001
```

You'll see something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

## 5. Use the ngrok URL
Update your .env file:
```
VITE_SOCKET_SERVER_URL=https://abc123.ngrok.io
```

## Benefits:
- Works through any firewall
- Provides HTTPS automatically
- No router configuration needed
- Free tier available
