import { create } from 'zustand';

export interface Story {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    wordCount: number;
    genre?: string;
}

export interface AIGenerationState {
    isGenerating: boolean;
    prompt: string;
    lastGeneration: string;
    generationHistory: string[];
}

interface StoryState {
    // Current story being edited
    currentStory: Story | null;

    // All user stories
    stories: Story[];

    // AI Generation state
    aiState: AIGenerationState;

    // UI state
    isEditorFocused: boolean;
    showAIPanel: boolean;

    // Actions
    createNewStory: (title?: string) => void;
    updateStoryContent: (content: string) => void;
    updateStoryTitle: (title: string) => void;
    saveStory: () => void;
    loadStory: (storyId: string) => void;
    deleteStory: (storyId: string) => void;

    // AI Actions
    setAIPrompt: (prompt: string) => void;
    startAIGeneration: () => void;
    stopAIGeneration: () => void;
    addGeneratedText: (text: string) => void;

    // UI Actions
    setEditorFocus: (focused: boolean) => void;
    toggleAIPanel: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStoryStore = create<StoryState>((set, get) => ({
    currentStory: null,
    stories: [],
    aiState: {
        isGenerating: false,
        prompt: '',
        lastGeneration: '',
        generationHistory: [],
    },
    isEditorFocused: false,
    showAIPanel: true,

    createNewStory: (title = 'Untitled Story') => {
        const newStory: Story = {
            id: generateId(),
            title,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 0,
            genre: undefined,
        };

        set((state) => ({
            currentStory: newStory,
            stories: [...state.stories, newStory],
        }));
    },

    updateStoryContent: (content: string) => {
        const { currentStory } = get();
        if (!currentStory) return;

        const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
        const updatedStory = {
            ...currentStory,
            content,
            wordCount,
            updatedAt: new Date(),
        };

        set((state) => ({
            currentStory: updatedStory,
            stories: state.stories.map(story =>
                story.id === currentStory.id ? updatedStory : story
            ),
        }));
    },

    updateStoryTitle: (title: string) => {
        const { currentStory } = get();
        if (!currentStory) return;

        const updatedStory = {
            ...currentStory,
            title,
            updatedAt: new Date(),
        };

        set((state) => ({
            currentStory: updatedStory,
            stories: state.stories.map(story =>
                story.id === currentStory.id ? updatedStory : story
            ),
        }));
    },

    saveStory: () => {
        // In a real app, this would save to a backend
        // For now, stories are auto-saved in memory
        console.log('Story saved to local state');
    },

    loadStory: (storyId: string) => {
        const { stories } = get();
        const story = stories.find(s => s.id === storyId);
        if (story) {
            set({ currentStory: story });
        }
    },

    deleteStory: (storyId: string) => {
        set((state) => ({
            stories: state.stories.filter(story => story.id !== storyId),
            currentStory: state.currentStory?.id === storyId ? null : state.currentStory,
        }));
    },

    setAIPrompt: (prompt: string) => {
        set((state) => ({
            aiState: { ...state.aiState, prompt },
        }));
    },

    startAIGeneration: () => {
        set((state) => ({
            aiState: { ...state.aiState, isGenerating: true },
        }));
    },

    stopAIGeneration: () => {
        set((state) => ({
            aiState: { ...state.aiState, isGenerating: false },
        }));
    },

    addGeneratedText: (text: string) => {
        set((state) => ({
            aiState: {
                ...state.aiState,
                lastGeneration: text,
                generationHistory: [...state.aiState.generationHistory, text],
                isGenerating: false,
            },
        }));
    },

    setEditorFocus: (focused: boolean) => {
        set({ isEditorFocused: focused });
    },

    toggleAIPanel: () => {
        set((state) => ({ showAIPanel: !state.showAIPanel }));
    },
}));
