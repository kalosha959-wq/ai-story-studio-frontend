import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Project Management Routes
 * 
 * Handles story project CRUD operations,
 * collaboration, and version control
 */

const router = Router();

// Temporary in-memory project store (replace with database)
interface Project {
    id: string;
    title: string;
    description: string;
    content: string;
    genre: string;
    status: 'draft' | 'in-progress' | 'completed' | 'published';
    userId: string;
    collaborators: string[];
    tags: string[];
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    isPublic: boolean;
    settings: {
        aiModel: string;
        tone: string;
        style: string;
        targetLength: number;
    };
}

const projects: Map<string, Project> = new Map();

// Initialize with sample projects
const sampleProjects: Project[] = [
    {
        id: 'proj_001',
        title: 'The Digital Frontier',
        description: 'A sci-fi adventure in a virtual world',
        content: 'In the year 2087, humanity had discovered something unprecedented...',
        genre: 'science-fiction',
        status: 'in-progress',
        userId: 'user_001',
        collaborators: [],
        tags: ['sci-fi', 'virtual-reality', 'adventure'],
        wordCount: 1250,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        version: 3,
        isPublic: false,
        settings: {
            aiModel: 'gpt-4',
            tone: 'mysterious',
            style: 'descriptive',
            targetLength: 5000,
        },
    },
    {
        id: 'proj_002',
        title: 'Moonlight Sonata',
        description: 'A romantic tale set in 19th century Vienna',
        content: 'The piano keys danced under her fingers as the moonlight streamed through...',
        genre: 'romance',
        status: 'draft',
        userId: 'user_002',
        collaborators: ['user_001'],
        tags: ['romance', 'historical', 'music'],
        wordCount: 890,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-19'),
        version: 1,
        isPublic: true,
        settings: {
            aiModel: 'claude-3',
            tone: 'romantic',
            style: 'lyrical',
            targetLength: 3000,
        },
    },
];

// Initialize sample data
sampleProjects.forEach(project => {
    projects.set(project.id, project);
});

