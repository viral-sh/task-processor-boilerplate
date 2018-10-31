import 'colors'
import ipc from 'node-ipc'
import { getMessage, isQueueEmpty } from './queue'
import { EVENTS, TASK_SERVER, APP_SPACE } from '../constants'
import config from '../config'

const debug = console.log
const TCP_ENABLED = process.env.TCP === 'true' || config.TCP_ENABLED

//  Event emitters
function sendTask (socket) {
  ipc.server.emit(socket, EVENTS.PROCESS_TASK, getMessage())
}
function sendNoTasks (socket) {
  ipc.server.emit(socket, EVENTS.NO_TASKS)
}

// Event handlers
function handleGetTask (data, socket) {
  debug(`${data.from}: requesting task...`)
  if (isQueueEmpty()) {
    sendNoTasks(socket)
  } else {
    sendTask(socket)
  }
}

function handleTaskCompleted (data, socket) {
  const { from, payload: { id, sendNewTask } } = data
  debug(`${from}: `, `Task ${id} completed`.green)
  if (sendNewTask) {
    handleGetTask(data, socket)
  }
}

function handleTaskFailed (data, socket) {
  const { from, payload: { id, sendNewTask } } = data
  debug(`${from}: `, `Task ${id} failed`.red)
  if (sendNewTask) {
    handleGetTask(data, socket)
  }
}

function handleClientDisconnected (socket, destroyedSocketID) {
  debug(`Client ${socket.id} has disconnected`.red)
  debug(`Connected Sockets: ${ipc.server.sockets.length}`)
}

function handleClientConnected (socket, socketId) {
  debug(`Client has connected`.rainbow)
  debug(`Connected Sockets: ${ipc.server.sockets.length}`)
}

function onServerStart () {
  ipc.server.on(EVENTS.GET_TASK, handleGetTask)
  ipc.server.on(EVENTS.TASK_COMPLETED, handleTaskCompleted)
  ipc.server.on(EVENTS.TASK_FAILED, handleTaskFailed)
  ipc.server.on(EVENTS.CLIENT_DISCONNECTED, handleClientDisconnected)
  ipc.server.on(EVENTS.SERVER_CONNECTED, handleClientConnected)
}

export function initlaizeIPCServer () {
  // configure ipc
  ipc.config.appspace = APP_SPACE
  ipc.config.id = TASK_SERVER
  ipc.config.retry = config.RETRY
  ipc.config.silent = !config.IPC_LOGS

  // create ipc server
  if (TCP_ENABLED) {
    debug('TCP ENABLED'.bold.yellow)
    ipc.serveNet(config.HOST, config.PORT, onServerStart)
  } else {
    debug('TCP DISABLED'.bold.yellow)
    ipc.serve(onServerStart)
  }

  // start ipc server
  ipc.server.start()
}
