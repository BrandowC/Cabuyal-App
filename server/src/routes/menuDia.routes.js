const { Router } = require('express')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')
const { emitir } = require('../realtime')

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const items = await prisma.menuDia.findMany({
    where: { activo: true },
    orderBy: { creadoEn: 'asc' },
  })
  res.json(items)
})

const itemSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().default(''),
  precio: z.coerce.number().positive(),
})

router.post('/', requireRole('admin', 'caja'), validateBody(itemSchema), async (req, res) => {
  const item = await prisma.menuDia.create({ data: req.body })
  emitir('menu-dia:cambio', {})
  res.status(201).json(item)
})

const updateSchema = itemSchema.partial().extend({
  activo: z.coerce.boolean().optional(),
})

router.put('/:id', requireRole('admin', 'caja'), validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id)
  const item = await prisma.menuDia.update({ where: { id }, data: req.body })
  emitir('menu-dia:cambio', {})
  res.json(item)
})

router.delete('/:id', requireRole('admin', 'caja'), async (req, res) => {
  const id = Number(req.params.id)
  await prisma.menuDia.update({ where: { id }, data: { activo: false } })
  emitir('menu-dia:cambio', {})
  res.json({ ok: true })
})

module.exports = router
