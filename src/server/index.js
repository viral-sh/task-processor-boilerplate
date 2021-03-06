import 'colors'
import { addDummyMessage } from './queue'
import { initlaizeIPCServer } from './ipc-server'

const debug = console.log

function addMessageToQueue () {
  setInterval(addDummyMessage, 2000)
}

(function main () {
  const appInstance = process.env.NODE_APP_INSTANCE
  if (
    appInstance === undefined ||
    appInstance === '0'
  ) {
    debug(`Master server found (${appInstance}). Staring IPC Channel`.green)
    addMessageToQueue()
    setInterval(addDummyMessage, 2000)
    initlaizeIPCServer()
  } else {
    debug(`Slave server found (${appInstance}). Skipping IPC Setup`.red)
  }
})()
