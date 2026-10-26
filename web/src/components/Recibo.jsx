import ReciboTermico from './ReciboTermico'

const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }
const PORCENTAJES_PROPINA = [2, 5, 8, 10]

// Recibo de una mesa cobrada. Debajo del subtotal se imprimen las cuatro opciones de propina con
// el total que pagaría el cliente en cada caso; es él quien decide al recibir el recibo.
export default function Recibo({ venta, onClose, copia = false }) {
  if (!venta) return null

  const propinaActual = Number(venta.propina) || 0
  const pctActual = venta.subtotal > 0 ? Math.round((propinaActual / venta.subtotal) * 100) : 0

  // Si la venta ya tiene una propina registrada se muestra tal cual y no se sugieren otras
  const propinasSugeridas = propinaActual > 0 ? [] : PORCENTAJES_PROPINA.map((pct) => {
    const valor = Math.round(venta.subtotal * pct / 100)
    return { pct, valor, total: venta.subtotal + valor }
  })

  return (
    <ReciboTermico
      onClose={onClose}
      copia={copia}
      titulo="RECIBO DE VENTA"
      numero={venta.id}
      fecha={venta.fecha}
      filas={[
        ['Mesa', venta.mesa?.numero],
        ['Atendió', venta.mesero],
        ['Pago', METODOS[venta.metodoPago] || venta.metodoPago],
      ]}
      items={(venta.pedidos || []).map((p) => ({
        cantidad: p.cantidad, nombre: p.nombrePlato, valor: p.precio * p.cantidad, notas: p.notas,
      }))}
      subtotales={[
        ['Subtotal', venta.subtotal],
        ...(propinaActual > 0 ? [[`Propina${pctActual ? ` (${pctActual}%)` : ''}`, propinaActual]] : []),
      ]}
      propinasSugeridas={propinasSugeridas}
      total={venta.total}
      notasPago={venta.notasPago}
      pie="¡Gracias por su visita! Vuelva pronto"
    />
  )
}
