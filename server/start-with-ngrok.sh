#!/bin/bash

echo "Starting CM Metaverse Server with ngrok..."

# Start server in background
echo "Starting server on port 3001..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null
then
    echo "ngrok is not installed!"
    echo "Please install ngrok from https://ngrok.com/download"
    kill $SERVER_PID
    exit 1
fi

# Start ngrok
echo "Starting ngrok tunnel..."
ngrok http 3001

# When ngrok is closed, kill the server
kill $SERVER_PID
