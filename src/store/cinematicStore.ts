import { create } from 'zustand';

// Enhanced types for cinematic storytelling

export interface Character {
    id: string;
    name: string;
    description: string;
    appearance: string;
    personality: string;
    voice: string;
    imageUrl?: string;
    modelUrl?: string; // For 3D character models
}

export interface Location {
    id: string;
    name: string;
    description: string;
    type: 'interior' | 'exterior' | 'studio' | 'virtual';
    lighting: string;
    weather?: string;
    timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
    mood: string;
    imageUrl?: string;
}

export interface CameraShot {
    id: string;
    type: 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'over-shoulder' | 'bird-eye' | 'low-angle' | 'high-angle';
    movement: 'static' | 'pan' | 'tilt' | 'zoom' | 'dolly' | 'crane' | 'handheld' | 'steadicam';
    duration: number; // in seconds
    description: string;
}

export interface SceneVersion {
    id: string;
    name: string;
    dialogue: string;
    direction: string;
    cameraShots: CameraShot[];
    characters: string[]; // Character IDs
    location: string; // Location ID
    mood: string;
    pacing: 'slow' | 'medium' | 'fast' | 'dynamic';
    createdAt: Date;
}

export interface Scene {
    id: string;
    title: string;
    description: string;
    versions: SceneVersion[];
    activeVersionId: string;
    storyboardImages: string[];
    videoPreviewUrl?: string;
    order: number;
}

export interface CinematicProject {
    id: string;
    title: string;
    genre: string;
    logline: string; // One-line summary
    synopsis: string;
    characters: Character[];
    locations: Location[];
    scenes: Scene[];
    createdAt: Date;
    updatedAt: Date;
    coverImage?: string;
    status: 'draft' | 'in-development' | 'pre-production' | 'production' | 'completed';
}

export interface AIGenerationConfig {
    style: 'cinematic' | 'documentary' | 'artistic' | 'commercial' | 'indie';
    tone: 'dramatic' | 'comedic' | 'suspenseful' | 'romantic' | 'action' | 'horror';
    visualStyle: 'realistic' | 'stylized' | 'noir' | 'colorful' | 'minimalist';
    budget: 'low' | 'medium' | 'high' | 'unlimited';
}

interface CinematicState {
    // Current project
    currentProject: CinematicProject | null;
    projects: CinematicProject[];

    // Current editing context
    currentScene: Scene | null;
    currentVersion: SceneVersion | null;

    // AI Generation
    aiConfig: AIGenerationConfig;
    isGeneratingStoryboard: boolean;
    isGeneratingVideo: boolean;
    isGeneratingScene: boolean;
    generationProgress: number;

    // UI State
    viewMode: 'gallery' | 'storyboard' | 'script' | 'production';
    selectedCharacters: string[];
    selectedLocations: string[];
    showAIAssistant: boolean;
    sidebarCollapsed: boolean;

    // Actions
    createProject: (title: string, genre: string) => void;
    updateProject: (updates: Partial<CinematicProject>) => void;
    setCurrentProject: (projectId: string) => void;
    deleteProject: (projectId: string) => void;

    // Scene management
    createScene: (title: string, description: string) => void;
    updateScene: (sceneId: string, updates: Partial<Scene>) => void;
    deleteScene: (sceneId: string) => void;
    reorderScenes: (sceneIds: string[]) => void;

    // Version management
    createSceneVersion: (sceneId: string, dialogue: string) => void;
    updateSceneVersion: (versionId: string, updates: Partial<SceneVersion>) => void;
    setActiveVersion: (sceneId: string, versionId: string) => void;
    duplicateVersion: (versionId: string) => void;

    // Character & Location management
    addCharacter: (character: Omit<Character, 'id'>) => void;
    updateCharacter: (characterId: string, updates: Partial<Character>) => void;
    deleteCharacter: (characterId: string) => void;

    addLocation: (location: Omit<Location, 'id'>) => void;
    updateLocation: (locationId: string, updates: Partial<Location>) => void;
    deleteLocation: (locationId: string) => void;

    // AI Generation actions
    generateStoryboard: (sceneId: string, versionId: string) => Promise<void>;
    generateVideoPreview: (sceneId: string, versionId: string) => Promise<void>;
    generateSceneVariations: (sceneId: string, count: number) => Promise<void>;
    generateCharacterDesign: (characterId: string) => Promise<void>;
    generateLocationDesign: (locationId: string) => Promise<void>;

