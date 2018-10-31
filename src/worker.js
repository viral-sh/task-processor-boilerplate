import 'colors'
import ipc from 'node-ipc'
import { EVENTS, TASK_SERVER, APP_SPACE } from './constants'

const SLEEP_TIME = 5000
let ACCEPTING_NEW_TASKS = true
let scheduledGetTask = null
let currentTask = null

const debug = console.log

function processTask (data, onSuccess, onFailure) {
  if (currentTask) {
    debug('Still processing old task: '.red, currentTask)
    throw new Error('multiple tasks found')
  }
  const { id, processTime, fail } = data
  currentTask = id
  setTimeout(function () {
    currentTask = null
    debug(`processed in ${processTime} ms`)
    if (fail) {
      onFailure('processing failure')
    } else {
      onSuccess('done')
    }
  }, processTime)
}

function stopAcceptingNewConnections () {
  ACCEPTING_NEW_TASKS = false
  if (scheduledGetTask) {
    clearTimeout(scheduledGetTask)
  }
}

function WaitAndForceExit (time) {
  debug(`Force exiting in ${time} ms ...`.yellow)
  setTimeout(() => {
    if (currentTask) {
      reportFailure(currentTask, 'worker killed')
    }
    debug(`Force exited`.bgRed)
    process.exit(1)
  }, time)
}

process.on('SIGINT', function () {
  debug('exit signal received'.yellow)
  stopAcceptingNewConnections()
  if (currentTask) {
    debug(`Task is ${currentTask} currently processing...`.yellow)
    WaitAndForceExit(1000)
  } else {
    debug('No task found. Exiting...'.bgGreen)
    ipc.disconnect(TASK_SERVER)
    process.exit(0)
  }
})

/* EVENT EMITTERS START */

function emit (eventKey, data) {
  const message = {
    from: ipc.config.id,
    payload: data
  }
  ipc.of[TASK_SERVER].emit(eventKey, message)
}

function getTask () {
  debug('getting tasks...')
  emit(EVENTS.GET_TASK)
}

function getTaskAfterDelay () {
  if (ACCEPTING_NEW_TASKS) {
    scheduledGetTask = setTimeout(getTask, SLEEP_TIME)
  } else {
    scheduledGetTask = null
  }
}

function reportSuccess (id, output) {
  debug(`reporting success for task: ${id}`.green)
  emit(EVENTS.TASK_COMPLETED, {
    id,
    output,
    sendNewTask: Boolean(ACCEPTING_NEW_TASKS)
  })
}

function reportFailure (id, error) {
  debug(`reporting failure for id: ${id}`.red)
  emit(EVENTS.TASK_FAILED, {
    id,
    error,
    sendNewTask: Boolean(ACCEPTING_NEW_TASKS)
  })
}

/* EVENT EMITTERS END */

/* EVENT HANDLERS START */

function handleDisconnect () {
  debug(`## disconnected from ${TASK_SERVER} ##`.red)
}

function handleConnect () {
  debug(`## connected to ${TASK_SERVER} ##`.rainbow)
  if (ACCEPTING_NEW_TASKS && !currentTask) {
    getTask()
  }
}

function handleProcessTask (data) {
  debug('Got new task:', `${data.id}`.blue)
  const onSuccess = output => {
    reportSuccess(data.id, output)
  }
  const onFailure = err => {
    reportFailure(data.id, err)
  }
  // process task
  processTask(data, onSuccess, onFailure)
}

function handleNoTasks (data) {
  debug('No tasks to process: ', data)
  getTaskAfterDelay()
}
/* EVENT HANDLERS END */

function onServerConnect () {
  // register event handlers
  debug('on server connect')
  const server = ipc.of[TASK_SERVER]
  server.on(EVENTS.SERVER_CONNECTED, handleConnect)
  server.on(EVENTS.SERVER_DISCONNECTED, handleDisconnect)
  server.on(EVENTS.PROCESS_TASK, handleProcessTask)
  server.on(EVENTS.NO_TASKS, handleNoTasks)
}

function connectToTaskServer () {
  ipc.config.appspace = APP_SPACE
  ipc.config.id = `worker-${process.env.NODE_APP_INSTANCE || 0}`
  ipc.config.retry = 1500
  ipc.config.silent = true
  debug(`trying to connect to ${TASK_SERVER}...`)
  ipc.connectTo(TASK_SERVER, onServerConnect)
}

connectToTaskServer()
