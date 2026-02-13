#!/bin/bash

# Switch to Holistic Multi-Dimensional Assessment

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   SWITCHING TO HOLISTIC MULTI-DIMENSIONAL ASSESSMENT         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd config

# Backup current questions
if [ -f "questions.json" ]; then
    echo "📦 Backing up current questions..."
    cp questions.json questions-essay-backup-$(date +%Y%m%d_%H%M%S).json
    echo "✅ Backup created"
fi

# Check if holistic questions exist
if [ ! -f "holistic-questions.json" ]; then
    echo "❌ Error: holistic-questions.json not found!"
    echo "   Please make sure the file exists in the config directory."
    exit 1
fi

# Switch to holistic
echo "🔄 Switching to holistic questions..."
cp holistic-questions.json questions.json
echo "✅ Switched to holistic multi-dimensional assessment"

cd ..

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "Your test now includes:"
echo "  ✓ 10 Multiple Choice Questions (50 marks)"
echo "  ✓ 5 Fill in the Blanks (25 marks)"
echo "  ✓ 2 Programming Problems (30 marks)"
echo "  ✓ 1 Debugging Question (10 marks)"
echo "  ✓ Multi-dimensional analysis (10 dimensions)"
echo "  ✓ Visual radar charts and graphs"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "1. Restart server:"
echo "   npm start"
echo ""
echo "2. Visit test page:"
echo "   http://localhost:3000/test.html"
echo ""
echo "3. Complete a test and see the multi-dimensional results!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentation: HOLISTIC-ASSESSMENT-SYSTEM.txt"
echo ""