/**
 * GET /api/v1/projects
 * Get all projects for the authenticated user
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, status, genre, search } = req.query;

    let filteredProjects = Array.from(projects.values());

    // Filter by status
    if (status && typeof status === 'string') {
        filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    // Filter by genre
    if (genre && typeof genre === 'string') {
        filteredProjects = filteredProjects.filter(p => p.genre === genre);
    }

    // Search in title and description
    if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredProjects = filteredProjects.filter(p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
    }

    // Sort by updatedAt (newest first)
    filteredProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    const totalProjects = filteredProjects.length;
    const totalPages = Math.ceil(totalProjects / limitNum);

    req.requestLogger?.info('Projects retrieved', {
        total: totalProjects,
        page: pageNum,
        limit: limitNum,
        hasFilters: !!(status || genre || search),
    });

    res.json({
        success: true,
        message: 'Projects retrieved successfully',
        data: {
            projects: paginatedProjects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalProjects,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Project ID is required');
    }

    const project = projects.get(id);
    if (!project) {
        throw new ValidationError('Project not found');
    }

    req.requestLogger?.info('Project retrieved', {
        projectId: project.id,
        title: project.title,
        wordCount: project.wordCount,
    });

    res.json({
        success: true,
        message: 'Project retrieved successfully',
        data: { project },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/projects
 * Create a new project
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const {
        title,
        description,
        genre,
        tags = [],
        isPublic = false,
        settings,
    } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
        throw new ValidationError('Project title is required');
    }

    if (!description || description.trim().length === 0) {
        throw new ValidationError('Project description is required');
    }

    if (!genre) {
        throw new ValidationError('Project genre is required');
    }

    // Create new project
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProject: Project = {
        id: projectId,
        title: title.trim(),
        description: description.trim(),
        content: '',
        genre,
        status: 'draft',
        userId: 'demo-user', // Would come from authenticated user
        collaborators: [],
        tags: Array.isArray(tags) ? tags : [],
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isPublic,
        settings: {
            aiModel: settings?.aiModel || 'gpt-4',
            tone: settings?.tone || 'neutral',
            style: settings?.style || 'balanced',
            targetLength: settings?.targetLength || 2000,
        },
    };

    projects.set(projectId, newProject);

    req.requestLogger?.info('Project created', {
        projectId: newProject.id,
        title: newProject.title,
        genre: newProject.genre,
        userId: newProject.userId,
    });

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project: newProject },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * PUT /api/v1/projects/:id
 * Update an existing project
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        title,
        description,
        content,
        genre,
        status,
        tags,
        isPublic,
        settings,
    } = req.body;

    if (!id) {
        throw new ValidationError('Project ID is required');
    }

    const project = projects.get(id);
    if (!project) {
        throw new ValidationError('Project not found');
    }

    // Update project fields
    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (content !== undefined) {
        project.content = content;
        project.wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
    }
    if (genre !== undefined) project.genre = genre;
    if (status !== undefined) project.status = status;
    if (tags !== undefined) project.tags = Array.isArray(tags) ? tags : [];
    if (isPublic !== undefined) project.isPublic = isPublic;
    if (settings !== undefined) {
        project.settings = { ...project.settings, ...settings };
    }

    project.updatedAt = new Date();
    project.version += 1;

    projects.set(id, project);

    req.requestLogger?.info('Project updated', {
        projectId: project.id,
        title: project.title,
        version: project.version,
        wordCount: project.wordCount,
    });

    res.json({
        success: true,
        message: 'Project updated successfully',
        data: { project },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Project ID is required');
    }

    const project = projects.get(id);
    if (!project) {
        throw new ValidationError('Project not found');
    }

    projects.delete(id);

    req.requestLogger?.info('Project deleted', {
        projectId: project.id,
        title: project.title,
        userId: project.userId,
    });

    res.json({
        success: true,
        message: 'Project deleted successfully',
        data: { deletedProject: { id: project.id, title: project.title } },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/projects/:id/collaborate
 * Add collaborator to project
 */
router.post('/:id/collaborate', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email } = req.body;

    if (!id) {
        throw new ValidationError('Project ID is required');
    }

    if (!email) {
        throw new ValidationError('Collaborator email is required');
    }

    const project = projects.get(id);
    if (!project) {
        throw new ValidationError('Project not found');
    }

    // Check if already a collaborator
    if (project.collaborators.includes(email)) {
        throw new ValidationError('User is already a collaborator');
    }

    project.collaborators.push(email);
    project.updatedAt = new Date();
    projects.set(id, project);

    req.requestLogger?.info('Collaborator added to project', {
        projectId: project.id,
        collaboratorEmail: email,
        totalCollaborators: project.collaborators.length,
    });

    res.json({
        success: true,
        message: 'Collaborator added successfully',
        data: {
            project: {
                id: project.id,
                title: project.title,
                collaborators: project.collaborators,
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/projects/:id/versions
 * Get project version history
 */
router.get('/:id/versions', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Project ID is required');
    }

    const project = projects.get(id);
    if (!project) {
        throw new ValidationError('Project not found');
    }

    // Mock version history (would come from database)
    const versions = [
        {
            version: project.version,
            content: project.content,
            updatedAt: project.updatedAt,
            updatedBy: project.userId,
            changes: 'Latest version',
        },
        {
            version: project.version - 1,
            content: project.content.substring(0, Math.floor(project.content.length * 0.8)),
            updatedAt: new Date(project.updatedAt.getTime() - 24 * 60 * 60 * 1000),
            updatedBy: project.userId,
            changes: 'Added character development',
        },
    ].filter(v => v.version > 0);

    res.json({
        success: true,
        message: 'Project versions retrieved',
        data: { versions },
        timestamp: new Date().toISOString(),
    });
}));

export default router;
