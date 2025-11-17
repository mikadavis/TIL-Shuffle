#!/bin/bash

# TIL Shuffle - GitHub Deployment Script
# This script will help you deploy to GitHub and enable Pages

set -e  # Exit on any error

echo "🚀 TIL Shuffle - GitHub Deployment Helper"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "📍 Project directory: $PROJECT_DIR"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "${RED}❌ Error: Git repository not initialized${NC}"
    echo "Run these commands first:"
    echo "  cd \"$PROJECT_DIR\""
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    exit 1
fi

echo "${GREEN}✅ Git repository detected${NC}"
echo ""

# Prompt for GitHub type
echo "Which GitHub are you deploying to?"
echo "  1) GitHub Enterprise (Meta Internal) - Recommended"
echo "  2) Public GitHub"
read -p "Enter choice (1 or 2): " github_choice

if [ "$github_choice" == "1" ]; then
    echo ""
    echo "${YELLOW}📋 GitHub Enterprise Deployment${NC}"
    echo ""
    echo "Step 1: Create Repository on GitHub Enterprise"
    echo "  - Go to: https://github.com/facebook"
    echo "  - Click '+' → 'New repository'"
    echo "  - Name: til-shuffle"
    echo "  - Visibility: Internal (recommended)"
    echo "  - DO NOT initialize with README"
    echo ""
    read -p "Press Enter once you've created the repository..."
    echo ""
    read -p "Enter your GitHub Enterprise username: " gh_username
    REPO_URL="git@github.com:facebook/til-shuffle.git"
    PAGES_URL="https://${gh_username}.github.io/til-shuffle/"

elif [ "$github_choice" == "2" ]; then
    echo ""
    echo "${YELLOW}📋 Public GitHub Deployment${NC}"
    echo ""
    echo "Step 1: Create Repository on GitHub"
    echo "  - Go to: https://github.com/new"
    echo "  - Name: til-shuffle"
    echo "  - Visibility: Public or Private"
    echo "  - DO NOT initialize with README"
    echo ""
    read -p "Press Enter once you've created the repository..."
    echo ""
    read -p "Enter your GitHub username: " gh_username
    REPO_URL="git@github.com:${gh_username}/til-shuffle.git"
    PAGES_URL="https://${gh_username}.github.io/til-shuffle/"

else
    echo "${RED}❌ Invalid choice${NC}"
    exit 1
fi

echo ""
echo "Step 2: Adding remote repository..."
echo "  Repository URL: $REPO_URL"

# Remove origin if it already exists
git remote remove origin 2>/dev/null || true

# Add new origin
git remote add origin "$REPO_URL"

echo "${GREEN}✅ Remote added${NC}"
echo ""

echo "Step 3: Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo "${RED}❌ Push failed. Common issues:${NC}"
    echo "  - SSH key not set up (try HTTPS instead)"
    echo "  - Repository doesn't exist on GitHub"
    echo "  - No permission to push"
    echo ""
    echo "Manual alternative:"
    echo "  git remote add origin https://github.com/${gh_username}/til-shuffle.git"
    echo "  git push -u origin main"
    exit 1
fi

echo ""
echo "=========================================="
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Enable GitHub Pages:"
echo "   - Go to your repository on GitHub"
echo "   - Click 'Settings' → 'Pages'"
echo "   - Source: Branch 'main', Folder '/ (root)'"
echo "   - Click 'Save'"
echo ""
echo "2. Wait 1-2 minutes for deployment"
echo ""
echo "3. Access your application at:"
echo "   ${YELLOW}${PAGES_URL}${NC}"
echo ""
echo "4. Share with your team!"
echo ""
echo "📚 For more details, see DEPLOYMENT.md"
echo ""
