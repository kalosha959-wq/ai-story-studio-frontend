#!/bin/bash

# 🚀 AI Story Studio - Production Deployment Script
# Automated deployment to production environment

set -e  # Exit on any error

echo "🚀 AI Story Studio - Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_BUCKET="ai-story-studio-frontend"
BACKEND_SERVER="your-production-server.com"
BACKEND_USER="deploy"
CLOUDFRONT_DISTRIBUTION="E1234567890ABC"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        echo "Install with: curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o awscliv2.zip && unzip awscliv2.zip && sudo ./aws/install"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js 18+ required. Current version: $(node -v)${NC}"
        exit 1
    fi
    
    # Check if production environment file exists
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️ Creating production environment file...${NC}"
        cat > .env.production << 'EOL'
NODE_ENV=production
VITE_API_URL=https://api.ai-story-studio.com
VITE_ENCRYPTION_KEY=your_32_character_encryption_key_here
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your_sentry_dsn_for_error_tracking
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
EOL
        echo -e "${YELLOW}⚠️ Please update .env.production with your actual values${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    # Frontend tests
    npm test -- --coverage --watchAll=false
    
    # Backend tests
    cd backend
    npm test
    cd ..
    
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Build frontend
build_frontend() {
    echo -e "${BLUE}🏗️ Building frontend for production...${NC}"
    
    # Install dependencies
    npm ci --production
    
    # Build with production environment
    npm run build
    
    # Verify build
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Frontend build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Frontend build completed${NC}"
}

# Deploy frontend to S3/CloudFront
deploy_frontend() {
    echo -e "${BLUE}☁️ Deploying frontend to AWS S3...${NC}"
    
    # Sync to S3 with delete flag to remove old files
    aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete --cache-control "max-age=31536000,public"
    
    # Set cache control for HTML files (no cache)
    aws s3 cp dist/index.html s3://$FRONTEND_BUCKET/index.html --cache-control "no-cache,no-store,must-revalidate"
    
    # Create CloudFront invalidation
    echo -e "${BLUE}🔄 Creating CloudFront invalidation...${NC}"
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION --paths "/*"
    
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
}

# Build and deploy backend
deploy_backend() {
    echo -e "${BLUE}🔧 Building and deploying backend...${NC}"
    
    cd backend
    
    # Install production dependencies
    npm ci --production
    
    # Build TypeScript
    npm run build
    
    # Create deployment package
    tar -czf ../backend-deploy.tar.gz dist/ node_modules/ package.json ecosystem.config.js
    
    cd ..
    
    # Upload to server
    echo -e "${BLUE}📤 Uploading backend to server...${NC}"
    scp backend-deploy.tar.gz $BACKEND_USER@$BACKEND_SERVER:/tmp/
    
    # Deploy on server
    ssh $BACKEND_USER@$BACKEND_SERVER << 'EOF'
        cd /var/www/ai-story-studio-backend
        
        # Backup current version
        sudo cp -r . ../ai-story-studio-backend-backup-$(date +%Y%m%d-%H%M%S)
        
        # Extract new version
        sudo tar -xzf /tmp/backend-deploy.tar.gz
        
        # Restart with PM2
        pm2 reload ecosystem.config.js --env production
        
        # Check if deployment was successful
        sleep 5
        if ! pm2 list | grep -q "ai-story-studio-backend.*online"; then
            echo "Deployment failed, rolling back..."
            pm2 stop ai-story-studio-backend
            sudo rm -rf /var/www/ai-story-studio-backend/*
            sudo cp -r ../ai-story-studio-backend-backup-latest/* .
            pm2 start ecosystem.config.js --env production
            exit 1
        fi
        
        echo "Backend deployment successful"
EOF
    
    # Clean up
    rm backend-deploy.tar.gz
    
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
}

# Run health checks
health_check() {
    echo -e "${BLUE}🔍 Running health checks...${NC}"
    
    # Wait for services to start
    sleep 10
    
    # Check frontend
    if curl -f https://ai-story-studio.com > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
        exit 1
    fi
    
    # Check backend API
    if curl -f https://api.ai-story-studio.com/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API is healthy${NC}"
    else
        echo -e "${RED}❌ Backend API health check failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All health checks passed${NC}"
}

# Database migration
run_migrations() {
    echo -e "${BLUE}🗄️ Running database migrations...${NC}"
    
    ssh $BACKEND_USER@$BACKEND_SERVER << 'EOF'
        cd /var/www/ai-story-studio-backend
        npm run migrate:production
EOF
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Send deployment notification
send_notification() {
    echo -e "${BLUE}📢 Sending deployment notification...${NC}"
    
    # Slack notification (if webhook configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 AI Story Studio deployed to production successfully!\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # Email notification (if configured)
    if [ ! -z "$NOTIFICATION_EMAIL" ]; then
        echo "AI Story Studio has been deployed to production successfully." | \
        mail -s "Deployment Successful" $NOTIFICATION_EMAIL
    fi
    
    echo -e "${GREEN}✅ Deployment notification sent${NC}"
}

# Rollback function
rollback() {
    echo -e "${YELLOW}🔄 Rolling back deployment...${NC}"
    
    # Rollback frontend
    git checkout HEAD~1
    npm run build
    aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION --paths "/*"
    
    # Rollback backend
    ssh $BACKEND_USER@$BACKEND_SERVER << 'EOF'
        cd /var/www/ai-story-studio-backend
        pm2 stop ai-story-studio-backend
        sudo rm -rf ./*
        sudo cp -r ../ai-story-studio-backend-backup-latest/* .
        pm2 start ecosystem.config.js --env production
EOF
    
    echo -e "${YELLOW}⚠️ Rollback completed${NC}"
}

# Main deployment function
main() {
    echo "Starting deployment process..."
    
    # Check if we're on the main branch
    if [ "$(git branch --show-current)" != "main" ]; then
        echo -e "${RED}❌ Please switch to main branch before deploying${NC}"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}❌ Please commit all changes before deploying${NC}"
        exit 1
    fi
    
    # Run deployment steps
    check_prerequisites
    run_tests
    build_frontend
    deploy_frontend
    deploy_backend
    run_migrations
    health_check
    send_notification
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "=========================================="
    echo -e "Frontend: ${BLUE}https://ai-story-studio.com${NC}"
    echo -e "Backend:  ${BLUE}https://api.ai-story-studio.com${NC}"
    echo -e "Admin:    ${BLUE}https://admin.ai-story-studio.com${NC}"
    echo ""
    echo -e "${YELLOW}📊 Post-deployment checklist:${NC}"
    echo "1. Verify all features are working"
    echo "2. Check error monitoring dashboard"
    echo "3. Monitor performance metrics"
    echo "4. Test payment processing"
    echo "5. Verify SSL certificates"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        health_check
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|health-check]"
        exit 1
        ;;
esac
