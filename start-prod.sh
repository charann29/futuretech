#!/bin/bash

# Start Python Resume Service in background
echo "🐍 Starting Python Resume Service..."
cd resume
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 &
cd ..

# Wait a moment for Python to initialize
sleep 5

# Start Node.js Server
echo "🚀 Starting Node.js Server..."
node server.js
