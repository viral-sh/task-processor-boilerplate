export const EVENTS = {
  // socket events
  CLIENT_DISCONNECTED: 'socket.disconnected',
  SERVER_CONNECTED: 'connect',
  SERVER_DISCONNECTED: 'disconnect',
  // task events
  GET_TASK: 'getTask',
  PROCESS_TASK: 'processTask',
  NO_TASKS: 'noTasks',
  TASK_COMPLETED: 'taskCompleted',
  TASK_FAILED: 'taskFailed'
}

export const APP_SPACE = 'ipc-poc'
export const TASK_SERVER = 'taskServer'
