
const debug = console.log
const _queue = []

export function addMessage (message) {
  _queue.push(message)
  debug('Pushed message. Queue length:', `${_queue.length}`.blue)
}

export const getMessage = () => _queue.shift()
export const isQueueEmpty = () => _queue.length === 0

export const addDummyMessage = (function () {
  let id = 0
  return () => {
    addMessage({
      id: ++id,
      processTime: Math.round(Math.random() * 10000), // process for 0-10 seconds
      fail: Math.random() < 0.2 // fail for 20% of tasks
    })
  }
})()
