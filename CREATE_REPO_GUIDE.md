# Creating GitHub Enterprise Repository - Step-by-Step Visual Guide

## 🎯 Quick Start: Create Repository in 2 Minutes

Your Git repository is **ready to push**. Just follow these steps:

---

## **Step 1: Navigate to GitHub Enterprise**

1. Open your browser
2. Go to: **https://github.com/facebook**
3. You should see the GitHub Enterprise homepage

---

## **Step 2: Create New Repository**

1. **Look for the "+" icon** in the top-right corner of the page (next to your profile picture)
2. **Click the "+" icon**
3. **Select "New repository"** from the dropdown menu

---

## **Step 3: Configure Repository Settings**

You'll see a form with several fields. Fill them in exactly as shown:

### **Required Fields:**

**Owner:**
- Select: `facebook` (should be pre-selected)

**Repository name:**
```
til-shuffle
```
- ⚠️ IMPORTANT: Use exactly this name (all lowercase, with hyphen)

**Description (optional but recommended):**
```
TIL Shuffle - Team learning game show for anonymous knowledge sharing
```

**Visibility:**
- Select: **Internal** (recommended)
  - This makes it visible to all Meta employees
  - Alternative: Select **Private** if you want to restrict access

### **⚠️ CRITICAL - DO NOT CHECK THESE:**

**Initialize repository:**
- ❌ **DO NOT** check "Add a README file"
- ❌ **DO NOT** check "Add .gitignore"
- ❌ **DO NOT** check "Choose a license"

**Leave all checkboxes UNCHECKED** - your local repository already has all these files!

---

## **Step 4: Click "Create repository"**

Click the green **"Create repository"** button at the bottom of the form.

---

## **Step 5: You'll See the Setup Page**

After creating, GitHub will show you a page with setup instructions. **IGNORE those instructions**.

Instead, you'll see a URL like:
```
git@github.com:facebook/til-shuffle.git
```

This confirms your repository is created!

---

## **Step 6: Return to Terminal and Push**

Now come back to your Terminal and run:

```bash
cd "/Users/mikaldavis/Downloads/TIL Shuffle"

# Verify remote is configured
git remote -v

# Push to GitHub Enterprise
git push -u origin main
```

You should see output like:
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to X threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XX.XX KiB | XX.XX MiB/s, done.
Total XX (delta XX), reused XX (delta XX)
To github.com:facebook/til-shuffle.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## **Step 7: Enable GitHub Pages**

After successful push:

1. **Go to your repository:** https://github.com/facebook/til-shuffle
2. **Click "Settings"** tab (top right)
3. **In left sidebar, click "Pages"**
4. **Under "Source":**
   - Branch: Select **main**
   - Folder: Select **/ (root)**
5. **Click "Save"**
6. **Wait 1-2 minutes**
7. **Refresh the page** - GitHub will show: "Your site is live at [URL]"

---

## **Step 8: Access Your Application**

Your app will be live at:
```
https://<your-github-username>.github.io/til-shuffle/
```

---

## 🎯 **Quick Checklist**

Before creating the repository, make sure:
- [ ] I'm on https://github.com/facebook
- [ ] I clicked the "+" icon → "New repository"
- [ ] Repository name is: `til-shuffle`
- [ ] Visibility is set to: **Internal**
- [ ] **ALL checkboxes are UNCHECKED** (no README, no .gitignore, no license)
- [ ] I clicked "Create repository"

After creating:
- [ ] I ran: `git push -u origin main`
- [ ] Push was successful
- [ ] I enabled GitHub Pages in Settings
- [ ] I can access the live URL

---

## 🐛 **Common Issues**

### **"Repository already exists" Error**
- The repository name is taken
- Try: `til-shuffle-<your-name>` (e.g., `til-shuffle-mikaldavis`)
- Then update the remote:
  ```bash
  git remote remove origin
  git remote add origin git@github.com:facebook/til-shuffle-<your-name>.git
  git push -u origin main
  ```

### **SSH Permission Denied**
- Your SSH keys aren't set up
- Use HTTPS instead:
  ```bash
  git remote remove origin
  git remote add origin https://github.com/facebook/til-shuffle.git
  git push -u origin main
  ```

### **404 on GitHub Pages URL**
- Wait 2-3 minutes after enabling Pages
- Verify Settings → Pages shows the green checkmark
- Clear browser cache and try again
- Check the correct URL format: `https://<username>.github.io/til-shuffle/`

---

## 📱 **After Deployment**

Once live, test the application:

1. Open URL in incognito/private mode
2. Complete API key setup
3. Add 2-3 TIL entries
4. Submit and start game
5. Share with your team!

---

**Your repository is ready to push! Follow Steps 1-8 above.** 🚀
