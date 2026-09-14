const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')

const router = Router()

router.use(requireAuth, requireRole('admin'))

router.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true, creadoEn: true },
    orderBy: { creadoEn: 'asc' },
  })
  res.json(usuarios)
})

const createSchema = z.object({
  nombre: z.string().min(1),
  usuario: z.string().min(3),
  password: z.string().min(6),
  rol: z.enum(['admin', 'empleado', 'caja']),
})

router.post('/', validateBody(createSchema), async (req, res) => {
  const { nombre, usuario, password, rol } = req.body
  const existe = await prisma.usuario.findUnique({ where: { usuario } })
  if (existe) return res.status(409).json({ error: 'Ese nombre de usuario ya existe' })

  const hash = await bcrypt.hash(password, 10)
  const nuevo = await prisma.usuario.create({
    data: { nombre, usuario, password: hash, rol },
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true },
  })
  res.status(201).json(nuevo)
})

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  rol: z.enum(['admin', 'empleado', 'caja']).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(6).optional(),
})

router.patch('/:id', validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id)
  const data = { ...req.body }
  if (data.password) data.password = await bcrypt.hash(data.password, 10)

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true },
  })
  res.json(usuario)
})

module.exports = router
