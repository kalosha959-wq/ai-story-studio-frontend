import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    // Configure source maps as expected by VS Code launch.json
    build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'esnext',
        rollupOptions: {
            output: {
                sourcemapPathTransform: (relativeSourcePath) => {
                    // Transform source map paths to match VS Code configuration
                    // sourceMapPathOverrides: "/app/*": "${workspaceFolder}/app/*"
                    return path.join('/app', relativeSourcePath);
                }
            }
        }
    },

    // Development server configuration
    server: {
        port: 3000,
        host: true,
        open: false // Don't auto-open browser, let VS Code handle it
    },

    // Resolve configuration
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    // Environment variables
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
});
