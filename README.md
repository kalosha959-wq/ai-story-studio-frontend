# 🎬 AI Story Studio - Professional Cinematic Platform

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/kalosha959-wq/ai-story-studio-frontend)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-AES--256-red.svg)](#security-features)
[![SEO](https://img.shields.io/badge/SEO-optimized-brightgreen.svg)](#seo-optimization)

**AI Story Studio** is a revolutionary AI-powered platform designed for directors, actors, screenwriters, and content creators. Create professional stories, storyboards, and cinematic content with advanced artificial intelligence tools and military-grade security.

## ✨ Features

- **Rich Text Editor**: Advanced editing tools for professional story creation
- **AI Assistance**: Real-time story generation and enhancement suggestions  
- **Modern Stack**: React 19 + TypeScript + Vite for fast development
- **VS Code Integration**: Pre-configured debugging and launch configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/kalosha959-wq/ai-story-studio-frontend.git
cd ai-story-studio-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🛠️ Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm start` | Start server using app.js (for VS Code debugging) |
| `npm run lint` | Run ESLint (when configured) |

## 🔧 VS Code Integration

This project is optimized for VS Code development:

### Launch Configurations
- **"Launch Chrome against localhost"** - Debug in Chrome on port 3000
- **"Launch Program"** - Debug Node.js app.js entry point  
- **"JavaScript Debug Terminal"** - Interactive debugging environment

### Usage
1. Open project in VS Code
2. Go to Run and Debug (Ctrl/Cmd + Shift + D)
3. Select desired launch configuration
4. Press F5 to start debugging

## 📁 Project Structure

```
ai-story-studio-frontend/
├── .github/
│   └── copilot-instructions.md    # AI coding assistant guidelines
├── .vscode/
│   └── launch.json                # VS Code debug configurations
├── public/
│   └── vite.svg                   # App favicon
├── src/
│   ├── App.tsx                    # Main React component
│   ├── App.css                    # App-specific styles
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles
├── app.js                         # Node.js entry point for debugging
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # Node.js TypeScript config
└── vite.config.js                 # Vite bundler configuration
```

## 🎯 Development Workflow

1. **Start Development**: `npm run dev`
2. **Code & Debug**: Use VS Code launch configurations for debugging
3. **Build**: `npm run build` creates production bundle in `dist/`
4. **Preview**: `npm run preview` to test production build locally

## 📝 License

GNU Affero General Public License v3.0 (AGPL-3.0)

This project is open source and requires source disclosure for network-served applications.

## 🤝 Contributing

This is the frontend component of the AI Story Studio project. Please ensure:

- Follow TypeScript best practices
- Maintain VS Code debugging compatibility
- Update copilot instructions for significant architectural changes
- Test both development and production builds

---

**Status**: ✅ **Ready for Development**

The project is fully bootstrapped and ready for feature development. See `.github/copilot-instructions.md` for AI coding assistant guidance.