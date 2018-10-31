module.exports = {
  apps: [
    {
      name: 'server',
      script: 'yarn server',
      watch: ['src'],
      instances: 1,
      env: {
        DEBUG: process.env.DEBUG || '*,-babel*',
        NODE_ENV: 'development'
      }
    },
    {
      name: 'worker',
      script: 'yarn worker',
      watch: ['src'],
      instances: 4,
      env: {
        DEBUG: process.env.DEBUG || '*,-babel*',
        NODE_ENV: 'development'
      }
    }
  ]
}
