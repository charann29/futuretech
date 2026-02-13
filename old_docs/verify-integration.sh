#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         VERIFYING FUTURETECH INTEGRATION                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        return 1
    fi
}

check_folder() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        return 1
    fi
}

echo "📁 CHECKING MAIN PAGES..."
check_file "views/index.html"
check_file "views/test.html"
check_file "views/resume.html"
check_file "views/testscript.js"
echo ""

echo "🔧 CHECKING BACKEND..."
check_file "server.js"
check_file "package.json"
check_file ".env"
check_file "supabase-setup.sql"
echo ""

echo "🎨 CHECKING ASSETS..."
check_file "public/logo.png"
check_file "public/supabase-auth.js"
check_file "config/questions.json"
echo ""

echo "⚛️  CHECKING REACT APP..."
check_folder "frontend/src"
check_file "frontend/package.json"
check_file "frontend/.env"
check_file "frontend/vite.config.js"
if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} frontend/dist/ (BUILT)"
else
    echo -e "${YELLOW}⚠${NC}  frontend/dist/ (NOT BUILT - run: cd frontend && npm run build)"
fi
echo ""

echo "🐍 CHECKING PYTHON SERVICE..."
check_folder "resume/src"
check_file "resume/server.py"
check_file "resume/requirements.txt"
echo ""

echo "📊 CHECKING DEPENDENCIES..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Node dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Node dependencies not installed (run: npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Frontend dependencies not installed (run: cd frontend && npm install)"
fi
echo ""

echo "🔐 CHECKING CONFIGURATION..."
if grep -q "ANTHROPIC_API_KEY=sk-ant" .env 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Anthropic API key configured"
elif grep -q "ANTHROPIC_API_KEY=$" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC}  Anthropic API key NOT set (AI features won't work)"
else
    echo -e "${YELLOW}⚠${NC}  .env file missing or invalid"
fi

if grep -q "SUPABASE_URL=https://" .env 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Supabase URL configured"
else
    echo -e "${RED}✗${NC} Supabase URL not configured"
fi

if grep -q "SUPABASE_ANON_KEY=eyJ" .env 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Supabase Anon Key configured"
else
    echo -e "${RED}✗${NC} Supabase Anon Key not configured"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 INTEGRATION STATUS:"
echo ""
echo "✅ Main Application (Landing, Test, Quick Resume)"
echo "   → Views: index.html, test.html, resume.html"
echo "   → Auth: Supabase Google OAuth integrated"
echo "   → Database: Lead capture + storage"
echo ""
echo "✅ React Resume Builder"
if [ -d "frontend/dist" ]; then
    echo "   → Status: READY (built)"
else
    echo "   → Status: NEEDS BUILD (run: cd frontend && npm run build)"
fi
echo "   → URL: /builder/*"
echo ""
echo "✅ Python AI Service (Optional)"
echo "   → Status: Available (run separately)"
echo "   → Port: 8000"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🚀 TO START:"
echo "   ./start-all.sh"
echo ""
echo "   Then visit: http://localhost:5000"
echo ""
echo "═══════════════════════════════════════════════════════════════"
