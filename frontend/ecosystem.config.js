module.exports = {
  apps: [
    {
      name: "LivingDashboard",
      script: "npm",
      args: "run start --prefix C:/Temple/react-client",
      cwd: "C:/Temple/react-client",
      env: {
        PORT: 3000,
        NODE_ENV: "development",
      },
      autorestart: true,
      max_restarts: 10,
      error_file: "C:/Temple/logs/frontend.err.log",
      out_file: "C:/Temple/logs/frontend.out.log",
    },
    {
      name: "CouncilAPI",
      script: "C:/Temple/backend_api.js",
      autorestart: true,
      error_file: "C:/Temple/logs/backend.err.log",
      out_file: "C:/Temple/logs/backend.out.log",
    },
    {
      name: "GuardianNexus",
      script: "C:/Temple/guardian_invocation.js",
      autorestart: true,
      error_file: "C:/Temple/logs/guardian.err.log",
      out_file: "C:/Temple/logs/guardian.out.log",
    },
    {
      name: "OracleLab-Monitor",
      // OracleLab-Monitor removed: referenced script not present in workspace.
      // If you need this monitor, recreate the script at C:/Temple/oraclelab-monitor.js
      // and restore these settings.
      script: "C:/Temple/oraclelab-monitor.js",
      autorestart: false,
      error_file: "C:/Temple/logs/oraclelab.err.log",
      out_file: "C:/Temple/logs/oraclelab.out.log",
    },
  ],
};
