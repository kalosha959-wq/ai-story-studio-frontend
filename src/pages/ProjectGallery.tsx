import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCinematicStore } from '../store/cinematicStore';
import { Plus, Film, Calendar, Users, MapPin, Star, PlayCircle } from 'lucide-react';
import './ProjectGallery.css';

const ProjectGallery = () => {
    const navigate = useNavigate();
    const { projects, createProject, setCurrentProject, setViewMode } = useCinematicStore();

    const handleCreateProject = () => {
        const title = prompt('Enter project title:');
        const genre = prompt('Enter genre (e.g., Drama, Action, Comedy):');

        if (title && genre) {
            createProject(title, genre);
            setViewMode('storyboard');
        }
    };

    const handleOpenProject = (projectId: string) => {
        setCurrentProject(projectId);
        setViewMode('storyboard');
        navigate(`/cinematic/project/${projectId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return '#94a3b8';
            case 'in-development': return '#3b82f6';
            case 'pre-production': return '#f59e0b';
            case 'production': return '#10b981';
            case 'completed': return '#8b5cf6';
            default: return '#94a3b8';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="project-gallery">
            <div className="gallery-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1>🎬 AI Cinema Studio</h1>
                        <p>Professional Film Pre-Production & Storyboard Generation</p>
                    </div>

                    <motion.button
                        className="create-project-btn"
                        onClick={handleCreateProject}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus size={20} />
                        New Project
                    </motion.button>
                </div>
            </div>

            <div className="gallery-content">
                {projects.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Film size={64} className="empty-icon" />
                        <h2>Start Your Cinematic Journey</h2>
                        <p>Create your first AI-powered film project with intelligent storyboard generation, character design, and scene visualization.</p>
                        <motion.button
                            className="create-first-project"
                            onClick={handleCreateProject}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={20} />
                            Create Your First Project
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                className="project-card"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                onClick={() => handleOpenProject(project.id)}
                            >
                                <div className="project-cover">
                                    {project.coverImage ? (
                                        <img src={project.coverImage} alt={project.title} />
                                    ) : (
                                        <div className="default-cover">
                                            <Film size={48} />
                                        </div>
                                    )}
                                    <div className="project-overlay">
                                        <PlayCircle size={32} className="play-icon" />
                                    </div>
                                </div>

                                <div className="project-info">
                                    <div className="project-header">
                                        <h3 className="project-title">{project.title}</h3>
                                        <div
                                            className="project-status"
                                            style={{ backgroundColor: getStatusColor(project.status) }}
                                        >
                                            {formatStatus(project.status)}
                                        </div>
                                    </div>

                                    <p className="project-genre">{project.genre}</p>

                                    {project.logline && (
                                        <p className="project-logline">{project.logline}</p>
                                    )}

                                    <div className="project-stats">
                                        <div className="stat">
                                            <Film size={14} />
                                            <span>{project.scenes.length} scenes</span>
                                        </div>
                                        <div className="stat">
                                            <Users size={14} />
                                            <span>{project.characters.length} characters</span>
                                        </div>
                                        <div className="stat">
                                            <MapPin size={14} />
                                            <span>{project.locations.length} locations</span>
                                        </div>
                                    </div>

                                    <div className="project-meta">
                                        <div className="meta-item">
                                            <Calendar size={12} />
                                            <span>Updated {project.updatedAt.toLocaleDateString()}</span>
                                        </div>
                                        {project.scenes.some(scene => scene.storyboardImages.length > 0) && (
                                            <div className="meta-item">
                                                <Star size={12} />
                                                <span>Has Storyboards</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="gallery-footer">
                <div className="footer-stats">
                    <div className="stat">
                        <strong>{projects.length}</strong>
                        <span>Projects</span>
                    </div>
                    <div className="stat">
                        <strong>{projects.reduce((sum, p) => sum + p.scenes.length, 0)}</strong>
                        <span>Total Scenes</span>
                    </div>
                    <div className="stat">
                        <strong>{projects.reduce((sum, p) => sum + p.characters.length, 0)}</strong>
                        <span>Characters Created</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectGallery;
