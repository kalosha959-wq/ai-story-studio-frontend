# Google Cloud Run Configuration Guide

## 🚀 Quick Setup Instructions

### 1. **Prerequisites**
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize and authenticate
gcloud init
gcloud auth login
gcloud auth application-default login
```

### 2. **Create Google Cloud Project**
```bash
# Create a new project (optional)
gcloud projects create your-project-id --name="AI Story Studio"

# Set the project
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable storage-api.googleapis.com
```

### 3. **Configure Environment Variables**

Edit your `.env.production` file with these actual values:

#### **🔧 Required Settings:**

```bash
# Your Google Cloud Project ID
GOOGLE_CLOUD_PROJECT=your-actual-project-id

# Choose your region (closer to your users)
GOOGLE_CLOUD_REGION=us-central1    # or us-east1, europe-west1, etc.

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

#### **🗄️ Database Setup (Cloud SQL):**

```bash
# Create Cloud SQL instance
gcloud sql instances create ai-story-studio-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create ai_story_studio --instance=ai-story-studio-db

# Create user
gcloud sql users create appuser --instance=ai-story-studio-db --password=your-secure-password

# Update in .env.production:
CLOUD_SQL_INSTANCE=your-project-id:us-central1:ai-story-studio-db
DATABASE_URL=postgresql://appuser:your-secure-password@/ai_story_studio?host=/cloudsql/your-project-id:us-central1:ai-story-studio-db
```

#### **🔐 API Keys:**

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic Claude API Key  
CLAUDE_API_KEY=sk-ant-your-claude-api-key

# PayPal (create at developer.paypal.com)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

#### **📦 Storage Setup:**

```bash
# Create storage bucket
gsutil mb gs://your-project-id-storage

# Update in .env.production:
GOOGLE_CLOUD_STORAGE_BUCKET=your-project-id-storage
```

### 4. **Service Account (Optional but Recommended)**

```bash
# Create service account
gcloud iam service-accounts create ai-story-studio \
    --display-name="AI Story Studio Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:ai-story-studio@your-project-id.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:ai-story-studio@your-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create service-account-key.json \
    --iam-account=ai-story-studio@your-project-id.iam.gserviceaccount.com
```

### 5. **Email Configuration (Gmail Example)**

```bash
# For Gmail, enable 2FA and create App Password
# Go to: Google Account > Security > App passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
```

## 🎯 **Configuration Checklist**

- [ ] Google Cloud Project created and configured
- [ ] APIs enabled (Cloud Run, Cloud Build, etc.)
- [ ] `.env.production` updated with actual values
- [ ] Database (Cloud SQL) set up
- [ ] Storage bucket created
- [ ] API keys configured (OpenAI, Claude, PayPal)
- [ ] Email SMTP configured
- [ ] Service account created (optional)

## 🚀 **Deploy Command**

After configuration:

```bash
# Deploy to Google Cloud Run
./deploy-cloudrun.sh
```

## 📊 **Estimated Costs (Free Tier)**

- **Cloud Run**: Free tier includes 2 million requests/month
- **Cloud SQL**: ~$7/month for db-f1-micro instance
- **Cloud Storage**: ~$0.02/GB/month
- **Cloud Build**: 120 build-minutes/day free

## 🔧 **Common Issues & Solutions**

### Issue: Authentication Error
```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login
```

### Issue: Permission Denied
```bash
# Check current account
gcloud auth list

# Ensure you have Owner/Editor role
gcloud projects get-iam-policy your-project-id
```

### Issue: API Not Enabled
```bash
# Enable all required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
```

---

**Next Step**: Edit `.env.production` with your actual values, then run `./deploy-cloudrun.sh`
