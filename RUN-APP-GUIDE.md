# 🚀 Quick Start Guide - Run AI Story Studio

## 🎯 **Option 1: Quick Setup (Recommended)**

### **Step 1: Install Node.js**
```bash
# Download and install Node.js from official website
# Visit: https://nodejs.org/en/download/
# Choose "macOS Installer" and download the LTS version
```

### **Step 2: Install Dependencies**
```bash
# In your terminal, navigate to the project and run:
npm install
```

### **Step 3: Run the Application**
```bash
# Start the development server
npm run dev
```

## 🎯 **Option 2: Using Homebrew (If Available)**

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install dependencies
npm install

# Run the app
npm run dev
```

## 🎯 **Option 3: Alternative Runtime (Bun)**

```bash
# Install Bun (faster alternative to npm)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run the app
bun run dev
```

## 📱 **What Happens When You Run:**

1. **Frontend starts at:** `http://localhost:5173`
2. **Backend starts at:** `http://localhost:3000`
3. **Live reload** enabled for development
4. **Hot module replacement** for instant updates

## 🔧 **If You Encounter Issues:**

### **Node.js Not Found:**
```bash
# Check if Node.js is installed
node --version
npm --version

# If not found, download from: https://nodejs.org
```

### **Permission Issues:**
```bash
# Fix npm permissions (if needed)
sudo chown -R $(whoami) ~/.npm
```

### **Port Already in Use:**
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

## 🎉 **Expected Result:**

Once running, you'll see:
```
  VITE v7.0.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

## 🌟 **Features Available:**

- ✅ **Rich Text Editor** with TipTap
- ✅ **AI Writing Assistant** panel
- ✅ **Story Management** system
- ✅ **Cinematic Storyboard** workspace
- ✅ **User Authentication** (mock data)
- ✅ **Responsive Design** for all devices
- ✅ **Real-time Preview** and editing

---

**Ready to create amazing AI-powered stories! 🎨✨**
