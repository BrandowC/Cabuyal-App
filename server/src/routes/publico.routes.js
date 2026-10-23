const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { validateBody } = require('../validate')
const { prisma } = require('../db')
const { emitir } = require('../realtime')
const { addSchema } = require('./domicilios.routes')

const router = Router()

router.get('/menu', async (req, res) => {
  const platos = await prisma.plato.findMany({
    where: { disponible: true },
    select: { id: true, nombre: true, categoria: true, precio: true, descripcion: true, imagenUrl: true },
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  })
  res.json(platos)
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
