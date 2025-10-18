module.exports = {
  apps: [
    {
      name: 'aiwass-awakening-api',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        PORT: 5521,
        REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
      }
    }
  ]
}
