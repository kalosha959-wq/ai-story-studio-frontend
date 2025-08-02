# AI Story Studio Frontend - Copilot Instructions

## Project Status: Production-Ready Application
This is a **feature-complete AI story creation platform** with React frontend and Express.js backend. The application is production-ready with comprehensive authentication, state management, cinematic storytelling capabilities, and complete deployment infrastructure.

**Current State**: Full-stack TypeScript application with React 19, TipTap editor, Zustand stores, JWT authentication, comprehensive CI/CD, and Google Cloud Run deployment.

## Critical Context for AI Agents

### Application Architecture Reality
- **Frontend**: React 19.1.0 + TypeScript 5.8.3 + Vite 7.0.5
- **Backend**: Express.js with TypeScript, comprehensive security middleware
- **Rich Text**: TipTap editor with character count, placeholder, starter kit extensions
- **State Management**: Zustand stores (`storyStore`, `cinematicStore`)
- **Authentication**: JWT with bcrypt, complete user management system
- **Styling**: CSS Modules with Framer Motion animations
- **Build Output**: Vite builds to `dist/`, TypeScript compiles with strict mode
- **Deployment**: Google Cloud Run with automated Docker builds

### Core Application Components

#### Frontend Architecture (`src/`)
- **App.tsx**: Main router with SEO head, navigation between story editor and cinematic workspace
- **StoryEditor.tsx**: TipTap-based rich text editor with professional toolbar and accessibility
- **AIPanel.tsx**: AI writing assistant interface with prompt management and error handling
- **StoryHeader.tsx**: Navigation and project management interface
- **ProjectGallery.tsx**: Story project overview and management
- **StoryboardWorkspace.tsx**: Cinematic project creation and editing interface

#### State Management (`src/store/`)
- **storyStore.ts**: Zustand store managing current story, AI generation state, UI state
  - Story CRUD operations (create, update, save, load, delete)
  - AI generation flow (prompt setting, generation state, text addition)
  - UI state management (editor focus, AI panel visibility)
- **cinematicStore.ts**: Comprehensive cinematic project management
  - Characters, locations, scenes, camera shots
  - Project versioning and collaboration features
  - AI generation configuration for cinematic content

#### Backend Architecture (`backend/src/`)
- **Complete Authentication System** (`routes/auth.ts`):
  - User registration with 7-day Pro trial
  - Login with account locking (5 attempts = 30min lock)
  - Password reset with secure token system
  - Email verification workflow
  - JWT token generation with proper TypeScript typing
- **Security Middleware**: Firewall, encryption, request logging, URL protection
- **Payment Integration**: PayPal service with billing plans and subscriptions
- **Database Models**: User and subscription management with TypeScript interfaces

### Development Workflow

#### Build & Development Commands
```bash
npm run dev        # Start Vite dev server (localhost:3000, auto-detects port conflicts)
npm run build      # TypeScript compilation + Vite production build
npm run preview    # Preview production build locally
npm run lint       # ESLint with TypeScript support
```

#### Production Deployment Commands
```bash
./deploy-cloudrun.sh     # Deploy to Google Cloud Run (requires gcloud setup)
./deploy-production.sh   # Deploy to AWS/VPS (requires AWS CLI)
npm run preview         # Test production build locally before deployment
```

#### VS Code Debug Configuration
1. **"Launch Chrome against localhost"** - Chrome debugger on port 3000 with source maps
2. **"Launch Program"** - Node.js execution of `app.js` (development entry point)
3. **"JavaScript Debug Terminal"** - Interactive debugging environment

### Key Dependencies & Integration Patterns

#### Essential Frontend Dependencies
- **React 19.1.0**: Latest React with concurrent features
- **@tiptap/react 3.0.7**: Rich text editor with extensions
- **zustand 5.0.6**: Lightweight state management
- **framer-motion 12.23.6**: Animation library
- **lucide-react 0.525.0**: Icon system
- **@dnd-kit/core**: Drag and drop functionality
- **react-router-dom 7.7.0**: Client-side routing

