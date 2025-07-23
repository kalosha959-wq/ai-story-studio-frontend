import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCinematicStore } from '../store/cinematicStore';
import './StoryboardWorkspace.css';
import {
    Plus,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Camera,
    Users,
    MapPin,
    Palette,
    Wand2,
    Download,
    Share,
    Settings,
    Eye,
    Grid3X3,
    List,
    Layers
} from 'lucide-react';
import './StoryboardWorkspace.css';

const StoryboardWorkspace = () => {
    const {
        currentProject,
        currentScene,
        currentVersion,
        setViewMode,
        createScene,
        generateStoryboard,
        generateVideoPreview,
        generateSceneVariations,
        isGeneratingStoryboard,
        isGeneratingVideo,
        generationProgress
    } = useCinematicStore();

    const [selectedShot, setSelectedShot] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [viewLayout, setViewLayout] = useState<'grid' | 'list' | 'timeline'>('grid');
    const storyboardRef = useRef<HTMLDivElement>(null);

    if (!currentProject) {
        return (
            <div className="workspace-empty">
                <h2>No Project Selected</h2>
                <p>Please select or create a project to start working on storyboards.</p>
                <button onClick={() => setViewMode('gallery')} className="back-to-gallery">
                    Back to Gallery
                </button>
            </div>
        );
    }

    const handleCreateScene = () => {
        const title = prompt('Scene title:');
        const description = prompt('Scene description:');
        if (title && description) {
            createScene(title, description);
        }
    };

    const handleGenerateStoryboard = () => {
        if (currentScene && currentVersion) {
            generateStoryboard(currentScene.id, currentVersion.id);
        }
    };

    const handleGenerateVideo = () => {
        if (currentScene && currentVersion) {
            generateVideoPreview(currentScene.id, currentVersion.id);
        }
    };

    const handleGenerateVariations = () => {
        if (currentScene) {
            const count = parseInt(prompt('How many variations to generate?') || '3');
            if (count > 0) {
                generateSceneVariations(currentScene.id, count);
            }
        }
    };

    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
        // Implement actual playback logic here
    };

    const mockStoryboardPanels = currentScene?.storyboardImages || [];

    return (
        <div className="storyboard-workspace">
            {/* Header */}
            <div className="workspace-header">
                <div className="header-left">
                    <button
                        onClick={() => setViewMode('gallery')}
                        className="back-button"
                    >
                        ← Gallery
                    </button>
                    <div className="project-info">
                        <h1>{currentProject.title}</h1>
                        <span className="project-genre">{currentProject.genre}</span>
                    </div>
                </div>

                <div className="header-center">
                    <div className="scene-selector">
                        {currentProject.scenes.length === 0 ? (
                            <button onClick={handleCreateScene} className="create-scene-btn">
                                <Plus size={16} />
                                Create First Scene
                            </button>
                        ) : (
                            <select className="scene-dropdown">
                                {currentProject.scenes.map(scene => (
                                    <option key={scene.id} value={scene.id}>
                                        Scene {scene.order + 1}: {scene.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <div className="view-controls">
                        <button
                            className={viewLayout === 'grid' ? 'active' : ''}
                            onClick={() => setViewLayout('grid')}
                        >
                            <Grid3X3 size={16} />
                        </button>
                        <button
                            className={viewLayout === 'list' ? 'active' : ''}
                            onClick={() => setViewLayout('list')}
                        >
                            <List size={16} />
                        </button>
                        <button
                            className={viewLayout === 'timeline' ? 'active' : ''}
                            onClick={() => setViewLayout('timeline')}
                        >
                            <Layers size={16} />
                        </button>
                    </div>
                    <button className="settings-button">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="workspace-content">
                {/* Sidebar */}
                <div className="workspace-sidebar">
                    {/* AI Generation Panel */}
                    <div className="sidebar-section">
                        <h3>🤖 AI Generation</h3>
                        <div className="ai-controls">
                            <motion.button
                                className="ai-button primary"
                                onClick={handleGenerateStoryboard}
                                disabled={isGeneratingStoryboard || !currentScene}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Wand2 size={16} />
                                {isGeneratingStoryboard ? 'Generating...' : 'Generate Storyboard'}
                            </motion.button>

                            <motion.button
                                className="ai-button secondary"
                                onClick={handleGenerateVideo}
                                disabled={isGeneratingVideo || !currentScene}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Play size={16} />
                                {isGeneratingVideo ? 'Creating...' : 'Generate Preview'}
                            </motion.button>

                            <motion.button
                                className="ai-button tertiary"
                                onClick={handleGenerateVariations}
                                disabled={!currentScene}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Layers size={16} />
                                Create Variations
                            </motion.button>
                        </div>

                        {(isGeneratingStoryboard || isGeneratingVideo) && (
                            <div className="generation-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                                <span>{Math.round(generationProgress)}%</span>
                            </div>
                        )}
                    </div>

                    {/* Scene Details */}
                    {currentScene && (
                        <div className="sidebar-section">
                            <h3>📝 Scene Details</h3>
                            <div className="scene-details">
                                <div className="detail-item">
                                    <Camera size={14} />
                                    <span>{currentVersion?.cameraShots.length || 0} shots</span>
                                </div>
                                <div className="detail-item">
                                    <Users size={14} />
                                    <span>{currentVersion?.characters.length || 0} characters</span>
                                </div>
                                <div className="detail-item">
                                    <MapPin size={14} />
                                    <span>{currentVersion?.location || 'No location'}</span>
                                </div>
                                <div className="detail-item">
                                    <Palette size={14} />
                                    <span>{currentVersion?.mood || 'Neutral mood'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="sidebar-section">
                        <h3>⚡ Quick Actions</h3>
                        <div className="quick-actions">
                            <button className="quick-action">
                                <Download size={16} />
                                Export
                            </button>
                            <button className="quick-action">
                                <Share size={16} />
                                Share
                            </button>
                            <button className="quick-action">
                                <Eye size={16} />
                                Preview
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Storyboard Area */}
                <div className="storyboard-main">
                    {currentScene ? (
                        <>
                            {/* Playback Controls */}
                            <div className="playback-controls">
                                <button onClick={togglePlayback} className="play-button">
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button className="skip-button">
                                    <SkipBack size={16} />
                                </button>
                                <button className="skip-button">
                                    <SkipForward size={16} />
                                </button>
                                <div className="playback-info">
                                    <span>Shot {selectedShot !== null ? selectedShot + 1 : 1} of {mockStoryboardPanels.length || 1}</span>
                                    <select
                                        value={playbackSpeed}
                                        onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                                        className="speed-selector"
                                    >
                                        <option value={0.5}>0.5x</option>
                                        <option value={1}>1x</option>
                                        <option value={1.5}>1.5x</option>
                                        <option value={2}>2x</option>
                                    </select>
                                </div>
                            </div>

                            {/* Storyboard Display */}
                            <div className={`storyboard-container ${viewLayout}`} ref={storyboardRef}>
                                {mockStoryboardPanels.length > 0 ? (
                                    mockStoryboardPanels.map((imageUrl, index) => (
                                        <motion.div
                                            key={index}
                                            className={`storyboard-panel ${selectedShot === index ? 'selected' : ''}`}
                                            onClick={() => setSelectedShot(index)}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <div className="panel-image">
                                                <img src={imageUrl} alt={`Shot ${index + 1}`} />
                                            </div>
                                            <div className="panel-info">
                                                <span className="shot-number">Shot {index + 1}</span>
                                                <span className="shot-type">Wide Shot</span>
                                                <span className="shot-duration">3.2s</span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="empty-storyboard">
                                        <Camera size={64} />
                                        <h3>No Storyboard Yet</h3>
                                        <p>Generate AI storyboards to visualize your scene</p>
                                        <button
                                            onClick={handleGenerateStoryboard}
                                            className="generate-cta"
                                            disabled={isGeneratingStoryboard}
                                        >
                                            <Wand2 size={16} />
                                            Generate Storyboard
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Video Preview */}
                            {currentScene.videoPreviewUrl && (
                                <div className="video-preview">
                                    <h4>AI Generated Preview</h4>
                                    <video
                                        src={currentScene.videoPreviewUrl}
                                        controls
                                        className="preview-video"
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-scene-selected">
                            <Camera size={64} />
                            <h2>No Scene Selected</h2>
                            <p>Create your first scene to start building your storyboard</p>
                            <button onClick={handleCreateScene} className="create-scene-cta">
                                <Plus size={20} />
                                Create Scene
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryboardWorkspace;
