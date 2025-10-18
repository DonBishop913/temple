module.exports = {
  apps : [
    {
      name: 'council-backend',
      script: 'C:/Temple/backend_api.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5174
      }
    },
    {
      name: 'council-proxy-stub',
      script: 'C:/Temple/react-client/proxy_stub.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false
    },
    {
      name: 'council-frontend',
      script: 'npx',
      args: 'webpack serve --config webpack.config.js --mode development --port 3000',
      cwd: 'C:/Temple/react-client',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
