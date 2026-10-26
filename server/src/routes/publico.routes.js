const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { validateBody } = require('../validate')
const { prisma } = require('../db')
const { emitir } = require('../realtime')
const { addSchema } = require('./domicilios.routes')

const router = Router()

// El menú público lo piden todos los clientes y casi nunca cambia: se guarda en memoria unos segundos
// para que miles de visitas simultáneas no se traduzcan en miles de consultas a la base de datos.
const MENU_TTL_MS = 30 * 1000
let menuCache = { datos: null, expira: 0, pendiente: null }

async function menuPublico() {
  if (menuCache.datos && Date.now() < menuCache.expira) return menuCache.datos
  // Si ya hay una consulta en curso, todos esperan esa misma en vez de lanzar una por visita
  if (!menuCache.pendiente) {
    menuCache.pendiente = prisma.plato.findMany({
      where: { disponible: true },
      select: { id: true, nombre: true, categoria: true, precio: true, descripcion: true, imagenUrl: true },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    }).then((datos) => {
      menuCache = { datos, expira: Date.now() + MENU_TTL_MS, pendiente: null }
      return datos
    }).catch((err) => { menuCache.pendiente = null; throw err })
  }
  return menuCache.pendiente
}

router.get('/menu', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  res.json(await menuPublico())
})

const domicilioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos seguidos. Espera unos minutos e intenta de nuevo.' },
})

router.post('/domicilios', domicilioLimiter, validateBody(addSchema), async (req, res) => {
  const { nombre, telefono, direccion, referencia, items, metodoPago, tipoEntrega } = req.body
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const domicilio = await prisma.domicilio.create({
    data: {
      nombre, telefono, direccion, referencia, items: { create: items }, metodoPago,
      subtotal, total: subtotal, tipoEntrega,
      estado: 'pendiente_confirmacion',
    },
    include: { items: true },
  })
  emitir('domicilios:cambio', { id: domicilio.id })
  res.status(201).json(domicilio)
})

module.exports = router
