# TIL Shuffle - Manual GitHub Deployment Instructions

## 🚀 Quick Deployment Steps

Your code is ready to deploy! Follow these steps:

---

### **Step 1: Create GitHub Repository**

1. Go to one of these URLs:
   - **GitHub Enterprise (Meta Internal - RECOMMENDED):** https://github.com/facebook
   - **Public GitHub:** https://github.com/new

2. Click "+" → "New repository"

3. Configure repository:
   - **Name:** `til-shuffle`
   - **Description:** "TIL Shuffle - Team learning game show"
   - **Visibility:**
     - For GHE: Choose "Internal" (recommended) or "Private"
     - For Public: Choose "Public" or "Private"
   - **IMPORTANT:** Do NOT check "Initialize with README"

4. Click "Create repository"

---

### **Step 2: Get Your Repository URL**

After creating, you'll see a page with setup instructions. Copy one of these URLs:

**Option A - SSH (recommended if you have SSH keys set up):**
```
git@github.com:<your-username>/til-shuffle.git
```

**Option B - HTTPS (if SSH doesn't work):**
```
https://github.com/<your-username>/til-shuffle.git
```

Replace `<your-username>` with:
- Your GitHub Enterprise username (for Meta Internal)
- Your public GitHub username (for Public GitHub)

---

### **Step 3: Push to GitHub**

Open Terminal and run these commands:

```bash
cd "/Users/mikaldavis/Downloads/TIL Shuffle"

# Remove existing origin (if any)
git remote remove origin 2>/dev/null || true

# Add your repository (replace <REPO_URL> with your actual URL from Step 2)
git remote add origin <REPO_URL>

# Push to GitHub
git push -u origin main
```

**Example with SSH:**
```bash
git remote add origin git@github.com:mikaldavis/til-shuffle.git
git push -u origin main
```

**Example with HTTPS:**
```bash
git remote add origin https://github.com/mikaldavis/til-shuffle.git
git push -u origin main
```

---

### **Step 4: Enable GitHub Pages**

1. Go to your repository on GitHub
2. Click the "Settings" tab
3. In the left sidebar, scroll down and click "Pages"
4. Under "Source":
   - **Branch:** Select `main`
   - **Folder:** Select `/ (root)`
5. Click "Save"
6. Wait 1-2 minutes for deployment

---

### **Step 5: Access Your Application**

GitHub will display your URL:
```
https://<your-username>.github.io/til-shuffle/
```

For example:
- `https://mikaldavis.github.io/til-shuffle/`

---

## 🎯 Quick Reference

### Current Repository Status
- ✅ Git initialized
- ✅ 3 commits made
- ✅ All files committed
- ✅ Branch: `main`
- ✅ Ready to push

### Files Included (13 files)
- index.html
- styles.css
- app.js
- api.js
- README.md
- DEPLOYMENT.md
- tasks.md
- .gitignore
- deploy.sh
- quick-deploy.sh
- .cursorrules
- .llms/rules/rules.md
- Devmate and Cursor Rules.txt

---

## 🐛 Troubleshooting

### If SSH Push Fails:
```bash
# Use HTTPS instead
git remote remove origin
git remote add origin https://github.com/<username>/til-shuffle.git
git push -u origin main
```

### If HTTPS Asks for Password:
You may need to use a Personal Access Token instead of your password:
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate new token with `repo` scope
3. Use the token as your password when prompted

### If Repository Doesn't Exist Error:
Make sure you completed Step 1 and created the repository on GitHub first.

---

## 📱 After Deployment

Once live, share this with your team:

**🎲 TIL Shuffle is now live!**

Access it at: `https://<your-username>.github.io/til-shuffle/`

**First-Time Setup:**
1. Go to: https://wearables-ape.io/settings/api-keys
2. Create a new API key and copy it
3. Paste into the modal on the app
4. Start adding TILs and play!

---

## 🔄 Making Updates Later

Whenever you make changes:

```bash
cd "/Users/mikaldavis/Downloads/TIL Shuffle"
git add .
git commit -m "Description of changes"
git push origin main
```

GitHub Pages will auto-update in 1-2 minutes!

---

**Need help? Check DEPLOYMENT.md for more details!**
