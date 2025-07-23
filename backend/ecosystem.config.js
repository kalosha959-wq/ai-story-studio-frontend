// ecosystem.config.js
// PM2 Configuration for Production Deployment

module.exports = {
    apps: [{
        name: 'ai-story-studio-backend',
        script: './dist/index.js',
        instances: 'max',
        exec_mode: 'cluster',

        // Environment configurations
        env: {
            NODE_ENV: 'development',
            PORT: 3001
        },

        env_production: {
            NODE_ENV: 'production',
            PORT: 3001,
            // Add production-specific variables here
        },

        // Logging
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,

        // Performance settings
        max_memory_restart: '1G',
        node_args: '--max_old_space_size=4096',

        // Restart settings
        autorestart: true,
        watch: false,
        max_restarts: 10,
        min_uptime: '60s',

        // Advanced settings
        kill_timeout: 5000,
        listen_timeout: 8000,

        // Health monitoring
        health_check_grace_period: 3000,

        // Source map support for debugging
        source_map_support: true,

        // Instance settings
        instances_spread: true,
        increment_var: 'PORT',

        // Cron restart (optional - restart every day at 3 AM)
        cron_restart: '0 3 * * *',

        // Merge logs from all instances
        merge_logs: true
    }],

    // Deployment configuration
    deploy: {
        production: {
            user: 'deploy',
            host: 'your-production-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:kalosha959-wq/ai-story-studio-frontend.git',
            path: '/var/www/ai-story-studio-backend',
            'post-deploy': 'cd backend && npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save'
        },

        staging: {
            user: 'deploy',
            host: 'staging.ai-story-studio.com',
            ref: 'origin/develop',
            repo: 'git@github.com:kalosha959-wq/ai-story-studio-frontend.git',
            path: '/var/www/ai-story-studio-staging',
            'post-deploy': 'cd backend && npm ci && npm run build && pm2 reload ecosystem.config.js --env staging && pm2 save'
        }
    }
};
