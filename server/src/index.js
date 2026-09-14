require('dotenv').config()

const http = require('http')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const cron = require('node-cron')

const { initRealtime } = require('./realtime')
const { ejecutarRetencion } = require('./services/retention')

const authRoutes = require('./routes/auth.routes')
const mesasRoutes = require('./routes/mesas.routes')
const menuRoutes = require('./routes/menu.routes')
const pedidosRoutes = require('./routes/pedidos.routes')
const ventasRoutes = require('./routes/ventas.routes')
const domiciliosRoutes = require('./routes/domicilios.routes')
const usuariosRoutes = require('./routes/usuarios.routes')
const publicoRoutes = require('./routes/publico.routes')
const reportesRoutes = require('./routes/reportes.routes')
const menuDiaRoutes = require('./routes/menuDia.routes')

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/mesas', mesasRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/ventas', ventasRoutes)
app.use('/api/domicilios', domiciliosRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/publico', publicoRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/menu-dia', menuDiaRoutes)

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const httpServer = http.createServer(app)
initRealtime(httpServer)

// Retención de datos: corre todos los días a las 3:00 a.m., borra pedidos/ventas/domicilios
// con más de RETENTION_MONTHS de antigüedad (respaldo automático en /server/backups antes de borrar).
cron.schedule('0 3 * * *', () => {
  ejecutarRetencion().catch((err) => console.error('Error ejecutando la retención de datos:', err))
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`El Cabuyal API escuchando en http://localhost:${PORT}`)
})
