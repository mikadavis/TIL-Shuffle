# TIL Shuffle - Deployment Guide

This guide provides step-by-step instructions for deploying the TIL Shuffle application to GitHub Pages (internal) or other deployment platforms.

---

## 📋 **Pre-Deployment Checklist**

Before deploying, ensure:
- ✅ All files are in `/Users/mikaldavis/Downloads/TIL Shuffle/`
- ✅ Application has been tested locally in Chrome
- ✅ API key validation flow works correctly
- ✅ All features are functional

---

## 🚀 **Option 1: GitHub Pages (Recommended for Internal Use)**

### **Step 1: Initialize Git Repository**

Open Terminal and navigate to your project directory:

```bash
cd "/Users/mikaldavis/Downloads/TIL Shuffle"
```

Initialize a new Git repository:

```bash
git init
git add .
git commit -m "Initial commit: TIL Shuffle complete application"
```

### **Step 2: Create GitHub Repository**

#### For GitHub Enterprise (Internal Meta Use):

1. Go to GitHub Enterprise: https://github.com/facebook (or your internal GHE URL)
2. Click the "+" icon in the top right → "New repository"
3. Repository settings:
   - **Name**: `til-shuffle`
   - **Description**: "TIL Shuffle - Team learning game show"
   - **Visibility**: Choose based on your needs:
     - **Internal** (recommended) - Visible to all Meta employees
     - **Private** - Only visible to you and collaborators you add
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

#### For Public GitHub (if applicable):

1. Go to https://github.com/new
2. Same settings as above, but visibility will be Public/Private

### **Step 3: Connect and Push to GitHub**

Copy the repository URL from GitHub (looks like: `git@github.com:facebook/til-shuffle.git` or `https://github.com/facebook/til-shuffle.git`)

In Terminal, run:

```bash
# Add remote repository
git remote add origin <YOUR_REPOSITORY_URL>

# Push to GitHub
git branch -M main
git push -u origin main
```

### **Step 4: Enable GitHub Pages**

1. On GitHub, go to your repository
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source":
   - Select branch: **main**
   - Select folder: **/ (root)**
5. Click "Save"
6. Wait 1-2 minutes for deployment
7. GitHub will show your URL: `https://<username>.github.io/til-shuffle/`

### **Step 5: Access Your Application**

Your application is now live at: `https://<username>.github.io/til-shuffle/`

**Important Notes:**
- First-time users will need to complete API key setup
- Data is stored per-user using the Structured Memories API
- The application works entirely client-side

---

## 🔄 **Updating After Changes**

Whenever you make changes to the application:

```bash
cd "/Users/mikaldavis/Downloads/TIL Shuffle"

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Description of your changes"

# Push to GitHub
git push origin main
```

GitHub Pages will automatically update within 1-2 minutes.

---

## 🖥️ **Option 2: Local Network Server**

If you want to run the application on a local network server:

### **Using Python's Built-in Server:**

```bash
cd "/Users/mikaldavis/Downloads/TIL Shuffle"

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Access at: `http://localhost:8000`

### **Using Node.js http-server:**

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Navigate to project
cd "/Users/mikaldavis/Downloads/TIL Shuffle"

# Start server
http-server -p 8000
```

Access at: `http://localhost:8000`

---

## 📦 **Option 3: Zip File Distribution**

For sharing with teammates who want to run locally:

### **Create Distribution Package:**

```bash
cd "/Users/mikaldavis/Downloads"
zip -r til-shuffle.zip "TIL Shuffle"
```

### **Instructions for Recipients:**

1. Extract the zip file
2. Open `index.html` in Chrome
3. Complete API key setup on first run
4. Start using the application

---

## 🔐 **Security Considerations**

### **For Internal Deployment (GitHub Enterprise):**

- ✅ All API keys are stored in user's browser localStorage
- ✅ No server-side storage of credentials
- ✅ Data is user-specific via Structured Memories API
- ✅ Application runs entirely client-side
- ✅ Access controlled by GitHub Enterprise permissions

### **For External Sharing:**

- ⚠️ Only share with Meta employees who have APE API access
- ⚠️ Users need to obtain their own API keys
- ⚠️ Data is isolated per user by their API key

---

## 📊 **Post-Deployment Testing**

After deployment, test these scenarios:

1. **Fresh User Experience:**
   - Open in incognito/private window
   - Verify API key modal appears
   - Complete setup flow
   - Add and submit TILs
   - Start game

2. **Returning User Experience:**
   - Close and reopen application
   - Verify API key is remembered
   - Verify existing TILs are loaded
   - Start game with existing data

3. **Multiple Users:**
   - Have 2-3 colleagues access the application
   - Each adds their own TILs
   - Start game and verify data isolation

4. **Mobile Access:**
   - Open on mobile device
   - Verify responsive design
   - Test all interactions

---

## 🐛 **Troubleshooting Deployment Issues**

### **GitHub Pages Not Loading:**

```bash
# Check deployment status
git status
git log --oneline -5

# Verify files were pushed
git ls-files
```

### **404 Error on GitHub Pages:**

- Ensure branch is set to `main` in Pages settings
- Ensure folder is set to `/ (root)`
- Wait 2-3 minutes after enabling Pages
- Clear browser cache and try again

### **Application Not Working After Deployment:**

1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify all files are loading (Network tab)
4. Check if API key validation is working

### **CORS or API Issues:**

- API calls should work from any domain
- If issues persist, verify API key is valid
- Check console logs for specific errors

---

## 📱 **Sharing Instructions for Users**

Send this to colleagues who will use the application:

---

**Welcome to TIL Shuffle!**

Access the application at: `<YOUR_GITHUB_PAGES_URL>`

**First-Time Setup (One-Time Only):**
1. You'll see a setup modal on first visit
2. Go to: https://wearables-ape.io/settings/api-keys
3. Create a new API key and copy it
4. Paste into the modal and click "Save"
5. The page will reload and you're ready!

**How to Use:**
- Add your weekly learnings with your name
- Click "Submit All TILs"
- Once everyone has submitted, click "Start Game"
- Guess who said what!

**Notes:**
- Your API key is saved in your browser
- Your TILs are private to you until submitted
- Once submitted, TILs are shared with the game

---

## 🎯 **Deployment Success Checklist**

After completing deployment, verify:

- [ ] Repository created on GitHub
- [ ] All files pushed to repository
- [ ] GitHub Pages enabled
- [ ] Application accessible via URL
- [ ] API key modal appears for new users
- [ ] Entry mode works (add/submit TILs)
- [ ] Game mode works (start/reveal/next)
- [ ] Session management works (new session)
- [ ] Responsive design works on mobile
- [ ] Console logs visible in DevTools
- [ ] Google Analytics tracking (check in GA dashboard)

---

## 📞 **Support**

For deployment issues:
1. Check browser console for errors
2. Verify all files are present in repository
3. Ensure API key setup is completed
4. Review this deployment guide

---

**Deployment URL:** `_____________________________` *(Fill in after deployment)*

**Deployed By:** `_____________________________` *(Your name)*

**Deployment Date:** `_____________________________` *(Date)*

**Version:** v1.0
