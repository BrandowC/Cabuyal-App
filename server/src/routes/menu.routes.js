const { Router } = require('express')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const platos = await prisma.plato.findMany({ orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }] })
  res.json(platos)
})

const platoSchema = z.object({
  nombre: z.string().min(1),
  categoria: z.string().min(1),
  precio: z.coerce.number().positive(),
  descripcion: z.string().optional().default(''),
  stock: z.coerce.number().int().nonnegative().nullable().optional(),
  imagenUrl: z.string().url().nullable().optional(),
})

router.post('/', requireRole('admin'), validateBody(platoSchema), async (req, res) => {
  const plato = await prisma.plato.create({ data: req.body })
  res.status(201).json(plato)
})

const updateSchema = platoSchema.partial().extend({
  disponible: z.coerce.boolean().optional(),
})

router.put('/:id', requireRole('admin'), validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id)
  const plato = await prisma.plato.update({ where: { id }, data: req.body })
  res.json(plato)
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id)
  await prisma.plato.delete({ where: { id } })
  res.json({ ok: true })
})

module.exports = router
