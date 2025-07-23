import { useState } from 'react';
import { useStoryStore } from '../store/storyStore';
import { Sparkles, Send, Loader2, Copy, Plus, AlertCircle } from 'lucide-react';
import './AIPanel.css';

export const AIPanel = () => {
    const {
        aiState,
        currentStory,
        setAIPrompt,
        startAIGeneration,
        stopAIGeneration,
        addGeneratedText,
        updateStoryContent,
    } = useStoryStore();

    const [localPrompt, setLocalPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Simulate AI text generation (in a real app, this would call an API)
    const generateAIText = async (prompt: string) => {
        if (!prompt.trim()) {
            setError('Please enter a prompt for AI generation.');
            return;
        }

        setError(null);
        startAIGeneration();

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock AI response based on prompt
            const mockResponses = {
                'continue': 'The mysterious figure stepped out of the shadows, their footsteps echoing through the empty corridor. A strange blue light emanated from beneath their cloak, casting dancing shadows on the ancient stone walls.',
                'describe': 'The old mansion stood against the stormy sky like a monument to forgotten times. Its Gothic towers pierced the clouds, while ivy crept up weathered walls that had witnessed centuries of secrets.',
                'dialogue': '"I never thought I\'d see you again," she whispered, her voice barely audible above the rain. "But here you are, just when I need you most." He turned slowly, his eyes reflecting a mixture of pain and hope.',
                'action': 'Without warning, the ground beneath them began to tremble. Books tumbled from shelves, and the chandelier swayed dangerously overhead. They had only seconds to reach safety before the ancient library would collapse around them.',
            };

            // Simple keyword matching for demo
            let response = 'The story continued in unexpected ways, weaving new threads into the narrative tapestry that would soon reveal its greater purpose.';

            for (const [keyword, text] of Object.entries(mockResponses)) {
                if (prompt.toLowerCase().includes(keyword)) {
                    response = text;
                    break;
                }
            }

            addGeneratedText(response);
        } catch (error) {
            console.error('AI generation failed:', error);
            setError('AI generation failed. Please try again.');
            stopAIGeneration();
        }
    };

    const handleGenerate = () => {
        if (!localPrompt.trim()) return;
        setAIPrompt(localPrompt);
        generateAIText(localPrompt);
    };

    const handleInsertText = (text: string) => {
        if (!currentStory) return;

        const newContent = currentStory.content + (currentStory.content ? '\n\n' : '') + text;
        updateStoryContent(newContent);
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    const quickPrompts = [
        { label: 'Continue the story', prompt: 'continue the story from where it left off' },
        { label: 'Add dialogue', prompt: 'add dialogue between characters' },
        { label: 'Describe setting', prompt: 'describe the setting in detail' },
        { label: 'Add action scene', prompt: 'add an exciting action scene' },
        { label: 'Character development', prompt: 'develop the characters further' },
        { label: 'Plot twist', prompt: 'add an unexpected plot twist' },
    ];

    return (
        <div className="ai-panel">
            <div className="ai-panel-header">
                <div className="ai-panel-title">
                    <Sparkles className="title-icon" size={20} aria-hidden="true" />
                    <h3>AI Writing Assistant</h3>
                </div>
            </div>

            <div className="ai-panel-content">
                {/* Error Display */}
                {error && (
                    <div className="error-message" role="alert" aria-live="polite">
                        <AlertCircle size={16} aria-hidden="true" />
                        <span>{error}</span>
                        <button
                            className="error-dismiss"
                            onClick={() => setError(null)}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Quick Prompts */}
                <div className="quick-prompts">
                    <h4>Quick Prompts</h4>
                    <div className="prompt-buttons" role="group" aria-label="Quick prompt options">
                        {quickPrompts.map((item, index) => (
                            <button
                                key={index}
                                className="prompt-button"
                                onClick={() => setLocalPrompt(item.prompt)}
                                disabled={aiState.isGenerating}
                                aria-label={`Use prompt: ${item.label}`}
                                type="button"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Prompt Input */}
                <div className="prompt-input-section">
                    <h4>Custom Prompt</h4>
                    <div className="prompt-input-container">
                        <label htmlFor="ai-prompt-textarea" className="sr-only">
                            Enter your custom AI prompt
                        </label>
                        <textarea
                            id="ai-prompt-textarea"
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            placeholder="Tell the AI what you want to write... (e.g., 'continue the story', 'add a dramatic scene', 'develop the main character')"
                            className="prompt-textarea"
                            disabled={aiState.isGenerating}
                            rows={3}
                            aria-describedby={error ? "ai-error-message" : undefined}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={aiState.isGenerating || !localPrompt.trim()}
                            className="generate-button"
                            aria-label={aiState.isGenerating ? "Generating content..." : "Generate AI content"}
                            type="button"
                        >
                            {aiState.isGenerating ? (
                                <>
                                    <Loader2 className="loading-icon" size={16} aria-hidden="true" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} aria-hidden="true" />
                                    <span>Generate</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Generated Content */}
                {(aiState.lastGeneration || aiState.isGenerating) && (
                    <div className="generated-content">
                        <h4>Generated Content</h4>
                        {aiState.isGenerating ? (
                            <div className="generating-placeholder">
                                <Loader2 className="loading-icon" size={20} />
                                <span>AI is crafting your story...</span>
                            </div>
                        ) : (
                            <div className="generated-text-container">
                                <div className="generated-text">
                                    {aiState.lastGeneration}
                                </div>
                                <div className="generated-actions">
                                    <button
                                        onClick={() => handleInsertText(aiState.lastGeneration)}
                                        className="action-button insert-button"
                                        title="Insert into story"
                                    >
                                        <Plus size={16} />
                                        Insert
                                    </button>
                                    <button
                                        onClick={() => handleCopyText(aiState.lastGeneration)}
                                        className="action-button copy-button"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={16} />
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Generation History */}
                {aiState.generationHistory.length > 0 && (
                    <div className="generation-history">
                        <h4>Recent Generations</h4>
                        <div className="history-list">
                            {aiState.generationHistory.slice(-3).reverse().map((text, index) => (
                                <div key={index} className="history-item">
                                    <div className="history-text">
                                        {text.slice(0, 100)}{text.length > 100 ? '...' : ''}
                                    </div>
                                    <div className="history-actions">
                                        <button
                                            onClick={() => handleInsertText(text)}
                                            className="action-button"
                                            title="Insert into story"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleCopyText(text)}
                                            className="action-button"
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
