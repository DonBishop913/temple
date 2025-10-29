module.exports = {
  apps: [
    {
      name: "council-api",
      script: "./server/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 4321,
        WS_PORT: 4322,
        REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
      },
      watch: false,
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
