const { Router } = require('express')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')
const { emitir } = require('../realtime')

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const mesas = await prisma.mesa.findMany({ orderBy: { numero: 'asc' } })
  res.json(mesas)
})

const estadoSchema = z.object({
  estado: z.enum(['libre', 'ocupada', 'cuenta']),
  mesero: z.string().optional().default(''),
})

router.patch('/:id', requireRole('admin', 'empleado', 'caja'), validateBody(estadoSchema), async (req, res) => {
  const id = Number(req.params.id)
  const { estado, mesero } = req.body
  await prisma.mesa.update({ where: { id }, data: { estado, mesero } })
  emitir('mesas:cambio', { mesaId: id })
  res.json({ ok: true })
})

const layoutSchema = z.object({
  numero: z.number().int().positive().optional(),
  capacidad: z.number().int().positive().optional(),
  zona: z.string().optional(),
  forma: z.enum(['cuadrada', 'circular', 'rectangular']).optional(),
  posX: z.number().int().optional(),
  posY: z.number().int().optional(),
  ancho: z.number().int().positive().optional(),
  alto: z.number().int().positive().optional(),
  imagenUrl: z.string().url().nullable().optional(),
})

router.put('/:id', requireRole('admin'), validateBody(layoutSchema), async (req, res) => {
  const id = Number(req.params.id)
  const mesa = await prisma.mesa.update({ where: { id }, data: req.body })
  emitir('mesas:layout', { mesaId: id })
  res.json(mesa)
})

module.exports = router
