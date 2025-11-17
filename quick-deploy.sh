#!/bin/bash

# TIL Shuffle - Quick GitHub Deployment
# This script automates the GitHub deployment process

set -e

echo "🚀 TIL Shuffle - Automated GitHub Deployment"
echo "=============================================="
echo ""

cd "/Users/mikaldavis/Downloads/TIL Shuffle"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized"
    exit 1
fi

echo "✅ Git repository detected"
echo ""

# Set default values for automated deployment
GH_USERNAME="mikaldavis"
REPO_NAME="til-shuffle"

# Use public GitHub by default
REPO_URL="git@github.com:${GH_USERNAME}/${REPO_NAME}.git"
PAGES_URL="https://${GH_USERNAME}.github.io/${REPO_NAME}/"

echo "📋 Deployment Configuration:"
echo "  - Repository: ${REPO_URL}"
echo "  - Pages URL: ${PAGES_URL}"
echo ""

# Remove origin if it exists
git remote remove origin 2>/dev/null || true

# Add new origin
echo "📝 Adding remote repository..."
git remote add origin "$REPO_URL"

# Ensure we're on main branch
git branch -M main

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Successfully pushed to GitHub!"
    echo "=========================================="
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Create repository on GitHub (if not exists):"
    echo "   - Go to: https://github.com/new"
    echo "   - Name: ${REPO_NAME}"
    echo "   - Make it Public"
    echo "   - DO NOT initialize with README"
    echo ""
    echo "2. If repository already exists, enable GitHub Pages:"
    echo "   - Go to: https://github.com/${GH_USERNAME}/${REPO_NAME}/settings/pages"
    echo "   - Source: Branch 'main', Folder '/ (root)'"
    echo "   - Click 'Save'"
    echo ""
    echo "3. Wait 1-2 minutes, then access at:"
    echo "   ${PAGES_URL}"
    echo ""
else
    echo ""
    echo "⚠️ Push failed. This likely means:"
    echo "  1. Repository doesn't exist yet on GitHub"
    echo "  2. SSH key not configured"
    echo ""
    echo "To create the repository:"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Name: ${REPO_NAME}"
    echo "  3. Click 'Create repository'"
    echo "  4. Run this script again"
    echo ""
    echo "Or try HTTPS instead:"
    echo "  git remote remove origin"
    echo "  git remote add origin https://github.com/${GH_USERNAME}/${REPO_NAME}.git"
    echo "  git push -u origin main"
fi