#### Backend Integration Points
- **API Client** (`src/api/client.ts`): Configured for backend communication
- **Authentication Flow**: JWT token management and user session handling
- **Encryption**: AES-256 encryption utilities for sensitive data
- **Legal Documentation**: Complete terms, privacy policy, NDA templates

### Production Infrastructure

#### Google Cloud Run Deployment (Primary)
- **Containerized Deployment**: Docker builds with multi-stage optimization
- **Auto-scaling**: 0-10 instances based on traffic
- **Environment Configuration**: `.env.production` with Cloud SQL integration
- **Health Checks**: Automated health monitoring and rollback
- **CI/CD Integration**: GitHub Actions with automated testing and deployment

#### AWS/VPS Deployment (Alternative)
- **Static Frontend**: S3 + CloudFront distribution
- **Backend Services**: PM2 cluster mode with ecosystem configuration
- **Database**: PostgreSQL with connection pooling
- **SSL/TLS**: Let's Encrypt with auto-renewal

#### Monitoring & Security
- **Datadog Synthetics**: E2E testing with GitHub Actions integration
- **CodeQL Analysis**: Automated security scanning
- **Error Tracking**: Sentry integration ready
- **Performance Monitoring**: New Relic configuration available

### Critical Integration Patterns

#### TipTap Editor Integration
```typescript
// TipTap setup with character count and placeholder
const editor = useEditor({
  extensions: [StarterKit, CharacterCount, Placeholder],
  content: currentStory?.content || '',
  onUpdate: ({ editor }) => updateStoryContent(editor.getHTML()),
});
```

#### Zustand State Pattern
```typescript
// Immutable updates with proper TypeScript typing
set((state) => ({
  currentStory: updatedStory,
  stories: state.stories.map(story =>
    story.id === currentStory.id ? updatedStory : story
  ),
}));
```

#### Production Build Optimization
```javascript
// vite.config.js - Optimized for production with source maps
export default defineConfig({
  build: {
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        // Code splitting for optimal loading
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
```

### Deployment Configuration Patterns

#### Environment Management
- **Development**: `npm run dev` with HMR on port 3000
- **Production Preview**: `npm run preview` on port 4173
- **Production Deploy**: Automated build → container → Cloud Run

#### CI/CD Workflow
1. **GitHub Actions Trigger**: Push to main or manual dispatch
2. **Parallel Testing**: Frontend + Backend test suites
3. **Build Artifacts**: Production-optimized bundles
4. **Deployment**: Google Cloud Run with zero-downtime updates
5. **Health Verification**: Automated endpoint testing

### Security & Legal Considerations

#### AGPL v3.0 License Requirements
- **Source Disclosure**: Network-served applications must provide source access
- **Copyleft**: Derivative works must also be AGPL v3.0
- **Attribution**: Proper attribution required for modifications

#### Security Implementation
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Security**: Proper signing with configurable expiration
- **Request Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Account locking for failed authentication attempts
- **Encryption**: AES-256 for sensitive data storage
- **Container Security**: Non-root user execution in Docker

### Debugging & Troubleshooting

#### Common Development Patterns
- **Error Boundaries**: Implemented for graceful error handling
- **Loading States**: Consistent user feedback across components
- **TypeScript Strict Mode**: Full type safety with strict configuration
- **Hot Module Replacement**: Vite HMR for rapid development

#### Production Debugging
- **Source Maps**: Available in production builds for debugging
- **Health Endpoints**: `/health` routes for monitoring
- **Log Aggregation**: Structured logging with Docker and Cloud Run
- **Performance Metrics**: Built-in monitoring and alerting

---

**Status**: ✅ **Production-Ready Application**

This is a complete, feature-rich AI story creation platform ready for deployment. The codebase includes 39+ TypeScript files with ~8,000 lines of production-quality code, comprehensive error handling, accessibility compliance, security best practices, and enterprise-grade deployment infrastructure.

**For AI Agents**: You're working with a mature application with full deployment automation. Focus on feature enhancement, performance optimization, and maintaining the established architectural patterns. Use `./deploy-cloudrun.sh` for Google Cloud deployment or `./deploy-production.sh` for AWS/VPS deployment.
