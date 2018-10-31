# task-processor-boilerplate
A bolier plate for task processing with a server, workers and IPC communication setup using [node-ipc](https://www.npmjs.com/package/node-ipc)

## Commands to start server
- `yarn server`
- `yarn pm2:server` (via PM2)

## Commands to start worker
- `yarn worker`
- `yarn pm2:worker` (via PM2)

## Settings
- PM2 settings, like app instance count, watch, etc., can be modified in [ecosystem.config.js](ecosystem.config.js)
- Some app settings, like HOST, PORT, TCP_ENABLED, RETRY, etc., can be modified in [src/config.js](src/config.js)
