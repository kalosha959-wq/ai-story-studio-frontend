#!/bin/bash

# Google Cloud Run Deployment Script for AI Story Studio
# This script deploys both frontend and backend to Google Cloud Run

set -e

echo "🚀 AI Story Studio - Google Cloud Run Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.production ]; then
    echo -e "${BLUE}Loading Cloud Run configuration...${NC}"
    source .env.production
else
    echo -e "${RED}❌ .env.production file not found. Please create it first.${NC}"
    exit 1
fi

# Check required environment variables
REQUIRED_VARS=(
    "GOOGLE_CLOUD_PROJECT"
    "GOOGLE_CLOUD_REGION"
    "FRONTEND_SERVICE_NAME"
    "BACKEND_SERVICE_NAME"
)

echo -e "${BLUE}Validating configuration...${NC}"
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required environment variable: $var${NC}"
        exit 1
    fi
done

# Check if gcloud is installed and authenticated
echo -n "🔐 Checking Google Cloud authentication: "
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}FAILED${NC}"
    echo -e "${RED}❌ Google Cloud SDK is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}FAILED${NC}"
    echo -e "${RED}❌ Not authenticated with Google Cloud.${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

echo -e "${GREEN}SUCCESS${NC}"

# Set the project
echo -n "📁 Setting Google Cloud project: "
gcloud config set project "$GOOGLE_CLOUD_PROJECT" > /dev/null 2>&1
echo -e "${GREEN}$GOOGLE_CLOUD_PROJECT${NC}"

# Enable required APIs
echo -e "${BLUE}Enabling required Google Cloud APIs...${NC}"
REQUIRED_APIS=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "containerregistry.googleapis.com"
    "sql-component.googleapis.com"
    "storage-api.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    echo -n "  📡 $api: "
    if gcloud services enable "$api" > /dev/null 2>&1; then
        echo -e "${GREEN}ENABLED${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
done

# Build and deploy frontend
echo -e "\n${BLUE}🏗️  Building and deploying frontend...${NC}"

# Create frontend Dockerfile for Cloud Run if it doesn't exist
if [ ! -f "Dockerfile.cloudrun.frontend" ]; then
    echo -e "${YELLOW}Creating Dockerfile for Cloud Run frontend...${NC}"
    cat > Dockerfile.cloudrun.frontend << 'EOF'
# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY <<'NGINX_EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
fi

# Build and push frontend container
echo -n "📦 Building frontend container: "
if gcloud builds submit --tag "gcr.io/$GOOGLE_CLOUD_PROJECT/$FRONTEND_SERVICE_NAME" -f Dockerfile.cloudrun.frontend . > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# Deploy frontend to Cloud Run
echo -n "🚀 Deploying frontend to Cloud Run: "
if gcloud run deploy "$FRONTEND_SERVICE_NAME" \
    --image "gcr.io/$GOOGLE_CLOUD_PROJECT/$FRONTEND_SERVICE_NAME" \
    --platform managed \
    --region "$GOOGLE_CLOUD_REGION" \
    --allow-unauthenticated \
    --port 8080 \
    --cpu "${CPU_LIMIT:-1}" \
    --memory "${MEMORY_LIMIT:-2Gi}" \
    --min-instances "${MIN_INSTANCES:-0}" \
    --max-instances "${MAX_INSTANCES:-10}" \
    --set-env-vars "NODE_ENV=production" > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE_NAME" --platform managed --region "$GOOGLE_CLOUD_REGION" --format 'value(status.url)')
echo -e "📱 Frontend URL: ${GREEN}$FRONTEND_URL${NC}"

# Build and deploy backend
echo -e "\n${BLUE}🏗️  Building and deploying backend...${NC}"

# Create backend Dockerfile for Cloud Run if it doesn't exist
if [ ! -f "backend/Dockerfile.cloudrun" ]; then
    echo -e "${YELLOW}Creating Dockerfile for Cloud Run backend...${NC}"
    cat > backend/Dockerfile.cloudrun << 'EOF'
# Node.js backend for Cloud Run
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
EOF
fi

# Create health check file for backend
if [ ! -f "backend/healthcheck.js" ]; then
    cat > backend/healthcheck.js << 'EOF'
const http = require('http');

const options = {
    host: 'localhost',
    port: process.env.PORT || 3000,
    path: '/health',
    timeout: 2000
};

