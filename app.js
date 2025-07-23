#!/usr/bin/env node

/**
 * AI Story Studio Frontend - Main Entry Point
 * 
 * This file serves as the main entry point as configured in .vscode/launch.json
 * It starts the Vite development server for the React frontend.
 */

import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevServer() {
    try {
        // Create Vite server in middleware mode
        const server = await createServer({
            configFile: path.resolve(__dirname, 'vite.config.js'),
            root: __dirname,
            server: {
                middlewareMode: false,
                port: 3000,
                host: true
            }
        });

        await server.listen();
        console.log('🚀 AI Story Studio Frontend');
        console.log('📍 Development server running at http://localhost:3000');
        console.log('🔍 Ready for debugging via VS Code launch configuration');

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('\n👋 Shutting down server...');
            server.close();
        });

    } catch (error) {
        console.error('❌ Failed to start development server:', error);
        process.exit(1);
    }
}

// Start the server
startDevServer();
