# 🚀 Next Steps for Google Cloud Run Deployment

## ✅ Current Status:
- ✅ **Project configured** with secure environment variables
- ✅ **Deployment script ready** (`deploy-cloudrun.sh`)
- ✅ **Google Cloud SDK downloaded** (in Downloads folder)
- ❌ **Google Cloud SDK not installed yet**

## 🔧 **Step 1: Install Google Cloud SDK**

### Option A: Install from Downloads (Recommended)
```bash
# Navigate to the downloaded SDK
cd ~/Downloads/google-cloud-sdk

# Run the installation script
./install.sh --quiet --path-update=true

# Restart your terminal or run:
source ~/.zshrc
```

### Option B: Install via Homebrew (Alternative)
```bash
# Install via Homebrew
brew install --cask google-cloud-sdk

# Or install CLI only
brew install google-cloud-sdk
```

## 🔐 **Step 2: Authenticate with Google Cloud**

After installation:
```bash
# Initialize and authenticate
gcloud init

# Follow the prompts to:
# 1. Login to your Google account
# 2. Select or create a project
# 3. Set default region (us-central1)

# Additional authentication for Docker
gcloud auth configure-docker
```

## 📁 **Step 3: Update Your Project Configuration**

Edit your `.env.production` file and replace:
```bash
# Replace this with your actual Google Cloud Project ID
GOOGLE_CLOUD_PROJECT=your-actual-project-id

# Example:
GOOGLE_CLOUD_PROJECT=ai-story-studio-2025
```

## 🗄️ **Step 4: Set Up Database (Optional)**

### Create Cloud SQL Instance:
```bash
# Create PostgreSQL instance
gcloud sql instances create ai-story-studio-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create ai_story_studio --instance=ai-story-studio-db

# Create user
gcloud sql users create appuser --instance=ai-story-studio-db --password=SecurePassword123
```

## 🔑 **Step 5: Add API Keys (Required)**

Update your `.env.production` with:
```bash
# OpenAI API Key (get from platform.openai.com)
OPENAI_API_KEY=sk-your-openai-api-key

# Claude API Key (get from console.anthropic.com)
CLAUDE_API_KEY=sk-ant-your-claude-api-key

# PayPal (get from developer.paypal.com)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

## 🚀 **Step 6: Deploy to Google Cloud Run**

Once everything is configured:
```bash
# Deploy your application
./deploy-cloudrun.sh
```

## 📋 **Deployment Checklist**

- [ ] Google Cloud SDK installed and authenticated
- [ ] Project ID updated in `.env.production`
- [ ] API keys added (at minimum OpenAI or Claude)
- [ ] Database configured (optional for first deployment)
- [ ] Run deployment script

## 🎯 **Quick Start (Minimum Required)**

If you want to deploy quickly with minimal setup:

1. **Install Google Cloud SDK**
2. **Run:** `gcloud init`
3. **Update:** `GOOGLE_CLOUD_PROJECT=your-project-id` in `.env.production`
4. **Add:** At least one AI API key (OpenAI or Claude)
5. **Deploy:** `./deploy-cloudrun.sh`

## 🆘 **Need Help?**

If you encounter issues:
```bash
# Check gcloud status
gcloud info

# Check authentication
gcloud auth list

# Check project
gcloud config get-value project

# View logs
gcloud run logs tail ai-story-studio-frontend --region us-central1
```

---

**Next Action:** Install Google Cloud SDK using one of the methods above, then proceed with authentication and deployment! 🚀
