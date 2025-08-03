import OpenAI from 'openai';

/**
 * AI Service Integration
 * Handles OpenAI, Claude, and other AI model integrations
 */

interface RequestLogger {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
}

export interface AIServiceConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

export interface AIRequest {
    prompt: string;
    systemPrompt?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    style?: 'narrative' | 'dialogue' | 'descriptive' | 'action' | 'character';
    tone?: 'formal' | 'casual' | 'dramatic' | 'humorous' | 'suspenseful' | 'romantic';
    genre?: string;
    context?: string;
}

export interface AIResponse {
    id: string;
    text: string;
    model: string;
    tokensUsed: number;
    finishReason: string;
    timestamp: Date;
    confidence?: number;
    suggestions?: string[];
}

// Genre-specific templates and prompts
export const GENRE_TEMPLATES = {
    fantasy: {
        systemPrompt: "You are a skilled fantasy writer. Create immersive content with magical elements, mythical creatures, and epic adventures. Use vivid descriptions and maintain internal consistency with fantasy world-building.",
        storyStarters: [
            "In a realm where magic flows through ancient ley lines...",
            "The dragon's roar echoed across the crystalline mountains...",
            "As the last mage stood before the crumbling tower...",
            "The enchanted forest whispered secrets to those brave enough to listen..."
        ],
        characterPrompts: [
            "Create a wise but mysterious wizard with a hidden past",
            "Develop a young hero discovering their magical abilities",
            "Design a cunning rogue with ties to the thieves' guild",
            "Craft a noble paladin struggling with dark temptations"
        ]
    },
    scifi: {
        systemPrompt: "You are a science fiction author. Create technologically advanced scenarios, explore scientific concepts, and imagine future societies. Balance scientific plausibility with creative storytelling.",
        storyStarters: [
            "The quantum drive hummed as the ship approached the edge of known space...",
            "In 2157, humanity's first contact changed everything...",
            "The AI achieved consciousness at exactly 03:42:17 GMT...",
            "Mars colony Alpha-7 received a transmission that shouldn't exist..."
        ],
        characterPrompts: [
            "Create a cybernetic engineer questioning their humanity",
            "Develop an alien diplomat navigating human politics",
            "Design a space pilot with genetic modifications",
            "Craft an AI researcher who discovers something unsettling"
        ]
    },
    mystery: {
        systemPrompt: "You are a mystery writer. Craft suspenseful narratives with compelling clues, red herrings, and logical plot progression. Focus on atmosphere, character motivation, and satisfying revelations.",
        storyStarters: [
            "The locked room held only a chair, a candle, and a dead man...",
            "Detective Mills had seen many crime scenes, but this one was different...",
            "The photograph arrived with no return address and a cryptic message...",
            "Everyone in Millfield had a secret, but someone's was worth killing for..."
        ],
        characterPrompts: [
            "Create a detective with an unconventional investigative method",
            "Develop a witness who knows more than they're saying",
            "Design a suspect with a perfect alibi",
            "Craft a victim whose past holds the key to their demise"
        ]
    },
    romance: {
        systemPrompt: "You are a romance writer. Create emotionally engaging stories focusing on character development, relationship dynamics, and emotional growth. Balance tension with heartfelt moments.",
        storyStarters: [
            "Their eyes met across the crowded coffee shop, and time seemed to stop...",
            "After ten years apart, fate brought them together in the most unexpected place...",
            "The wedding invitation arrived on the same day she moved back to town...",
            "He never believed in second chances until she walked back into his life..."
        ],
        characterPrompts: [
            "Create two characters with opposite life goals who fall in love",
            "Develop a character afraid of commitment who meets their perfect match",
            "Design childhood friends who reconnect as adults",
            "Craft former rivals who must work together and discover attraction"
        ]
    },
    thriller: {
        systemPrompt: "You are a thriller writer. Create high-stakes scenarios with constant tension, time pressure, and psychological intensity. Focus on pacing and escalating danger.",
        storyStarters: [
            "The phone rang at 3 AM with a voice she thought she'd never hear again...",
            "He had 24 hours to find the truth or everything he loved would disappear...",
            "The package on her doorstep contained something that changed everything...",
            "Running through the dark alley, she realized she was the hunted, not the hunter..."
        ],
        characterPrompts: [
            "Create a protagonist with a dangerous secret from their past",
            "Develop an antagonist who believes they're the hero",
            "Design a character caught between two threatening forces",
            "Craft someone who must use skills they've tried to forget"
        ]
    }
};

