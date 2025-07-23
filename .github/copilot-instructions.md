# AI Story Studio Frontend - Copilot Instructions

## Project Status: Production-Ready Application
This is a **feature-complete AI story creation platform** with React frontend and Express.js backend. The application is production-ready with comprehensive authentication, state management, and cinematic storytelling capabilities.

**Current State**: Full-stack TypeScript application with React 19, TipTap editor, Zustand stores, JWT authentication, and comprehensive UI/UX.

## Critical Context for AI Agents

### Application Architecture Reality
- **Frontend**: React 19.1.0 + TypeScript 5.8.3 + Vite 7.0.5
- **Backend**: Express.js with TypeScript, comprehensive security middleware
- **Rich Text**: TipTap editor with character count, placeholder, starter kit extensions
- **State Management**: Zustand stores (`storyStore`, `cinematicStore`)
- **Authentication**: JWT with bcrypt, complete user management system
- **Styling**: CSS Modules with Framer Motion animations
- **Build Output**: Vite builds to `dist/`, TypeScript compiles with strict mode

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
npm run dev        # Start Vite dev server (localhost:3000)
npm run build      # TypeScript compilation + Vite production build
npm run preview    # Preview production build locally
npm run lint       # ESLint with TypeScript support
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

### Accessibility & User Experience Standards

#### WCAG AAA Compliance Achieved
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Color Contrast**: High contrast ratios for all text and UI elements
- **Focus Management**: Clear focus indicators and logical tab order
- **Loading States**: User feedback for all asynchronous operations

#### Mobile-First Responsive Design
- **Slide-up AI Panel**: Mobile-optimized interface preventing overlap
- **Touch-friendly Controls**: Appropriately sized touch targets
- **Responsive Typography**: Fluid text scaling across devices
- **Optimized Performance**: Lazy loading and efficient re-renders

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

#### AI Generation Flow
1. User inputs prompt in AIPanel
2. `startAIGeneration()` sets loading state
3. Backend integration ready for OpenAI/Claude APIs
4. `addGeneratedText()` appends AI response to editor

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

### Debugging & Troubleshooting

#### Common Development Patterns
- **Error Boundaries**: Implemented for graceful error handling
- **Loading States**: Consistent user feedback across components
- **TypeScript Strict Mode**: Full type safety with strict configuration
- **Hot Module Replacement**: Vite HMR for rapid development

#### VS Code Integration
- **Launch Configurations**: Pre-configured for both frontend and backend debugging
- **TypeScript IntelliSense**: Full IDE support with proper type definitions
- **Source Maps**: Accurate debugging in development and production builds

---

**Status**: ✅ **Production-Ready Application**

This is a complete, feature-rich AI story creation platform ready for deployment. The codebase includes 39+ TypeScript files with ~8,000 lines of production-quality code, comprehensive error handling, accessibility compliance, and security best practices.

**For AI Agents**: You're working with a mature application. Focus on feature enhancement, performance optimization, and maintaining the established architectural patterns rather than basic setup.
