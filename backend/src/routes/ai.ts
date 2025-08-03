import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { AIServiceFactory, AIRequest, GENRE_TEMPLATES } from '../services/aiService.js';

/**
 * AI Services Routes
 * 
 * Handles AI-powered story generation, text completion,
 * character development, and creative assistance
 */

const router = Router();

/**
 * POST /api/ai/generate
 * Generate story content using AI
 */
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
    const {
        prompt,
        model = 'gpt-4',
        maxTokens = 500,
        temperature = 0.7,
        style = 'narrative',
        tone = 'formal',
        genre,
        context,
    } = req.body as AIRequest;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
        throw new ValidationError('Prompt is required');
    }

    if (prompt.length > 2000) {
        throw new ValidationError('Prompt is too long (max 2000 characters)');
    }

    const validModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2'];
    if (model && !validModels.includes(model)) {
        throw new ValidationError(`Invalid model. Supported models: ${validModels.join(', ')}`);
    }

    req.requestLogger?.info('AI generation requested', {
        model,
        promptLength: prompt.length,
        maxTokens,
        temperature,
        style,
        tone,
        genre,
    });

    // Create AI service and generate response
    const aiService = AIServiceFactory.createService(req.requestLogger);
    const aiResponse = await aiService.generateStory({
        prompt,
        model,
        maxTokens,
        temperature,
        style,
        tone,
        genre: genre || 'general',
        context: context || '',
    });

    res.json({
        success: true,
        message: 'AI content generated successfully',
        data: {
            response: aiResponse,
            usage: {
                promptTokens: Math.floor(prompt.length / 4),
                completionTokens: aiResponse.tokensUsed,
                totalTokens: aiResponse.tokensUsed + Math.floor(prompt.length / 4),
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/ai/continue
 * Continue an existing story
 */
router.post('/continue', asyncHandler(async (req: Request, res: Response) => {
    const {
        text,
        model = 'gpt-4',
        maxTokens = 300,
        temperature = 0.7,
        style = 'narrative',
        tone = 'formal',
    } = req.body;

    if (!text || text.trim().length === 0) {
        throw new ValidationError('Text to continue is required');
    }

    if (text.length > 1500) {
        throw new ValidationError('Text is too long for continuation (max 1500 characters)');
    }

    req.requestLogger?.info('AI story continuation requested', {
        model,
        textLength: text.length,
        maxTokens,
        temperature,
        style,
        tone,
    });

    const aiService = AIServiceFactory.createService(req.requestLogger);
    const aiResponse = await aiService.continueStory({
        prompt: text,
        model,
        maxTokens,
        temperature,
        style,
        tone,
        genre: 'general',
        context: '',
    });

    res.json({
        success: true,
        message: 'Story continuation generated successfully',
        data: {
            response: aiResponse,
            usage: {
                promptTokens: Math.floor(text.length / 4),
                completionTokens: aiResponse.tokensUsed,
                totalTokens: aiResponse.tokensUsed + Math.floor(text.length / 4),
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/ai/character
 * Generate character profiles using AI
 */
router.post('/character', asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        age,
        occupation,
        personality,
        background,
        genre = 'general',
        detail = 'medium',
    } = req.body;

    if (!name || name.trim().length === 0) {
        throw new ValidationError('Character name is required');
    }

    req.requestLogger?.info('AI character generation requested', {
        name,
        age,
        occupation,
        genre,
        detail,
    });

    const aiService = AIServiceFactory.createService(req.requestLogger);
    
    // Build character description prompt
    const characterPrompt = `Character Name: ${name.trim()}
${age ? `Age: ${age}` : ''}
${occupation ? `Occupation: ${occupation}` : ''}
${personality ? `Personality: ${personality}` : ''}
${background ? `Background: ${background}` : ''}
Genre: ${genre}
Detail Level: ${detail}`;

    const character = await aiService.createCharacter({
        prompt: characterPrompt,
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.8,
        style: 'character',
        tone: 'formal',
        genre,
        context: '',
    });

    res.json({
        success: true,
        message: 'Character profile generated successfully',
        data: { character },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/ai/plot
 * Generate plot suggestions using AI
 */
router.post('/plot', asyncHandler(async (req: Request, res: Response) => {
    const {
        genre,
        theme,
        characters = [],
        setting,
        tone = 'balanced',
        complexity = 'medium',
    } = req.body;

    if (!genre) {
        throw new ValidationError('Genre is required for plot generation');
    }

    req.requestLogger?.info('AI plot generation requested', {
        genre,
        theme,
        characterCount: characters.length,
        setting,
        tone,
        complexity,
    });

    // Simulate plot generation
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const plotElements = {
        incitingIncident: 'A mysterious letter arrives with an urgent summons',
        risingAction: [
            'Discovery of a hidden family secret',
            'Encounter with supernatural forces',
            'Betrayal by a trusted ally',
            'Race against time to prevent disaster',
        ],
        climax: 'Final confrontation in the ancient temple',
        fallingAction: 'Revelation of true motivations and consequences',
        resolution: 'New understanding brings unexpected peace',
    };

    const plot = {
        id: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        genre,
        theme: theme || 'The power of truth',
        structure: {
            act1: {
                title: 'The Call to Adventure',
                description: 'Protagonist\'s ordinary world is disrupted by mysterious events',
                keyEvents: ['Introduction of main character', 'Inciting incident occurs', 'Decision to pursue the mystery'],
                estimatedWordCount: 1500,
            },
            act2: {
                title: 'The Journey Deepens',
                description: 'Obstacles and revelations drive the story forward',
                keyEvents: plotElements.risingAction,
                estimatedWordCount: 3000,
            },
            act3: {
                title: 'Resolution and Transformation',
                description: 'Climax and resolution bring character growth',
                keyEvents: [plotElements.climax, plotElements.fallingAction, plotElements.resolution],
                estimatedWordCount: 1500,
            },
        },
        plotTwists: [
            'The antagonist is revealed to be a close friend',
            'The magical artifact has a hidden curse',
            'The protagonist discovers they are descended from an ancient bloodline',
        ],
        themes: [theme || 'Truth vs. illusion', 'Friendship and loyalty', 'Personal growth'],
        conflicts: ['Internal: Self-doubt vs. confidence', 'External: Hero vs. ancient evil'],
        estimatedLength: 6000,
        createdAt: new Date(),
    };

    req.requestLogger?.info('AI plot generation completed', {
        plotId: plot.id,
        genre: plot.genre,
        estimatedLength: plot.estimatedLength,
    });

    res.json({
        success: true,
        message: 'Plot structure generated successfully',
        data: { plot },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/ai/improve
 * Improve existing text using AI
 */
router.post('/improve', asyncHandler(async (req: Request, res: Response) => {
    const {
        text,
        improvementType = 'general',
        targetStyle,
        preserveLength = false,
    } = req.body;

    if (!text || text.trim().length === 0) {
        throw new ValidationError('Text to improve is required');
    }

    if (text.length > 3000) {
        throw new ValidationError('Text is too long for improvement (max 3000 characters)');
    }

    const validTypes = ['grammar', 'style', 'clarity', 'engagement', 'general'];
    if (!validTypes.includes(improvementType)) {
        throw new ValidationError(`Invalid improvement type. Supported types: ${validTypes.join(', ')}`);
    }

    req.requestLogger?.info('AI text improvement requested', {
        originalLength: text.length,
        improvementType,
        targetStyle,
        preserveLength,
    });

    // Simulate improvement processing
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));

    // Mock improvement (in real implementation, this would call AI service)
    const improvedText = text
        .replace(/\b(very|really|quite)\s+/g, '') // Remove filler words
        .replace(/\. ([a-z])/g, (_match: string, p1: string) => '. ' + p1.toUpperCase()) // Fix capitalization
        .replace(/\s+/g, ' ') // Clean up spacing
        .trim();

    const improvements = {
        id: `improve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalText: text,
        improvedText,
        improvementType,
        changes: [
            { type: 'grammar', description: 'Fixed capitalization after periods' },
            { type: 'style', description: 'Removed unnecessary filler words' },
            { type: 'clarity', description: 'Improved sentence structure' },
        ],
        score: {
            original: 7.2,
            improved: 8.6,
            improvement: 1.4,
        },
        metrics: {
            readabilityBefore: 'Grade 8',
            readabilityAfter: 'Grade 7',
            sentimentScore: 0.3,
            engagementScore: 8.1,
        },
    };

    req.requestLogger?.info('AI text improvement completed', {
        improvementId: improvements.id,
        improvementScore: improvements.score.improvement,
        changesCount: improvements.changes.length,
    });

    res.json({
        success: true,
        message: 'Text improvement completed successfully',
        data: { improvements },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/ai/models
 * Get available AI models and their capabilities
 */
router.get('/models', asyncHandler(async (req: Request, res: Response) => {
    const models = [
        {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'OpenAI',
            capabilities: ['text-generation', 'completion', 'creative-writing'],
            maxTokens: 8192,
            costPer1kTokens: 0.03,
            languages: ['English', 'Spanish', 'French', 'German', 'Italian'],
            strengths: ['Creative writing', 'Complex reasoning', 'Code generation'],
            limitations: ['High cost', 'Slower response times'],
            recommended: true,
        },
        {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'OpenAI',
            capabilities: ['text-generation', 'completion', 'creative-writing'],
            maxTokens: 4096,
            costPer1kTokens: 0.002,
            languages: ['English', 'Spanish', 'French', 'German'],
            strengths: ['Fast responses', 'Cost-effective', 'Good general performance'],
            limitations: ['Less creative than GPT-4', 'Limited context window'],
            recommended: false,
        },
        {
            id: 'claude-3',
            name: 'Claude 3 Opus',
            provider: 'Anthropic',
            capabilities: ['text-generation', 'completion', 'creative-writing', 'analysis'],
            maxTokens: 200000,
            costPer1kTokens: 0.015,
            languages: ['English', 'Spanish', 'French'],
            strengths: ['Large context window', 'Excellent reasoning', 'Safe outputs'],
            limitations: ['Higher cost', 'Limited availability'],
            recommended: true,
        },
        {
            id: 'claude-2',
            name: 'Claude 2',
            provider: 'Anthropic',
            capabilities: ['text-generation', 'completion', 'creative-writing'],
            maxTokens: 100000,
            costPer1kTokens: 0.008,
            languages: ['English', 'Spanish', 'French'],
            strengths: ['Large context window', 'Good creative writing', 'Safety focused'],
            limitations: ['Slower than GPT models', 'Limited fine-tuning'],
            recommended: false,
        },
    ];

    req.requestLogger?.info('AI models list requested', {
        modelsCount: models.length,
    });

    res.json({
        success: true,
        message: 'AI models retrieved successfully',
        data: { models },
        timestamp: new Date().toISOString(),
    });
}));

export default router;
