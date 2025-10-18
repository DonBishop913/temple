// PM2 Configuration for Temple PC Services
// (Full version archived)
module.exports = {
  apps: [
    {
      name: "TempleDashboard",
      script: "C:\\Temple\\LivingDashboard\\MasterDashboard.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: { NODE_ENV: "production" },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
