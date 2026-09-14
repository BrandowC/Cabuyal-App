import { io } from 'socket.io-client'

// Mismo origen que sirve la SPA (en dev, Vite lo proxea a la API vía vite.config.js).
const socket = io({ withCredentials: true, autoConnect: true })

export default socket
