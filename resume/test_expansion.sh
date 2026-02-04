#!/bin/bash

# Test script for AI Content Expansion feature

echo "Testing AI Content Expansion with minimal profile..."
echo ""

# Backup current profile
cp data/profile.json data/profile_backup.json

# Use minimal profile for testing
cp data/minimal_profile.json data/profile.json

# Run the resume generator
# User will be prompted to expand content
python3 main.py

# Restore original profile
mv data/profile_backup.json data/profile.json

echo ""
echo "Test complete! Check output/my_resume.pdf to see the expanded content."
