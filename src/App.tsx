import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStoryStore } from './store/storyStore';
import { useAuthStore } from './store/authStore';
import { StoryHeader } from './components/StoryHeader';
import { StoryEditor } from './components/StoryEditor';
import { AIPanel } from './components/AIPanel';
import { SEOHead } from './components/SEOHead';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import ProjectGallery from './pages/ProjectGallery';
import StoryboardWorkspace from './pages/StoryboardWorkspace';
import './App.css';

/**
 * AI Story Studio Frontend - Main Application Component
 * 
 * This is the root component for the AI-powered story creation platform.
 * Built with React and TypeScript for rich text editing and real-time AI integration.
 * 
 * Version 1.1: Enhanced with cinematic features and user authentication
 */
function App() {
    const { currentStory, createNewStory, showAIPanel, toggleAIPanel } = useStoryStore();
    const { initializeAuth, isAuthenticated, isLoading } = useAuthStore();

    // Initialize authentication on app start
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Create a default story on first load for authenticated users
    useEffect(() => {
        if (isAuthenticated && !currentStory) {
            createNewStory('My First Story');
        }
    }, [isAuthenticated, currentStory, createNewStory]);

    // Show loading spinner during auth initialization
    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Loading AI Story Studio...</p>
            </div>
        );
    }

    // Original Story Editor Component
    const StoryStudio = () => (
        <div className="app">
            <StoryHeader />

            <main className="app-main">
                <div className="writing-workspace">
                    <div className="editor-section">
                        <StoryEditor />
                    </div>

                    {showAIPanel && (
                        <div className="ai-section" id="ai-panel" role="complementary" aria-label="AI Assistant Panel">
                            <AIPanel />
                        </div>
                    )}
                </div>

                <button
                    onClick={toggleAIPanel}
                    className="ai-toggle-button"
                    title={showAIPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
                    aria-label={showAIPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
                    aria-expanded={showAIPanel}
                    aria-controls="ai-panel"
                >
                    <span aria-hidden="true">🤖</span>
                    <span className="button-text">{showAIPanel ? 'Hide AI' : 'Show AI'}</span>
                </button>
            </main>
        </div>
    );

    return (
        <Router>
            <SEOHead />
            
            {/* Authentication Modals */}
            <LoginModal />
            <RegisterModal />
            <SubscriptionModal />
            
            <Routes>
                <Route path="/" element={<Navigate to="/cinematic" replace />} />
                <Route path="/cinematic" element={<ProjectGallery />} />
                <Route path="/cinematic/project/:projectId" element={<StoryboardWorkspace />} />
                <Route path="/story" element={<StoryStudio />} />
            </Routes>
        </Router>
    );
}

export default App;
