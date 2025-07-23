import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Media Management Routes
 * 
 * Handles file uploads, media library management,
 * and asset processing for story content
 */

const router = Router();

// Media Types
interface MediaFile {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    url: string;
    userId: string;
    projectId?: string;
    tags: string[];
    description?: string;
    metadata: {
        width?: number;
        height?: number;
        duration?: number;
        format?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Temporary in-memory media store (replace with database)
const mediaFiles: Map<string, MediaFile> = new Map();

// Initialize with sample media files
const sampleMedia: MediaFile[] = [
    {
        id: 'media_001',
        filename: 'castle_sunset.jpg',
        originalName: 'Medieval Castle at Sunset.jpg',
        mimeType: 'image/jpeg',
        size: 2458432,
        path: '/uploads/images/castle_sunset.jpg',
        url: 'https://ai-story-studio.com/media/castle_sunset.jpg',
        userId: 'user_001',
        projectId: 'proj_001',
        tags: ['castle', 'sunset', 'medieval', 'landscape'],
        description: 'A majestic medieval castle silhouetted against a dramatic sunset',
        metadata: {
            width: 1920,
            height: 1080,
            format: 'JPEG',
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        id: 'media_002',
        filename: 'piano_melody.mp3',
        originalName: 'Moonlight Piano Melody.mp3',
        mimeType: 'audio/mpeg',
        size: 5242880,
        path: '/uploads/audio/piano_melody.mp3',
        url: 'https://ai-story-studio.com/media/piano_melody.mp3',
        userId: 'user_002',
        projectId: 'proj_002',
        tags: ['piano', 'classical', 'moonlight', 'romantic'],
        description: 'A gentle piano melody perfect for romantic scenes',
        metadata: {
            duration: 180,
            format: 'MP3',
        },
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
    },
];

// Initialize sample data
sampleMedia.forEach(media => {
    mediaFiles.set(media.id, media);
});

/**
 * GET /api/v1/media
 * Get all media files for the authenticated user
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 20,
        type,
        projectId,
        tags,
        search,
    } = req.query;

    let filteredMedia = Array.from(mediaFiles.values());

    // Filter by media type
    if (type && typeof type === 'string') {
        const typeMap: Record<string, string[]> = {
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg'],
            'video': ['video/mp4', 'video/webm', 'video/avi'],
            'document': ['application/pdf', 'text/plain', 'application/msword'],
        };

        const mimeTypes = typeMap[type];
        if (mimeTypes) {
            filteredMedia = filteredMedia.filter(m => mimeTypes.includes(m.mimeType));
        }
    }

    // Filter by project
    if (projectId && typeof projectId === 'string') {
        filteredMedia = filteredMedia.filter(m => m.projectId === projectId);
    }

    // Filter by tags
    if (tags && typeof tags === 'string') {
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
        filteredMedia = filteredMedia.filter(m =>
            tagList.some(tag => m.tags.some(mediaTag => mediaTag.toLowerCase().includes(tag)))
        );
    }

    // Search in filename and description
    if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredMedia = filteredMedia.filter(m =>
            m.originalName.toLowerCase().includes(searchLower) ||
            (m.description && m.description.toLowerCase().includes(searchLower)) ||
            m.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
    }

    // Sort by creation date (newest first)
    filteredMedia.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedMedia = filteredMedia.slice(startIndex, endIndex);

    const totalMedia = filteredMedia.length;
    const totalPages = Math.ceil(totalMedia / limitNum);

    // Calculate storage statistics
    const totalSize = filteredMedia.reduce((sum, media) => sum + media.size, 0);
    const typeStats = filteredMedia.reduce((stats, media) => {
        const type = media.mimeType.split('/')[0] || 'unknown';
        stats[type] = (stats[type] || 0) + 1;
        return stats;
    }, {} as Record<string, number>);

    req.requestLogger?.info('Media files retrieved', {
        total: totalMedia,
        page: pageNum,
        limit: limitNum,
        totalSize,
        typeStats,
    });

    res.json({
        success: true,
        message: 'Media files retrieved successfully',
        data: {
            media: paginatedMedia,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalMedia,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
            statistics: {
                totalFiles: totalMedia,
                totalSize,
                typeBreakdown: typeStats,
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/media/:id
 * Get a specific media file by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Media ID is required');
    }

    const media = mediaFiles.get(id);
    if (!media) {
        throw new ValidationError('Media file not found');
    }

    req.requestLogger?.info('Media file retrieved', {
        mediaId: media.id,
        filename: media.originalName,
        size: media.size,
        mimeType: media.mimeType,
    });

    res.json({
        success: true,
        message: 'Media file retrieved successfully',
        data: { media },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/media/upload
 * Upload a new media file
 */
router.post('/upload', asyncHandler(async (req: Request, res: Response) => {
    // In a real implementation, this would handle multipart/form-data
    // For now, we'll simulate the upload process
    const {
        filename,
        mimeType,
        size,
        projectId,
        tags = [],
        description,
    } = req.body;

    // Validation
    if (!filename) {
        throw new ValidationError('Filename is required');
    }

    if (!mimeType) {
        throw new ValidationError('MIME type is required');
    }

    if (!size || size <= 0) {
        throw new ValidationError('Valid file size is required');
    }

    // Check file size limits (10MB for images, 50MB for audio/video)
    const maxSizes: Record<string, number> = {
        'image': 10 * 1024 * 1024, // 10MB
        'audio': 50 * 1024 * 1024, // 50MB
        'video': 100 * 1024 * 1024, // 100MB
        'application': 5 * 1024 * 1024, // 5MB
    };

    const fileType = mimeType.split('/')[0];
    const maxSize = maxSizes[fileType] || 5 * 1024 * 1024;

    if (size > maxSize) {
        throw new ValidationError(`File size exceeds limit for ${fileType} files (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    // Generate file metadata
    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = filename.split('.').pop() || '';
    const storedFilename = `${mediaId}.${fileExtension}`;
    const basePath = `/uploads/${fileType}s`;

    // Simulate metadata extraction
    let metadata: MediaFile['metadata'] = { format: fileExtension.toUpperCase() };

    if (fileType === 'image') {
        metadata = {
            ...metadata,
            width: 1920,
            height: 1080,
        };
    } else if (fileType === 'audio' || fileType === 'video') {
        metadata = {
            ...metadata,
            duration: 120 + Math.random() * 180, // Random duration
        };
    }

    // Create media record
    const newMedia: MediaFile = {
        id: mediaId,
        filename: storedFilename,
        originalName: filename,
        mimeType,
        size,
        path: `${basePath}/${storedFilename}`,
        url: `https://ai-story-studio.com/media/${storedFilename}`,
        userId: 'demo-user', // Would come from authenticated user
        projectId: projectId || undefined,
        tags: Array.isArray(tags) ? tags : [],
        description: description || undefined,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    mediaFiles.set(mediaId, newMedia);

    req.requestLogger?.info('Media file uploaded', {
        mediaId: newMedia.id,
        originalName: newMedia.originalName,
        size: newMedia.size,
        mimeType: newMedia.mimeType,
        projectId: newMedia.projectId,
    });

    res.status(201).json({
        success: true,
        message: 'Media file uploaded successfully',
        data: { media: newMedia },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * PUT /api/v1/media/:id
 * Update media file metadata
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tags, description, projectId } = req.body;

    if (!id) {
        throw new ValidationError('Media ID is required');
    }

    const media = mediaFiles.get(id);
    if (!media) {
        throw new ValidationError('Media file not found');
    }

    // Update metadata
    if (tags !== undefined) {
        media.tags = Array.isArray(tags) ? tags : [];
    }

    if (description !== undefined) {
        media.description = description;
    }

    if (projectId !== undefined) {
        media.projectId = projectId || undefined;
    }

    media.updatedAt = new Date();
    mediaFiles.set(id, media);

    req.requestLogger?.info('Media file updated', {
        mediaId: media.id,
        filename: media.originalName,
        updatedFields: { tags: !!tags, description: !!description, projectId: !!projectId },
    });

    res.json({
        success: true,
        message: 'Media file updated successfully',
        data: { media },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * DELETE /api/v1/media/:id
 * Delete a media file
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Media ID is required');
    }

    const media = mediaFiles.get(id);
    if (!media) {
        throw new ValidationError('Media file not found');
    }

    mediaFiles.delete(id);

    req.requestLogger?.info('Media file deleted', {
        mediaId: media.id,
        filename: media.originalName,
        size: media.size,
        userId: media.userId,
    });

    res.json({
        success: true,
        message: 'Media file deleted successfully',
        data: {
            deletedMedia: {
                id: media.id,
                filename: media.originalName,
                size: media.size,
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/media/batch
 * Batch operations on multiple media files
 */
router.post('/batch', asyncHandler(async (req: Request, res: Response) => {
    const { operation, mediaIds, data } = req.body;

    if (!operation) {
        throw new ValidationError('Operation is required');
    }

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        throw new ValidationError('Media IDs array is required');
    }

    const validOperations = ['delete', 'update-tags', 'move-to-project'];
    if (!validOperations.includes(operation)) {
        throw new ValidationError(`Invalid operation. Supported: ${validOperations.join(', ')}`);
    }

    const results = {
        successful: [] as string[],
        failed: [] as { id: string; error: string }[],
    };

    for (const mediaId of mediaIds) {
        try {
            const media = mediaFiles.get(mediaId);
            if (!media) {
                results.failed.push({ id: mediaId, error: 'Media file not found' });
                continue;
            }

            switch (operation) {
                case 'delete':
                    mediaFiles.delete(mediaId);
                    break;

                case 'update-tags':
                    if (data?.tags) {
                        media.tags = Array.isArray(data.tags) ? data.tags : [];
                        media.updatedAt = new Date();
                        mediaFiles.set(mediaId, media);
                    }
                    break;

                case 'move-to-project':
                    if (data?.projectId !== undefined) {
                        media.projectId = data.projectId || undefined;
                        media.updatedAt = new Date();
                        mediaFiles.set(mediaId, media);
                    }
                    break;
            }

            results.successful.push(mediaId);
        } catch (error) {
            results.failed.push({
                id: mediaId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    req.requestLogger?.info('Batch media operation completed', {
        operation,
        totalRequested: mediaIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
    });

    res.json({
        success: true,
        message: `Batch ${operation} operation completed`,
        data: {
            operation,
            results,
            summary: {
                total: mediaIds.length,
                successful: results.successful.length,
                failed: results.failed.length,
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/media/stats
 * Get media library statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
    const allMedia = Array.from(mediaFiles.values());

    const stats = {
        totalFiles: allMedia.length,
        totalSize: allMedia.reduce((sum, media) => sum + media.size, 0),
        typeBreakdown: allMedia.reduce((breakdown, media) => {
            const type = media.mimeType.split('/')[0] || 'unknown';
            breakdown[type] = {
                count: (breakdown[type]?.count || 0) + 1,
                size: (breakdown[type]?.size || 0) + media.size,
            };
            return breakdown;
        }, {} as Record<string, { count: number; size: number }>),
        projectBreakdown: allMedia.reduce((breakdown, media) => {
            const projectId = media.projectId || 'unassigned';
            breakdown[projectId] = (breakdown[projectId] || 0) + 1;
            return breakdown;
        }, {} as Record<string, number>),
        recentUploads: allMedia
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5)
            .map(media => ({
                id: media.id,
                filename: media.originalName,
                size: media.size,
                mimeType: media.mimeType,
                createdAt: media.createdAt,
            })),
    };

    req.requestLogger?.info('Media statistics retrieved', {
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        typeCount: Object.keys(stats.typeBreakdown).length,
    });

    res.json({
        success: true,
        message: 'Media statistics retrieved successfully',
        data: { stats },
        timestamp: new Date().toISOString(),
    });
}));

export default router;
