#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           STARTING FUTURETECH PLATFORM                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Must run from futuretech_deploy directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build React frontend if not built
if [ ! -d "frontend/dist" ]; then
    echo "🔨 Building React frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    cd ..
fi

# Check if Python resume service should run
if [ -f "resume/requirements.txt" ]; then
    echo ""
    echo "🐍 Python Resume Service detected"
    echo "   To run advanced resume features, start the Python service in another terminal:"
    echo "   cd resume && python -m uvicorn server:app --host 0.0.0.0 --port 8000"
    echo ""
fi

echo "🚀 Starting main Express server..."
echo ""
npm start
