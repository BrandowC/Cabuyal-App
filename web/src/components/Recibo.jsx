import { useState } from 'react'
import api from '../lib/api'
import { C } from '../theme'
import ReciboTermico from './ReciboTermico'

const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }
const PORCENTAJES = [2, 5, 8, 10]
const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`

// Recibo de una mesa cobrada. La propina se elige aquí, cuando se le entrega la cuenta al cliente:
// el total se recalcula y queda guardado en la venta.
export default function Recibo({ venta, onClose, onCambio }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  if (!venta) return null

  const propinaActual = Number(venta.propina) || 0
  const pctActual = venta.subtotal > 0 ? Math.round((propinaActual / venta.subtotal) * 100) : 0

  const elegir = async (valor) => {
    if (valor === propinaActual || guardando) return
    setGuardando(true); setError('')
    try {
      onCambio?.(await api.setPropinaVenta(venta.id, valor))
    } catch (err) {
      setError(err.message || 'No se pudo guardar la propina')
    } finally {
      setGuardando(false)
    }
  }

  const opciones = [
    { clave: 'sin', etiqueta: 'Sin propina', valor: 0, activa: propinaActual === 0 },
    ...PORCENTAJES.map((pct) => {
      const valor = Math.round(venta.subtotal * pct / 100)
      return { clave: pct, etiqueta: `${pct}%`, sub: pesos(valor), valor, activa: propinaActual > 0 && pctActual === pct }
    }),
  ]

  const selectorPropina = onCambio && (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.textMuted, marginBottom: 6 }}>
        PROPINA VOLUNTARIA {guardando && '· guardando…'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {opciones.map((o) => (
          <button key={o.clave} onClick={() => elegir(o.valor)} disabled={guardando}
            style={{ padding: '7px 2px', borderRadius: 9, cursor: guardando ? 'wait' : 'pointer', fontWeight: 800, fontSize: 11,
              lineHeight: 1.2, background: o.activa ? C.header : '#fff', color: o.activa ? '#fff' : C.text,
              border: `1.5px solid ${o.activa ? C.header : C.border}` }}>
            {o.etiqueta}
            {o.sub && <div style={{ fontWeight: 600, fontSize: 9, opacity: 0.8 }}>{o.sub}</div>}
          </button>
        ))}
      </div>
      {error && <div style={{ color: C.danger, fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  )

  return (
    <ReciboTermico
      onClose={onClose}
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
      total={venta.total}
      notasPago={venta.notasPago}
      pie="¡Gracias por su visita! Vuelva pronto"
      barraExtra={selectorPropina}
    />
  )
}
