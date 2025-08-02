import { useState } from 'react';
import { useStoryStore } from '../store/storyStore';
import { useUserStore } from '../store/userStore';
import { AuthModal } from './AuthModal';
import { Save, FileText, Calendar, RotateCcw, LogIn, LogOut, User } from 'lucide-react';
import './StoryHeader.css';

export const StoryHeader = () => {
    const {
        currentStory,
        updateStoryTitle,
        saveStory,
        createNewStory,
    } = useStoryStore();

    const {
        user,
        isAuthenticated,
        showAuthModal,
        openAuthModal,
        closeAuthModal,
        logout,
        setUser
    } = useUserStore();

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState('');

    const handleTitleEdit = () => {
        if (!currentStory) return;
        setTempTitle(currentStory.title);
        setIsEditingTitle(true);
    };

    const handleTitleSave = () => {
        if (tempTitle.trim()) {
            updateStoryTitle(tempTitle.trim());
        }
        setIsEditingTitle(false);
    };

    const handleTitleCancel = () => {
        setTempTitle('');
        setIsEditingTitle(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!currentStory) {
        return (
            <div className="story-header no-story">
                <div className="header-content">
                    <div className="no-story-message">
                        <FileText size={24} />
                        <span>No story selected</span>
                    </div>
                    <button
                        onClick={() => createNewStory()}
                        className="new-story-button"
                    >
                        Create New Story
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="story-header">
            <div className="header-content">
                <div className="story-info">
                    <div className="story-title-section">
                        {isEditingTitle ? (
                            <div className="title-edit-container">
                                <input
                                    type="text"
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onBlur={handleTitleSave}
                                    onKeyDown={handleKeyPress}
                                    className="title-input"
                                    autoFocus
                                    maxLength={100}
                                />
                                <div className="title-edit-hint">
                                    Press Enter to save, Escape to cancel
                                </div>
                            </div>
                        ) : (
                            <h1
                                className="story-title"
                                onClick={handleTitleEdit}
                                title="Click to edit title"
                            >
                                {currentStory.title}
                            </h1>
                        )}
                    </div>

                    <div className="story-metadata">
                        <div className="metadata-item">
                            <Calendar size={14} />
                            <span>Created: {formatDate(currentStory.createdAt)}</span>
                        </div>
                        {currentStory.updatedAt.getTime() !== currentStory.createdAt.getTime() && (
                            <div className="metadata-item">
                                <RotateCcw size={14} />
                                <span>Updated: {formatDate(currentStory.updatedAt)}</span>
                            </div>
                        )}
                        <div className="metadata-item">
                            <FileText size={14} />
                            <span>{currentStory.wordCount} words</span>
                        </div>
                        {currentStory.genre && (
                            <div className="metadata-item genre">
                                <span>{currentStory.genre}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="header-actions">
                    {/* User Authentication Section */}
                    <div className="user-section">
                        {isAuthenticated && user ? (
                            <div className="user-info">
                                <div className="user-avatar">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="avatar-image" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user.name}</span>
                                    {user.subscription && (
                                        <span className={`user-plan ${user.subscription.plan}`}>
                                            {user.subscription.plan}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={logout}
                                    className="logout-button"
                                    title="Sign out"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={openAuthModal}
                                className="login-button"
                                title="Sign in to save your stories"
                            >
                                <LogIn size={16} />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={saveStory}
                        className="save-button"
                        title="Save story"
                    >
                        <Save size={16} />
                        <span>Save</span>
                    </button>

                    <button
                        onClick={() => createNewStory()}
                        className="new-story-button"
                        title="Create new story"
                    >
                        <FileText size={16} />
                        <span>New Story</span>
                    </button>
                </div>
            </div>

            {/* Authentication Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={closeAuthModal}
                onAuthSuccess={setUser}
            />
        </div>
    );
};
