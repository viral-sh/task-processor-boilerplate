require('colors')
const ipc = require('node-ipc')
ipc.config.appspace = 'intel-portal'
ipc.config.id = `worker-${process.env.NODE_APP_INSTANCE}`
ipc.config.retry = 1500
ipc.config.silent = true

const SLEEP_TIME = 1000
let ACCEPTING_NEW_TASKS = false
let nextGetTask = null
let currentTask = null

const debug = console.log

function sendEvent (eventKey, data) {
  const payload = {
    from: ipc.config.id,
    data
  }
  ipc.of.etlServer.emit(eventKey, payload)
}

function getTask () {
  debug('getting tasks...')
  sendEvent('getTask')
}

function sleepAndGetTask () {
  if (ACCEPTING_NEW_TASKS) {
    nextGetTask = setTimeout(getTask, SLEEP_TIME)
  } else {
    nextGetTask = null
  }
}

function processTask (message, done) {
  if (currentTask) {
    debug('Still processing old task: '.red, currentTask)
    throw new Error('multiple tasks found')
  }
  currentTask = message.metadata
  const randProcessTime = Math.random() * 10000
  setTimeout(function () {
    currentTask = null
    debug(`processed in ${Math.round(randProcessTime)} ms`)
    done()
  }, randProcessTime)
}

ipc.connectTo('etlServer', function () {
  ipc.of.etlServer.on('disconnect', function () {
    debug('## disconnected from etlServer ##'.red)
  })

  ipc.of.etlServer.on('connect', function () {
    debug('## connected to etlServer ##'.rainbow, ipc.config.id)
    ACCEPTING_NEW_TASKS = true
    getTask()
  })

  ipc.of.etlServer.on('processTask', function (data) {
    debug('Got new task:', `${data.metadata}`.green)
    // process task
    processTask(data, () => {
      if (ACCEPTING_NEW_TASKS) {
        getTask()
      } else {
        debug('Completed task. Exiting now...'.blue)
        process.exit(0)
      }
    })
  })

  ipc.of.etlServer.on('noTasks', function (data) {
    debug('No tasks to process: '.blue, data)
    sleepAndGetTask()
  })
})

function stopAcceptingNewConnections () {
  ACCEPTING_NEW_TASKS = false
  if (nextGetTask) {
    clearTimeout(nextGetTask)
  }
}

function WaitAndForceExit (time) {
  debug(`Force exiting... in ${time}s`.yellow)
  setTimeout(() => {
    debug(`Force exited`.red)
    process.exit(1)
  }, time * 1000)
}

process.on('SIGINT', function () {
  debug('exit signal received')
  stopAcceptingNewConnections()
  if (currentTask) {
    debug('Task is currently processing...')
    WaitAndForceExit(1)
  } else {
    debug('No task found. Exiting...'.green)
    ipc.disconnect('etlServer')
    process.exit(0)
  }
})