// Writing style templates
export const STYLE_TEMPLATES = {
    descriptive: "Focus on vivid imagery, sensory details, and atmospheric descriptions. Paint a clear picture for the reader.",
    dialogue: "Emphasize character voices, natural conversation flow, and revealing character through speech patterns.",
    action: "Use dynamic verbs, short sentences, and fast pacing. Create tension and movement.",
    introspective: "Explore character thoughts, emotions, and internal conflicts. Dive deep into psychology.",
    literary: "Use sophisticated language, metaphors, and deeper themes. Focus on artistic expression."
};

class OpenAIService {
    private client: OpenAI;
    private logger?: RequestLogger;

    constructor(apiKey: string, logger?: RequestLogger) {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.client = new OpenAI({
            apiKey: apiKey,
        });
        this.logger = logger || undefined;
    }

    private buildSystemPrompt(request: AIRequest): string {
        let systemPrompt = "You are a professional creative writing assistant. ";

        if (request.genre && GENRE_TEMPLATES[request.genre as keyof typeof GENRE_TEMPLATES]) {
            systemPrompt += GENRE_TEMPLATES[request.genre as keyof typeof GENRE_TEMPLATES].systemPrompt;
        }

        if (request.style && STYLE_TEMPLATES[request.style as keyof typeof STYLE_TEMPLATES]) {
            systemPrompt += " " + STYLE_TEMPLATES[request.style as keyof typeof STYLE_TEMPLATES];
        }

        if (request.tone) {
            systemPrompt += ` Write in a ${request.tone} tone.`;
        }

        if (request.systemPrompt) {
            systemPrompt = request.systemPrompt;
        }

        return systemPrompt;
    }

    async generateStory(request: AIRequest): Promise<AIResponse> {
        try {
            const systemPrompt = this.buildSystemPrompt(request);

            this.logger?.info('OpenAI story generation request', {
                model: request.model || 'gpt-4',
                promptLength: request.prompt.length,
                style: request.style,
                genre: request.genre,
                tone: request.tone
            });

            const completion = await this.client.chat.completions.create({
                model: request.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: request.prompt }
                ],
                max_tokens: request.maxTokens || 500,
                temperature: request.temperature || 0.7,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1,
            });

            const response: AIResponse = {
                id: completion.id,
                text: completion.choices[0]?.message?.content || '',
                model: completion.model,
                tokensUsed: completion.usage?.total_tokens || 0,
                finishReason: completion.choices[0]?.finish_reason || 'unknown',
                timestamp: new Date(),
                confidence: 0.85, // Estimated confidence score
            };

            this.logger?.info('OpenAI story generation completed', {
                responseLength: response.text.length,
                tokensUsed: response.tokensUsed,
                finishReason: response.finishReason
            });

