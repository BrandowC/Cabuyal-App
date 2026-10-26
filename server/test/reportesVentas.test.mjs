import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { armarResumen, SIN_MESERO } = require('../src/services/reportesVentas')

const hoy = (hora) => new Date(2026, 2, 15, hora, 10)

describe('armarResumen', () => {
  const ventas = [
    { mesero: 'Ana', total: 50000, propina: 5000, fecha: hoy(13) },
    { mesero: 'Ana', total: 30000, propina: 0, fecha: hoy(13) },
    { mesero: '', total: 20000, propina: 0, fecha: hoy(20) },
  ]
  const pedidos = [
    { nombrePlato: 'HAMBURGUESA SENCILLA', cantidad: 2, precio: 15000 },
    { nombrePlato: 'COCA COLA PERSONAL', cantidad: 3, precio: 4000 },
  ]
  const domicilios = [
    { total: 25000, fecha: hoy(13), items: [{ nombre: 'HAMBURGUESA SENCILLA', cantidad: 1, precio: 15000 }] },
  ]
  const r = armarResumen({ ventas, pedidos, domicilios })

  it('agrupa las ventas por mesero y ordena por total', () => {
    expect(r.porMesero[0]).toMatchObject({ mesero: 'Ana', cuentas: 2, total: 80000, propinas: 5000 })
    expect(r.porMesero[1].mesero).toBe(SIN_MESERO)
  })

  it('suma platos de mesas y domicilios juntos', () => {
    const hamb = r.porPlato.find((p) => p.nombre === 'HAMBURGUESA SENCILLA')
    expect(hamb).toMatchObject({ cantidad: 3, ingresos: 45000 })
    expect(r.porPlato[0].cantidad).toBeGreaterThanOrEqual(r.porPlato[1].cantidad)
  })

  it('reparte las órdenes por hora del día', () => {
    expect(r.porHora).toHaveLength(24)
    expect(r.porHora[13]).toMatchObject({ ordenes: 3, total: 105000 })
    expect(r.porHora[20]).toMatchObject({ ordenes: 1, total: 20000 })
  })

  it('calcula totales y ticket promedio', () => {
    expect(r.resumen.totalGeneral).toBe(125000)
    expect(r.resumen.ticketPromedio).toBe(125000 / 4)
  })

  it('no falla sin datos', () => {
    const vacio = armarResumen({})
    expect(vacio.resumen.ticketPromedio).toBe(0)
    expect(vacio.porMesero).toEqual([])
  })
})
