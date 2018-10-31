import 'colors'
import ipc from 'node-ipc'
import { getMessage, isQueueEmpty } from './queue'
import { EVENTS, TASK_SERVER, APP_SPACE } from './constants'

const debug = console.log

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
  debug('a client has disconnected!')
}

function onServerStart () {
  ipc.server.on(EVENTS.GET_TASK, handleGetTask)
  ipc.server.on(EVENTS.TASK_COMPLETED, handleTaskCompleted)
  ipc.server.on(EVENTS.TASK_FAILED, handleTaskFailed)
  ipc.server.on(EVENTS.CLIENT_DISCONNECTED, handleClientDisconnected)
}

export function initlaizeIPCServer () {
  // configure ipc
  ipc.config.appspace = APP_SPACE
  ipc.config.id = TASK_SERVER
  ipc.config.retry = 1500
  ipc.config.silent = true

  // create ipc server
  ipc.serve(onServerStart)

  // start ipc server
  ipc.server.start()
}