    // UI actions
    setViewMode: (mode: 'gallery' | 'storyboard' | 'script' | 'production') => void;
    toggleAIAssistant: () => void;
    toggleSidebar: () => void;
    setAIConfig: (config: Partial<AIGenerationConfig>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useCinematicStore = create<CinematicState>((set, get) => ({
    currentProject: null,
    projects: [],
    currentScene: null,
    currentVersion: null,

    aiConfig: {
        style: 'cinematic',
        tone: 'dramatic',
        visualStyle: 'realistic',
        budget: 'medium',
    },

    isGeneratingStoryboard: false,
    isGeneratingVideo: false,
    isGeneratingScene: false,
    generationProgress: 0,

    viewMode: 'gallery',
    selectedCharacters: [],
    selectedLocations: [],
    showAIAssistant: true,
    sidebarCollapsed: false,

    createProject: (title: string, genre: string) => {
        const newProject: CinematicProject = {
            id: generateId(),
            title,
            genre,
            logline: '',
            synopsis: '',
            characters: [],
            locations: [],
            scenes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'draft',
        };

        set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
        }));
    },

    updateProject: (updates: Partial<CinematicProject>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            ...updates,
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    setCurrentProject: (projectId: string) => {
        const { projects } = get();
        const project = projects.find(p => p.id === projectId);
        if (project) {
            set({ currentProject: project });
        }
    },

    deleteProject: (projectId: string) => {
        set((state) => ({
            projects: state.projects.filter(p => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        }));
    },

    createScene: (title: string, description: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const sceneId = generateId();
        const versionId = generateId();

        const newVersion: SceneVersion = {
            id: versionId,
            name: 'Version 1',
            dialogue: '',
            direction: '',
            cameraShots: [],
            characters: [],
            location: '',
            mood: 'neutral',
            pacing: 'medium',
            createdAt: new Date(),
        };

        const newScene: Scene = {
            id: sceneId,
            title,
            description,
            versions: [newVersion],
            activeVersionId: versionId,
            storyboardImages: [],
            order: currentProject.scenes.length,
        };

        const updatedProject = {
            ...currentProject,
            scenes: [...currentProject.scenes, newScene],
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
            currentScene: newScene,
            currentVersion: newVersion,
        }));
    },

    updateScene: (sceneId: string, updates: Partial<Scene>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            scenes: currentProject.scenes.map(scene =>
                scene.id === sceneId ? { ...scene, ...updates } : scene
            ),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    deleteScene: (sceneId: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            scenes: currentProject.scenes.filter(scene => scene.id !== sceneId),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
            currentScene: state.currentScene?.id === sceneId ? null : state.currentScene,
        }));
    },

    reorderScenes: (sceneIds: string[]) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const reorderedScenes = sceneIds.map((id, index) => {
            const scene = currentProject.scenes.find(s => s.id === id);
            return scene ? { ...scene, order: index } : null;
        }).filter(Boolean) as Scene[];

        const updatedProject = {
            ...currentProject,
            scenes: reorderedScenes,
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    createSceneVersion: (sceneId: string, dialogue: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const scene = currentProject.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const versionId = generateId();
        const newVersion: SceneVersion = {
            id: versionId,
            name: `Version ${scene.versions.length + 1}`,
            dialogue,
            direction: '',
            cameraShots: [],
            characters: [],
            location: '',
            mood: 'neutral',
            pacing: 'medium',
            createdAt: new Date(),
        };

        const updatedScene = {
            ...scene,
            versions: [...scene.versions, newVersion],
            activeVersionId: versionId,
        };

        const updatedProject = {
            ...currentProject,
            scenes: currentProject.scenes.map(s =>
                s.id === sceneId ? updatedScene : s
            ),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
            currentVersion: newVersion,
        }));
    },

    updateSceneVersion: (versionId: string, updates: Partial<SceneVersion>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            scenes: currentProject.scenes.map(scene => ({
                ...scene,
                versions: scene.versions.map(version =>
                    version.id === versionId ? { ...version, ...updates } : version
                ),
            })),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    setActiveVersion: (sceneId: string, versionId: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const scene = currentProject.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const version = scene.versions.find(v => v.id === versionId);
        if (!version) return;

        const updatedProject = {
            ...currentProject,
            scenes: currentProject.scenes.map(s =>
                s.id === sceneId ? { ...s, activeVersionId: versionId } : s
            ),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
            currentScene: { ...scene, activeVersionId: versionId },
            currentVersion: version,
        }));
    },

    duplicateVersion: (versionId: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        let originalVersion: SceneVersion | null = null;
        let targetScene: Scene | null = null;

        for (const scene of currentProject.scenes) {
            const version = scene.versions.find(v => v.id === versionId);
            if (version) {
                originalVersion = version;
                targetScene = scene;
                break;
            }
        }

        if (!originalVersion || !targetScene) return;

        const newVersionId = generateId();
        const duplicatedVersion: SceneVersion = {
            ...originalVersion,
            id: newVersionId,
            name: `${originalVersion.name} (Copy)`,
            createdAt: new Date(),
        };

        const updatedScene = {
            ...targetScene,
            versions: [...targetScene.versions, duplicatedVersion],
            activeVersionId: newVersionId,
        };

        const updatedProject = {
            ...currentProject,
            scenes: currentProject.scenes.map(s =>
                s.id === targetScene.id ? updatedScene : s
            ),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
            currentVersion: duplicatedVersion,
        }));
    },

    addCharacter: (character: Omit<Character, 'id'>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const newCharacter: Character = {
            ...character,
            id: generateId(),
        };

        const updatedProject = {
            ...currentProject,
            characters: [...currentProject.characters, newCharacter],
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    updateCharacter: (characterId: string, updates: Partial<Character>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            characters: currentProject.characters.map(char =>
                char.id === characterId ? { ...char, ...updates } : char
            ),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    deleteCharacter: (characterId: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            characters: currentProject.characters.filter(char => char.id !== characterId),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    addLocation: (location: Omit<Location, 'id'>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const newLocation: Location = {
            ...location,
            id: generateId(),
        };

        const updatedProject = {
            ...currentProject,
            locations: [...currentProject.locations, newLocation],
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    updateLocation: (locationId: string, updates: Partial<Location>) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            locations: currentProject.locations.map(loc =>
                loc.id === locationId ? { ...loc, ...updates } : loc
            ),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    deleteLocation: (locationId: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {
            ...currentProject,
            locations: currentProject.locations.filter(loc => loc.id !== locationId),
            updatedAt: new Date(),
        };

        set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
                p.id === currentProject.id ? updatedProject : p
            ),
        }));
    },

    // AI Generation methods (mock implementations)
    generateStoryboard: async (sceneId: string, _versionId: string) => {
        set({ isGeneratingStoryboard: true, generationProgress: 0 });

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            set({ generationProgress: i });
        }

        // Mock storyboard generation
        const mockImages = [
            '/api/storyboard/1.jpg',
            '/api/storyboard/2.jpg',
            '/api/storyboard/3.jpg',
            '/api/storyboard/4.jpg',
        ];

        get().updateScene(sceneId, { storyboardImages: mockImages });
        set({ isGeneratingStoryboard: false, generationProgress: 0 });
    },

    generateVideoPreview: async (sceneId: string, _versionId: string) => {
        set({ isGeneratingVideo: true, generationProgress: 0 });

        // Simulate progress
        for (let i = 0; i <= 100; i += 5) {
            await new Promise(resolve => setTimeout(resolve, 300));
            set({ generationProgress: i });
        }

        // Mock video generation
        const mockVideoUrl = '/api/video/preview.mp4';
        get().updateScene(sceneId, { videoPreviewUrl: mockVideoUrl });
        set({ isGeneratingVideo: false, generationProgress: 0 });
    },

    generateSceneVariations: async (sceneId: string, count: number) => {
        set({ isGeneratingScene: true, generationProgress: 0 });

        for (let i = 0; i < count; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            set({ generationProgress: ((i + 1) / count) * 100 });

            // Create variation
            get().createSceneVersion(sceneId, `Generated variation ${i + 1} with different dialogue and direction.`);
        }

        set({ isGeneratingScene: false, generationProgress: 0 });
    },

    generateCharacterDesign: async (characterId: string) => {
        // Mock character design generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockImageUrl = `/api/characters/${characterId}/design.jpg`;
        get().updateCharacter(characterId, { imageUrl: mockImageUrl });
    },

    generateLocationDesign: async (locationId: string) => {
        // Mock location design generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockImageUrl = `/api/locations/${locationId}/design.jpg`;
        get().updateLocation(locationId, { imageUrl: mockImageUrl });
    },

    setViewMode: (mode) => set({ viewMode: mode }),
    toggleAIAssistant: () => set((state) => ({ showAIAssistant: !state.showAIAssistant })),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setAIConfig: (config) => set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),
}));
