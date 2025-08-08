module.exports = {
  apps: [{
    name: 'bayg-ecommerce',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/bayg-ecommerce',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Process management
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart settings
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Advanced settings
    kill_timeout: 3000,
    listen_timeout: 3000,
    
    // Source map support
    source_map_support: true,
    
    // Merge logs from different instances
    merge_logs: true,
    
    // Auto restart on file changes (disable in production)
    autorestart: true,
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: '3.136.95.83',
      ref: 'origin/main',
      repo: 'git@github.com:owaisqarnikhan/rc-bayg2.git',
      path: '/home/ubuntu/bayg-ecommerce',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};