            return response;
        } catch (error) {
            this.logger?.error('OpenAI story generation failed', error);
            throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async continueStory(context: string, request: AIRequest): Promise<AIResponse> {
        const continuePrompt = `Continue this story naturally and seamlessly. Here's the existing content:\n\n${context}\n\nContinue the story: ${request.prompt}`;

        return this.generateStory({
            ...request,
            prompt: continuePrompt,
            systemPrompt: request.systemPrompt || "You are a skilled storyteller. Continue the narrative seamlessly, maintaining consistency with the established tone, style, and characters. Build on existing plot elements and character development."
        });
    }

    async createCharacter(request: AIRequest): Promise<AIResponse> {
        const characterPrompt = `Create a detailed character based on this description: ${request.prompt}
        
Include:
- Physical appearance and distinctive features
- Personality traits and quirks
- Background and history
- Motivations and goals
- Relationships and connections
- Unique voice and speech patterns
- Skills and abilities
- Flaws and vulnerabilities`;

        return this.generateStory({
            ...request,
            prompt: characterPrompt,
            systemPrompt: "You are a character development expert. Create rich, three-dimensional characters with depth, complexity, and realistic motivations. Focus on making characters feel authentic and memorable."
        });
    }

    async enhanceDialogue(dialogue: string, request: AIRequest): Promise<AIResponse> {
        const dialoguePrompt = `Improve this dialogue to make it more natural, engaging, and character-driven:

Original dialogue:
${dialogue}

Instructions: ${request.prompt}

Please enhance the dialogue while maintaining the core meaning and character voices.`;

        return this.generateStory({
            ...request,
            prompt: dialoguePrompt,
            style: 'dialogue',
            systemPrompt: "You are a dialogue expert. Improve conversations to sound natural, reveal character, advance plot, and create subtext. Each character should have a distinct voice."
        });
    }

    async generateStoryStarter(genre?: string): Promise<string[]> {
        if (genre && GENRE_TEMPLATES[genre as keyof typeof GENRE_TEMPLATES]) {
            return GENRE_TEMPLATES[genre as keyof typeof GENRE_TEMPLATES].storyStarters;
        }

        // Generic story starters
        return [
            "It was the kind of day that changes everything...",
            "The letter arrived exactly one year too late...",
            "She never believed in destiny until she met him...",
            "The old photograph revealed a truth no one was prepared for...",
            "In a world where memories could be stolen, she was the only one who remembered..."
        ];
    }

    async getCharacterPrompts(genre?: string): Promise<string[]> {
        if (genre && GENRE_TEMPLATES[genre as keyof typeof GENRE_TEMPLATES]) {
            return GENRE_TEMPLATES[genre as keyof typeof GENRE_TEMPLATES].characterPrompts;
        }

        // Generic character prompts
        return [
            "Create a character who must choose between duty and desire",
            "Develop someone with a hidden talent they're afraid to use",
            "Design a character who lies to protect others",
            "Craft someone who must overcome their greatest fear"
        ];
    }
}

// Mock service for development/testing when API keys aren't available
class MockAIService {
    private logger?: RequestLogger;

    constructor(logger?: RequestLogger) {
        this.logger = logger || undefined;
    }

    async generateStory(request: AIRequest): Promise<AIResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const mockResponses = {
            fantasy: "The ancient crystal pulsed with ethereal light as Lyra approached the enchanted grove. Whispers of forgotten magic danced through the silver leaves, and she could feel the power of the old gods stirring in response to her presence.",
            scifi: "Commander Chen's neural implant flickered as the ship's AI detected an anomaly in the quantum field. The readings were impossible—matter was reorganizing itself at the molecular level, defying every law of physics they understood.",
            mystery: "Detective Morrison studied the crime scene with growing unease. The locked study showed no signs of forced entry, yet the victim lay dead in the center of the room. The only clue was a single white rose, still damp with morning dew.",
            romance: "Emma's heart skipped as she recognized the handwriting on the envelope. After five years of silence, Michael had finally written. Her hands trembled as she broke the wax seal, wondering if some chances truly deserved a second chance.",
            thriller: "The countdown timer on the device showed 47 minutes. Sarah's trained hands moved swiftly over the wires, each decision bringing her closer to either salvation or catastrophe. In the distance, she could hear footsteps approaching."
        };

        const defaultResponse = "The story unfolded like a tapestry of words, each sentence weaving into the next with careful precision. Characters emerged from the narrative mist, their voices clear and their purposes true, ready to embark on whatever journey the imagination would provide.";

        let response = defaultResponse;
        if (request.genre && mockResponses[request.genre as keyof typeof mockResponses]) {
            response = mockResponses[request.genre as keyof typeof mockResponses];
        }

