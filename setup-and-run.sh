#!/bin/bash

# 🚀 AI Story Studio - Quick Setup & Run Script
# This script sets up the development environment and runs the app

echo "🎯 AI Story Studio - Quick Setup & Run"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is designed for macOS${NC}"
    exit 1
fi

# Function to install Homebrew
install_homebrew() {
    echo -e "${BLUE}📦 Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
}

# Function to install Node.js
install_nodejs() {
    echo -e "${BLUE}🟢 Installing Node.js...${NC}"
    brew install node
}

# Check if Homebrew is installed
echo -n "🍺 Checking Homebrew: "
if command -v brew &> /dev/null; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
    read -p "Would you like to install Homebrew? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_homebrew
    else
        echo -e "${RED}❌ Homebrew is required to install Node.js${NC}"
        exit 1
    fi
fi

# Check if Node.js is installed
echo -n "🟢 Checking Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}FOUND ($NODE_VERSION)${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
    read -p "Would you like to install Node.js? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_nodejs
    else
        echo -e "${RED}❌ Node.js is required to run the application${NC}"
        exit 1
    fi
fi

# Check if npm is available
echo -n "📦 Checking npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}FOUND ($NPM_VERSION)${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
    echo -e "${RED}❌ npm should be installed with Node.js${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Setup completed successfully!${NC}"

# Start the development server
echo -e "\n${BLUE}🚀 Starting AI Story Studio...${NC}"
echo -e "${YELLOW}📱 The app will open at: http://localhost:5173${NC}"
echo -e "${YELLOW}🔧 Backend will run at: http://localhost:3000${NC}"
echo -e "${YELLOW}🛑 Press Ctrl+C to stop the server${NC}\n"

# Start frontend development server
npm run dev
