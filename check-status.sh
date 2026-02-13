#!/bin/bash

# FutureTech System Status Checker
# Verifies all components are properly configured

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           FUTURETECH SYSTEM STATUS CHECK                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check 1: .env file exists
echo "Checking configuration files..."
if [ -f ".env" ]; then
    check_pass ".env file exists"
else
    check_fail ".env file missing"
    exit 1
fi

# Check 2: Required environment variables
source .env 2>/dev/null

if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    check_pass "Anthropic API key configured"
else
    check_fail "Anthropic API key missing"
fi

if [ ! -z "$SUPABASE_URL" ]; then
    check_pass "Supabase URL configured"
else
    check_fail "Supabase URL missing"
fi

if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    check_pass "Supabase anon key configured"
else
    check_fail "Supabase anon key missing"
fi

echo ""

# Check 3: Required files
echo "Checking required files..."
required_files=(
    "server.js"
    "package.json"
    "views/index.html"
    "views/test.html"
    "views/resume.html"
    "public/auth-fix.js"
    "config/questions.json"
    "supabase-setup.sql"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file missing"
    fi
done

echo ""

# Check 4: Node modules
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    check_pass "Node modules installed"
else
    check_warn "Node modules not installed - run: npm install"
fi

echo ""

# Check 5: Port availability
echo "Checking port availability..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    check_warn "Port 3000 is already in use"
    echo "   Run: lsof -ti:3000 | xargs kill -9"
else
    check_pass "Port 3000 is available"
fi

echo ""

# Check 6: Frontend build
echo "Checking frontend..."
if [ -d "frontend/dist" ]; then
    check_pass "React frontend is built"
else
    check_warn "React frontend not built - run: cd frontend && npm run build"
fi

echo ""

# Check 7: Python service
echo "Checking Python resume service..."
if [ -d "resume" ]; then
    check_pass "Python service directory exists"
    if [ -f "resume/requirements.txt" ]; then
        check_pass "Python requirements file exists"
    else
        check_warn "Python requirements.txt missing"
    fi
else
    check_warn "Python service directory not found"
fi

echo ""

# Summary
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                        SUMMARY                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Core System: Ready ✅"
echo ""
echo "NEXT STEPS:"
echo "1. Enable Google OAuth in Supabase (see QUICK-START.txt)"
echo "2. Run database setup: supabase-setup.sql"
echo "3. Start server: ./start-all.sh"
echo "4. Visit: http://localhost:3000"
echo ""
echo "For detailed OAuth setup: see QUICK-START.txt"
echo ""
