// Agrega ventas de mesas y domicilios en tres vistas: por mesero, por plato y por hora.
// Es una función pura (recibe filas ya consultadas) para poder probarla sin base de datos.
const SIN_MESERO = 'Sin asignar'

function sumar(mapa, clave, inicial, acumular) {
  const actual = mapa.get(clave) || inicial()
  acumular(actual)
  mapa.set(clave, actual)
}

function armarResumen({ ventas = [], pedidos = [], domicilios = [] }) {
  const porMesero = new Map()
  ventas.forEach((v) => {
    const nombre = (v.mesero || '').trim() || SIN_MESERO
    sumar(porMesero, nombre, () => ({ mesero: nombre, cuentas: 0, total: 0, propinas: 0 }), (m) => {
      m.cuentas += 1
      m.total += v.total
      m.propinas += v.propina || 0
    })
  })

  const porPlato = new Map()
  const acumularPlato = (nombre, cantidad, ingresos) => {
    sumar(porPlato, nombre, () => ({ nombre, cantidad: 0, ingresos: 0 }), (p) => {
      p.cantidad += cantidad
      p.ingresos += ingresos
    })
  }
  pedidos.forEach((p) => acumularPlato(p.nombrePlato, p.cantidad, p.precio * p.cantidad))
  domicilios.forEach((d) => d.items.forEach((i) => acumularPlato(i.nombre, i.cantidad, i.precio * i.cantidad)))

  const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, ordenes: 0, total: 0 }))
  const acumularHora = (fecha, total) => {
    const h = porHora[new Date(fecha).getHours()]
    h.ordenes += 1
    h.total += total
  }
  ventas.forEach((v) => acumularHora(v.fecha, v.total))
  domicilios.forEach((d) => acumularHora(d.fecha, d.total))

  const totalMesas = ventas.reduce((s, v) => s + v.total, 0)
  const totalDomicilios = domicilios.reduce((s, d) => s + d.total, 0)
  const ordenes = ventas.length + domicilios.length
  const totalGeneral = totalMesas + totalDomicilios

  return {
    resumen: {
      totalGeneral, totalMesas, totalDomicilios,
      cuentasMesas: ventas.length, ordenesDomicilios: domicilios.length,
      ticketPromedio: ordenes ? totalGeneral / ordenes : 0,
    },
    porMesero: [...porMesero.values()].sort((a, b) => b.total - a.total),
    porPlato: [...porPlato.values()].sort((a, b) => b.cantidad - a.cantidad || b.ingresos - a.ingresos),
    porHora,
  }
}

module.exports = { armarResumen, SIN_MESERO }
