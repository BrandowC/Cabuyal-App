const { Server } = require('socket.io')

let io = null

function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true },
  })
  return io
}

function emitir(evento, payload) {
  if (!io) return
  io.emit(evento, payload)
}

module.exports = { initRealtime, emitir }