const request = http.request(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

request.on('error', () => {
    process.exit(1);
});

request.end();
EOF
fi

# Build and push backend container
echo -n "📦 Building backend container: "
if gcloud builds submit --tag "gcr.io/$GOOGLE_CLOUD_PROJECT/$BACKEND_SERVICE_NAME" -f backend/Dockerfile.cloudrun ./backend > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# Prepare environment variables for backend
ENV_VARS="NODE_ENV=production"
if [ -n "$JWT_SECRET" ]; then
    ENV_VARS="$ENV_VARS,JWT_SECRET=$JWT_SECRET"
fi
if [ -n "$DATABASE_URL" ]; then
    ENV_VARS="$ENV_VARS,DATABASE_URL=$DATABASE_URL"
fi
ENV_VARS="$ENV_VARS,FRONTEND_URL=$FRONTEND_URL"

if [ -n "$OPENAI_API_KEY" ]; then
    ENV_VARS="$ENV_VARS,OPENAI_API_KEY=$OPENAI_API_KEY"
fi

if [ -n "$CLAUDE_API_KEY" ]; then
    ENV_VARS="$ENV_VARS,CLAUDE_API_KEY=$CLAUDE_API_KEY"
fi

# Deploy backend to Cloud Run
echo -n "🚀 Deploying backend to Cloud Run: "
DEPLOY_CMD="gcloud run deploy $BACKEND_SERVICE_NAME \
    --image gcr.io/$GOOGLE_CLOUD_PROJECT/$BACKEND_SERVICE_NAME \
    --platform managed \
    --region $GOOGLE_CLOUD_REGION \
    --allow-unauthenticated \
    --port 3000 \
    --cpu ${CPU_LIMIT:-1} \
    --memory ${MEMORY_LIMIT:-2Gi} \
    --min-instances ${MIN_INSTANCES:-0} \
    --max-instances ${MAX_INSTANCES:-10} \
    --set-env-vars $ENV_VARS"

# Add Cloud SQL connection if configured
if [ -n "$CLOUD_SQL_INSTANCE" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --add-cloudsql-instances $CLOUD_SQL_INSTANCE"
fi

if eval "$DEPLOY_CMD" > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# Get backend URL
BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE_NAME" --platform managed --region "$GOOGLE_CLOUD_REGION" --format 'value(status.url)')
echo -e "🖥️  Backend URL: ${GREEN}$BACKEND_URL${NC}"

# Run health checks
echo -e "\n${BLUE}🏥 Running health checks...${NC}"

echo -n "🌐 Frontend health check: "
if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}HEALTHY${NC}"
else
    echo -e "${RED}UNHEALTHY${NC}"
fi

echo -n "🖥️  Backend health check: "
if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}HEALTHY${NC}"
else
    echo -e "${RED}UNHEALTHY${NC}"
fi

# Display deployment summary
echo -e "\n${BLUE}🎉 Deployment Summary${NC}"
echo "======================"
echo -e "Project:           ${GREEN}$GOOGLE_CLOUD_PROJECT${NC}"
echo -e "Region:            ${GREEN}$GOOGLE_CLOUD_REGION${NC}"
echo -e "Frontend Service:  ${GREEN}$FRONTEND_SERVICE_NAME${NC}"
echo -e "Backend Service:   ${GREEN}$BACKEND_SERVICE_NAME${NC}"
echo -e "Frontend URL:      ${GREEN}$FRONTEND_URL${NC}"
echo -e "Backend URL:       ${GREEN}$BACKEND_URL${NC}"

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"

# Display next steps
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Update your frontend configuration to use the backend URL"
echo "2. Configure your domain DNS if using custom domain"
echo "3. Set up Cloud SQL database if not already done"
echo "4. Configure Cloud Storage for file uploads"
echo "5. Set up monitoring and logging"

echo -e "\n${BLUE}📊 Useful Commands:${NC}"
echo "View logs:    gcloud run logs tail $FRONTEND_SERVICE_NAME --region $GOOGLE_CLOUD_REGION"
echo "View logs:    gcloud run logs tail $BACKEND_SERVICE_NAME --region $GOOGLE_CLOUD_REGION"
echo "Update env:   gcloud run services update $BACKEND_SERVICE_NAME --region $GOOGLE_CLOUD_REGION --set-env-vars KEY=VALUE"
echo "Scale:        gcloud run services update $BACKEND_SERVICE_NAME --region $GOOGLE_CLOUD_REGION --max-instances 20"
