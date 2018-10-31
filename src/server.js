require('colors')
const ipc = require('node-ipc')

// ipc config
ipc.config.appspace = 'intel-portal'
ipc.config.id = 'etlServer'
ipc.config.retry = 1500
ipc.config.silent = true

let id = 0
const queue = []
const debug = console.log

function addMessageToQueue () {
  queue.push({ metadata: `Task No. ${++id}` })
  debug('Queue Length: ', `${queue.length}`.blue)
  setTimeout(addMessageToQueue, 2000)
}

function sendTask (socket) {
  ipc.server.emit(socket, 'processTask', queue.shift())
}

function sendNoTasks (socket) {
  ipc.server.emit(socket, 'noTasks')
}

function initlaizeIPCServer () {
  ipc.server.on('getTask', function (data, socket) {
    debug(`${data.from}`.blue, ' requesting task...')
    if (queue.length) {
      sendTask(socket)
    } else {
      sendNoTasks(socket)
    }
  })
  ipc.server.on('socket.disconnected', function (socket, destroyedSocketID) {
    debug('A client has disconnected!')
  })
}

ipc.serve(initlaizeIPCServer)
;(function main () {
  const appInstance = process.env.NODE_APP_INSTANCE
  if (
    appInstance === undefined ||
    appInstance === '0'
  ) {
    debug(`Master server found (${appInstance}). Staring IPC Channel`.green)
    ipc.server.start()
    addMessageToQueue()
  } else {
    debug(`Slave server found (${appInstance}). Skipping IPC Setup`.red)
  }
})()
