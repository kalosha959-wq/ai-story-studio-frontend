#!/bin/bash

# 🎬 AI Story Studio - Demo Launch Script
# Quick start script for reviewers and demo purposes

echo "🎬 Starting AI Story Studio Demo..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    echo "Please install npm or use yarn"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are available${NC}"

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Create environment files if they don't exist
if [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}⚙️ Creating demo environment file...${NC}"
    cat > .env.development << EOL
# AI Story Studio - Demo Environment
NODE_ENV=development
PORT=3000
VITE_API_URL=http://localhost:3001

# Demo API Keys (replace with real keys)
VITE_DEMO_MODE=true
VITE_ENABLE_AI=false
EOL
fi

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚙️ Creating backend environment file...${NC}"
    cat > backend/.env << EOL
# AI Story Studio Backend - Demo Environment
NODE_ENV=development
PORT=3001
JWT_SECRET=demo_jwt_secret_change_in_production
ENCRYPTION_KEY=demo_encryption_key_32_chars_long

# Database (Demo mode uses in-memory storage)
DATABASE_URL=memory://demo

# AI Services (Add your API keys here)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOL
fi

echo -e "${GREEN}✅ Environment setup complete${NC}"

# Function to start services
start_services() {
    echo -e "${BLUE}🚀 Starting AI Story Studio services...${NC}"
    
    # Start backend in background
    echo -e "${BLUE}🔧 Starting backend server on port 3001...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo -e "${BLUE}🎨 Starting frontend server on port 3000...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for services to start
    sleep 5
    
    echo ""
    echo -e "${GREEN}🎉 AI Story Studio is now running!${NC}"
    echo "========================================"
    echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "Backend:  ${BLUE}http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}📝 Demo Instructions:${NC}"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Click 'Get Started' to create an account"
    echo "3. Explore the Story Editor and AI Panel"
    echo "4. Try creating a new project"
    echo "5. Test the story generation features"
    echo ""
    echo -e "${YELLOW}⚠️  Note: AI features are in demo mode${NC}"
    echo "   Add real API keys to backend/.env for full functionality"
    echo ""
    echo -e "Press ${RED}Ctrl+C${NC} to stop all services"
    
    # Wait for user interrupt
    wait $FRONTEND_PID $BACKEND_PID
}

# Function to cleanup processes
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping AI Story Studio...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set trap to cleanup on interrupt
trap cleanup SIGINT

# Start the demo
start_services
