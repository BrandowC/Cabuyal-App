const { Router } = require('express')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')
const { emitir } = require('../realtime')
const { imprimirComanda } = require('../services/printer')

const router = Router()

router.use(requireAuth)

router.get('/mesa/:mesaId', async (req, res) => {
  const mesaId = Number(req.params.mesaId)
  const pedidos = await prisma.pedido.findMany({
    where: { mesaId, estado: { not: 'cerrado' } },
    orderBy: { fecha: 'asc' },
  })
  res.json(pedidos)
})

const addSchema = z.object({
  mesa_id: z.number().int().positive(),
  menu_id: z.number().int().positive().optional(),
  menu_dia_id: z.number().int().positive().optional(),
  nombre_plato: z.string().min(1),
  categoria: z.string().optional().default(''),
  precio: z.number().positive(),
  cantidad: z.number().int().positive().optional().default(1),
  notas: z.string().optional().default(''),
}).refine((d) => d.menu_id || d.menu_dia_id, { message: 'Debe indicar menu_id o menu_dia_id' })

router.post('/', requireRole('admin', 'empleado', 'caja'), validateBody(addSchema), async (req, res) => {
  const { mesa_id, menu_id, menu_dia_id, nombre_plato, categoria, precio, cantidad, notas } = req.body
  const pedido = await prisma.pedido.create({
    data: {
      mesaId: mesa_id, menuId: menu_id ?? null, menuDiaId: menu_dia_id ?? null,
      nombrePlato: nombre_plato, categoria, precio, cantidad, notas,
    },
  })
  const mesaActual = await prisma.mesa.findUnique({ where: { id: mesa_id } })
  const mesa = await prisma.mesa.update({
    where: { id: mesa_id },
    data: { estado: 'ocupada', mesero: mesaActual?.mesero || req.user.nombre },
  })

  emitir('mesas:cambio', { mesaId: mesa_id })
  imprimirComanda(mesa, [pedido])

  res.status(201).json({ ok: true })
})

const updateSchema = z.object({
  estado: z.enum(['pendiente', 'preparando', 'listo', 'cerrado']),
})

router.patch('/:id', requireRole('admin', 'empleado', 'caja'), validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id)
  const pedido = await prisma.pedido.update({ where: { id }, data: { estado: req.body.estado } })
  emitir('mesas:cambio', { mesaId: pedido.mesaId })
  res.json({ ok: true })
})

const cerrarSchema = z.object({
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional().default('efectivo'),
  propina: z.number().nonnegative().optional().default(0),
  notas_pago: z.string().optional().default(''),
})

router.post('/cerrar/:mesaId', requireRole('admin', 'caja'), validateBody(cerrarSchema), async (req, res) => {
  const mesaId = Number(req.params.mesaId)
  const { metodo_pago, propina, notas_pago } = req.body

  const resultado = await prisma.$transaction(async (tx) => {
    const mesaActual = await tx.mesa.findUnique({ where: { id: mesaId } })
    const pedidos = await tx.pedido.findMany({ where: { mesaId, estado: { not: 'cerrado' } } })
    const subtotal = pedidos.reduce((s, p) => s + p.precio * p.cantidad, 0)
    const total = subtotal + propina

    const venta = await tx.venta.create({
      data: {
        mesaId, subtotal, propina, total, metodoPago: metodo_pago, notasPago: notas_pago,
        mesero: mesaActual?.mesero || req.user.nombre,
      },
    })
    await tx.pedido.updateMany({
      where: { mesaId, estado: { not: 'cerrado' } },
      data: { estado: 'cerrado', ventaId: venta.id },
    })
    await tx.mesa.update({ where: { id: mesaId }, data: { estado: 'libre', mesero: '' } })

    return { total, subtotal, propina, ventaId: venta.id }
  })

  emitir('mesas:cambio', { mesaId })
  res.json({ ok: true, ...resultado })
})

module.exports = router
