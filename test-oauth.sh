#!/bin/bash

# Test OAuth Configuration
# Run this AFTER enabling Google OAuth in Supabase

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              OAUTH CONFIGURATION TEST                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment
source .env 2>/dev/null

echo -e "${BLUE}Testing Supabase Connection...${NC}"
echo ""

# Test 1: Check Supabase URL
echo "Supabase URL: $SUPABASE_URL"
if curl -s "$SUPABASE_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Supabase instance is reachable${NC}"
else
    echo -e "${RED}❌ Cannot reach Supabase instance${NC}"
    exit 1
fi

echo ""

# Test 2: Check Auth Endpoint
AUTH_URL="${SUPABASE_URL}/auth/v1"
echo -e "${BLUE}Testing Auth Endpoint...${NC}"
if curl -s -H "apikey: $SUPABASE_ANON_KEY" "$AUTH_URL/settings" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth endpoint is accessible${NC}"
else
    echo -e "${RED}❌ Auth endpoint not accessible${NC}"
fi

echo ""

# Test 3: Check if server is running
echo -e "${BLUE}Checking Server Status...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on port 3000${NC}"
else
    echo -e "${RED}❌ Server is not running${NC}"
    echo "   Start with: ./start-all.sh"
    exit 1
fi

echo ""

# Test 4: Check auth-fix.js is accessible
echo -e "${BLUE}Checking Authentication Script...${NC}"
if curl -s http://localhost:3000/public/auth-fix.js | grep -q "AuthManager" 2>&1; then
    echo -e "${GREEN}✅ auth-fix.js is accessible${NC}"
else
    echo -e "${RED}❌ auth-fix.js not accessible${NC}"
fi

echo ""

# Test 5: Open test page in browser
echo -e "${BLUE}Opening Test Page...${NC}"
echo ""
echo "A browser window will open with the test page."
echo "Check the browser console (F12) for:"
echo ""
echo "  [Auth] Initializing authentication..."
echo "  [Auth] Supabase client created"
echo "  [AuthManager] Instance created"
echo "  [AuthManager] Initialized successfully"
echo ""

# Open browser
if command -v open &> /dev/null; then
    open "http://localhost:3000/test-auth.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000/test-auth.html"
else
    echo "Please manually open: http://localhost:3000/test-auth.html"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    MANUAL TEST STEPS                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Open browser console (F12)"
echo "2. Look for these logs:"
echo "   ✅ [Auth] Supabase client created"
echo "   ✅ [AuthManager] Initialized successfully"
echo ""
echo "3. Click 'Sign in with Google' button"
echo "4. If you see this error:"
echo "   ❌ 'Unsupported provider: provider is not enabled'"
echo "   → Google OAuth is NOT enabled in Supabase yet"
echo "   → Follow QUICK-START.txt steps 1-3"
echo ""
echo "5. If OAuth works:"
echo "   ✅ You'll be redirected to Google sign-in"
echo "   ✅ After login, you'll return to the site"
echo "   ✅ Your profile will appear in navbar"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                 EXPECTED CONSOLE OUTPUT                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "When OAuth is properly configured:"
echo ""
echo "  [Auth] Initializing authentication..."
echo "  [Auth] Supabase client created"
echo "  [AuthManager] Instance created"
echo "  [Auth] DOM already loaded, initializing auth..."
echo "  [AuthManager] Initializing..."
echo "  [AuthManager] Initialized successfully. User: Not signed in"
echo "  [Auth] AuthManager exported to window.authManager"
echo "  [Auth] Setup complete"
echo ""
echo "After clicking Sign in with Google:"
echo ""
echo "  [AuthManager] Starting Google sign-in..."
echo "  [AuthManager] Redirecting to Google sign-in..."
echo "  (Browser redirects to Google)"
echo ""
echo "After returning from Google:"
echo ""
echo "  [AuthManager] Auth state changed: SIGNED_IN"
echo "  [AuthManager] User signed in: your@email.com"
echo ""