        return {
            id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: response,
            model: request.model || 'mock-gpt-4',
            tokensUsed: Math.floor(Math.random() * 200) + 100,
            finishReason: 'stop',
            timestamp: new Date(),
            confidence: 0.8,
        };
    }

    async continueStory(context: string, request: AIRequest): Promise<AIResponse> {
        const continueResponses = [
            "The next chapter revealed secrets that had been hidden for generations, each revelation more startling than the last.",
            "As the plot thickened, new alliances formed while old friendships were tested in ways no one could have predicted.",
            "The stakes rose higher as our protagonist faced their greatest challenge yet, armed only with wit and determination.",
            "Time was running out, and every decision now carried the weight of countless lives hanging in the balance."
        ];

        return {
            id: `mock_continue_${Date.now()}`,
            text: continueResponses[Math.floor(Math.random() * continueResponses.length)] || "The story continued with unexpected developments...",
            model: request.model || 'mock-gpt-4',
            tokensUsed: Math.floor(Math.random() * 150) + 75,
            finishReason: 'stop',
            timestamp: new Date(),
            confidence: 0.8,
        };
    }

    async createCharacter(request: AIRequest): Promise<AIResponse> {
        const characterTemplates = [
            "**Elena Vasquez** - A 32-year-old marine biologist with sun-weathered hands and eyes the color of deep ocean currents. She speaks with quiet authority, choosing her words carefully. Driven by a childhood promise to her grandfather, she's dedicated her life to protecting marine ecosystems, but struggles with trusting others after being betrayed by a former research partner.",
            "**Marcus Chen** - A soft-spoken librarian in his mid-40s who conceals a photographic memory behind wire-rimmed glasses. He has a habit of quoting obscure literature and tends to organize everything in alphabetical order. Once a child prodigy, he now finds peace in the quiet corners of knowledge, though he's haunted by the genius he fears he's wasted.",
            "**Zara Al-Rashid** - A brilliant 28-year-old cybersecurity expert with a quick wit and faster fingers on a keyboard. She has a collection of vintage band t-shirts and never drinks coffee after 2 PM. Born in three different countries, she speaks five languages fluently and has a fierce protective instinct for digital privacy rights."
        ];

        return {
            id: `mock_character_${Date.now()}`,
            text: characterTemplates[Math.floor(Math.random() * characterTemplates.length)] || "A mysterious character with hidden depths and intriguing secrets.",
            model: request.model || 'mock-gpt-4',
            tokensUsed: Math.floor(Math.random() * 200) + 150,
            finishReason: 'stop',
            timestamp: new Date(),
            confidence: 0.85,
        };
    }

    async enhanceDialogue(dialogue: string, request: AIRequest): Promise<AIResponse> {
        return {
            id: `mock_dialogue_${Date.now()}`,
            text: `Here's your enhanced dialogue:\n\n"Listen," she said, her voice barely above a whisper, "there are things about this place you don't understand. Things that would make you reconsider everything you think you know about what happened here."\n\nHe studied her face in the dim light, noting the way her hands trembled despite her steady voice. "Try me," he replied, though something in her expression made him wonder if he really wanted to know the truth.`,
            model: request.model || 'mock-gpt-4',
            tokensUsed: Math.floor(Math.random() * 180) + 120,
            finishReason: 'stop',
            timestamp: new Date(),
            confidence: 0.8,
        };
    }

    async generateStoryStarter(genre?: string): Promise<string[]> {
        const openAI = new OpenAIService('', this.logger);
        return openAI.generateStoryStarter(genre);
    }

    async getCharacterPrompts(genre?: string): Promise<string[]> {
        const openAI = new OpenAIService('', this.logger);
        return openAI.getCharacterPrompts(genre);
    }
}

// AI Service Factory
export class AIServiceFactory {
    static createService(logger?: RequestLogger): OpenAIService | MockAIService {
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (openaiApiKey && openaiApiKey !== 'your-openai-api-key-here') {
            return new OpenAIService(openaiApiKey, logger);
        } else {
            logger?.warn('OpenAI API key not found, using mock service');
            return new MockAIService(logger);
        }
    }
}

export { OpenAIService, MockAIService };
