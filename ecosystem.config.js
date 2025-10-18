module.exports = {
  apps: [
    {
      name: 'OracleLab',
      script: './livingDashboardApiServer.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: true,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        API_KEY: 'your-dev-api-key',
        PORT: 5174,
      },
      env_production: {
        NODE_ENV: 'production',
        API_KEY: 'your-prod-api-key',
        PORT: 5174,
      },
      pre_start: 'powershell -ExecutionPolicy Bypass -File ./scripts/cleanPort5174.ps1'
    }
  ],
  deploy: {
    production: {
      user: 'your-user',
      host: 'your-server',
      ref: 'origin/main',
      repo: 'git@github.com:your/repo.git',
      path: '/path-to-deploy',
      'post-setup': 'npm install',
      'post-deploy': 'pm2 start ecosystem.config.js --env production --update-env',
    }
  }
};
