# 🚀 AI Story Studio - Production Deployment Guide

**Complete deployment instructions for AI Story Studio platform**

*Last Updated: July 23, 2025*

## 📋 Pre-Deployment Checklist

### ✅ **Prerequisites**
- [ ] Node.js 18+ installed on production server
- [ ] Domain name and SSL certificate configured
- [ ] Database service ready (PostgreSQL/MongoDB recommended)
- [ ] Email service configured (SendGrid/AWS SES)
- [ ] Cloud storage setup (AWS S3/Google Cloud Storage)
- [ ] CDN configured (CloudFlare/AWS CloudFront)
- [ ] Monitoring service ready (New Relic/DataDog)

### ✅ **Security Requirements**
- [ ] Environment variables secured
- [ ] API keys stored in secure vault
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured
- [ ] Database access restricted
- [ ] Backup strategy implemented

## 🏗️ Infrastructure Options

### Option 1: Cloud Platform Deployment (Recommended)

#### **🌊 Vercel + Railway (Fastest)**
```bash
# Frontend on Vercel
npm install -g vercel
vercel --prod

# Backend on Railway
railway login
railway deploy
```

#### **☁️ AWS Full Stack**
```bash
# Frontend: AWS S3 + CloudFront
aws s3 mb s3://ai-story-studio-frontend
aws cloudfront create-distribution

# Backend: AWS ECS + RDS
aws ecs create-cluster --cluster-name ai-story-studio
```

#### **🔷 Azure DevOps**
```bash
# Azure App Service
az webapp create --resource-group ai-story-studio --plan myAppServicePlan --name ai-story-studio
```

### Option 2: Self-Hosted VPS

#### **🐧 Ubuntu/Debian Server**
```bash
# Server setup
sudo apt update && sudo apt upgrade -y
sudo apt install nginx nodejs npm postgresql redis-server -y

# PM2 for process management
npm install -g pm2
```

## 🔧 Environment Configuration

### **Frontend Environment (.env.production)**
```env
NODE_ENV=production
VITE_API_URL=https://api.ai-story-studio.com
VITE_ENCRYPTION_KEY=your_32_character_encryption_key_here
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your_sentry_dsn_for_error_tracking
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### **Backend Environment (.env.production)**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/ai_story_studio
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_super_secure_jwt_secret_256_bits_minimum
ENCRYPTION_KEY=your_32_character_encryption_key_here
CORS_ORIGIN=https://ai-story-studio.com

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email Service
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@ai-story-studio.com

# Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=ai-story-studio-assets
AWS_REGION=us-east-1

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
```

## 📦 Build & Deploy Process

### **1. Frontend Build**
```bash
# Install dependencies
npm ci --production

# Build for production
npm run build

# Test production build
npm run preview

# Deploy static files
aws s3 sync dist/ s3://ai-story-studio-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### **2. Backend Deployment**
```bash
# Navigate to backend
cd backend

# Install production dependencies
npm ci --production

# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### **3. Database Setup**
```sql
-- Create production database
CREATE DATABASE ai_story_studio;
CREATE USER ai_story_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_story_studio TO ai_story_user;

-- Create tables (run migration scripts)
\i database/schema.sql
\i database/seed.sql
```

## 🔒 Security Hardening

### **Nginx Configuration**
```nginx
server {
    listen 443 ssl http2;
    server_name ai-story-studio.com www.ai-story-studio.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
    
    # Frontend static files
    location / {
        root /var/www/ai-story-studio;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **PM2 Ecosystem Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-story-studio-backend',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=4096'
  }]
};
```

## 📊 Monitoring & Analytics

### **Health Check Endpoints**
```bash
# API health check
curl https://api.ai-story-studio.com/health

# Database connectivity
curl https://api.ai-story-studio.com/health/database

# External services
curl https://api.ai-story-studio.com/health/services
```

### **Log Management**
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/ai-story-studio

# Configure PM2 logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🔄 CI/CD Pipeline

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build frontend
        run: npm run build
        
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

## 🌐 Domain & DNS Configuration

### **DNS Records**
```
A     ai-story-studio.com          → 192.168.1.100
A     www.ai-story-studio.com      → 192.168.1.100
CNAME api.ai-story-studio.com      → ai-story-studio.com
CNAME cdn.ai-story-studio.com      → cloudfront-distribution.amazonaws.com
TXT   ai-story-studio.com          → "v=spf1 include:sendgrid.net ~all"
```

### **SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d ai-story-studio.com -d www.ai-story-studio.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 Performance Optimization

### **Frontend Optimizations**
```bash
# Enable Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# Browser caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **Database Optimization**
```sql
-- Index optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
```

## 📱 Mobile App Preparation

### **PWA Configuration**
```json
{
  "name": "AI Story Studio",
  "short_name": "StoryStudio",
  "description": "Professional AI-powered story creation platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🆘 Troubleshooting

### **Common Issues**
```bash
# Port conflicts
sudo netstat -tlnp | grep :3000
sudo kill -9 PID

# Permission issues
sudo chown -R $USER:$USER /var/www/ai-story-studio

# Memory issues
free -h
sudo swapon --show

# SSL certificate issues
sudo certbot certificates
```

### **Log Analysis**
```bash
# Backend logs
pm2 logs ai-story-studio-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

## 📞 Support & Maintenance

### **Regular Maintenance Tasks**
- [ ] Weekly security updates
- [ ] Monthly backup verification
- [ ] Quarterly performance review
- [ ] SSL certificate renewal (automated)
- [ ] Database maintenance and optimization

### **Emergency Contacts**
- **DevOps Team**: devops@ai-story-studio.com
- **Security Team**: security@ai-story-studio.com
- **On-call Engineer**: +1-555-0123

---

## 🎯 Quick Deployment Commands

```bash
# Complete deployment script
./deploy-production.sh

# Health check after deployment
curl -f https://ai-story-studio.com/health || exit 1

# Rollback if needed
./rollback.sh previous-version
```

**Status**: ✅ **Production Deployment Ready**

*This guide ensures a secure, scalable, and maintainable production deployment.*
