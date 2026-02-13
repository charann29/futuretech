#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          GOOGLE OAUTH SETUP ASSISTANT                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will help you setup Google OAuth for FutureTech"
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OPEN_CMD="open"
else
    OPEN_CMD="xdg-open"
fi

echo "📋 SETUP PROCESS:"
echo ""
echo "STEP 1: Get Google OAuth Credentials"
echo "STEP 2: Configure Supabase"
echo "STEP 3: Test the integration"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Google Cloud Console
echo "🔧 STEP 1: GET GOOGLE OAUTH CREDENTIALS"
echo ""
echo "I'll open Google Cloud Console in your browser..."
sleep 2

GOOGLE_CREDENTIALS_URL="https://console.cloud.google.com/apis/credentials?project=project-353fe44f-aa79-48fc-91d"
$OPEN_CMD "$GOOGLE_CREDENTIALS_URL" 2>/dev/null

echo ""
echo "✅ Google Cloud Console opened"
echo ""
echo "In the browser, do the following:"
echo "  1. Click '+ CREATE CREDENTIALS'"
echo "  2. Select 'OAuth client ID'"
echo "  3. Application type: Web application"
echo "  4. Name: FutureTech Web App"
echo ""
echo "  5. Authorized redirect URIs:"
echo "     https://gsqpobjgxrkeyxfqlakb.supabase.co/auth/v1/callback"
echo ""
echo "  6. Click CREATE"
echo "  7. COPY the Client ID and Client Secret"
echo ""
read -p "Press ENTER when you have your Client ID and Secret ready..." dummy
echo ""

# Ask for credentials
echo "📝 Enter your Google OAuth credentials:"
echo ""
read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET
echo ""

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Client ID and Secret are required"
    exit 1
fi

echo "✅ Credentials saved locally (will paste into Supabase)"
echo ""

# Step 2: Supabase Configuration
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔧 STEP 2: CONFIGURE SUPABASE"
echo ""
echo "I'll open Supabase Auth Providers in your browser..."
sleep 2

SUPABASE_AUTH_URL="https://app.supabase.com/project/gsqpobjgxrkeyxfqlakb/auth/providers"
$OPEN_CMD "$SUPABASE_AUTH_URL" 2>/dev/null

echo ""
echo "✅ Supabase Dashboard opened"
echo ""
echo "In the Supabase dashboard:"
echo "  1. Find 'Google' provider"
echo "  2. Toggle 'Enable Sign in with Google' = ON"
echo ""
echo "  3. Paste these credentials:"
echo "     ────────────────────────────────────────────"
echo "     Authorized Client ID:"
echo "     $CLIENT_ID"
echo ""
echo "     Client Secret:"
echo "     $CLIENT_SECRET"
echo "     ────────────────────────────────────────────"
echo ""
echo "  4. Site URL: http://localhost:3000"
echo ""
echo "  5. Redirect URLs:"
echo "     http://localhost:3000/*"
echo ""
echo "  6. Click SAVE"
echo ""
read -p "Press ENTER when you've saved the configuration in Supabase..." dummy
echo ""

# Step 3: Test
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🧪 STEP 3: TEST THE INTEGRATION"
echo ""
echo "Opening your FutureTech application..."
sleep 2

APP_URL="http://localhost:3000"
$OPEN_CMD "$APP_URL" 2>/dev/null

echo ""
echo "✅ Application opened: $APP_URL"
echo ""
echo "Test the Google OAuth:"
echo "  1. Click 'Sign in with Google' button"
echo "  2. Select your Google account"
echo "  3. Authorize the application"
echo "  4. You should be redirected back to the app"
echo "  5. Your profile should appear in the navbar"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "If signin works, you're all set! 🎉"
echo ""
echo "Troubleshooting:"
echo "  - redirect_uri_mismatch → Check redirect URL in Google Console"
echo "  - invalid_client → Check credentials in Supabase"
echo "  - access_denied → Add your email to test users"
echo ""
echo "Full instructions: GOOGLE-OAUTH-SETUP.txt"
echo ""
