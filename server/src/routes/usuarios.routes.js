const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')
const { validarQuitarAcceso } = require('../services/accesoUsuarios')
const { olvidarUsuario } = require('../auth/sesionActiva')

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

// Cuántos administradores activos quedarían si se le quita el acceso a este usuario
const adminsActivosSin = (id) => prisma.usuario.count({ where: { rol: 'admin', activo: true, id: { not: id } } })

router.patch('/:id', validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id)
  const data = { ...req.body }

  // Desactivar o quitar el rol de administrador también puede dejar el sistema sin administrador
  const accion = data.activo === false ? 'desactivar' : (data.rol && data.rol !== 'admin' ? 'quitar_admin' : null)
  if (accion) {
    const objetivo = await prisma.usuario.findUnique({ where: { id }, select: { id: true, rol: true, activo: true } })
    const problema = validarQuitarAcceso({
      accion, objetivo, solicitanteId: req.user.id, adminsActivosRestantes: objetivo ? await adminsActivosSin(id) : 0,
    })
    if (problema) return res.status(400).json({ error: problema })
  }

  if (data.password) data.password = await bcrypt.hash(data.password, 10)

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true },
  })
  olvidarUsuario(id)
  res.json(usuario)
})

// Elimina la cuenta de forma definitiva. Las ventas, domicilios y mesas guardan el nombre del empleado como
// texto (no como referencia), así que todo ese historial se conserva tal cual.
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const objetivo = await prisma.usuario.findUnique({ where: { id }, select: { id: true, rol: true, activo: true } })
  const problema = validarQuitarAcceso({
    accion: 'eliminar', objetivo, solicitanteId: req.user.id, adminsActivosRestantes: objetivo ? await adminsActivosSin(id) : 0,
  })
  if (problema) return res.status(objetivo ? 400 : 404).json({ error: problema })

  await prisma.usuario.delete({ where: { id } })
  olvidarUsuario(id)
  res.json({ ok: true })
})

module.exports = router
