import { X, Printer } from 'lucide-react'
import logo from '../assets/logo.png'
import { C } from '../theme'

const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }

export default function Recibo({ venta, onClose }) {
  if (!venta) return null
  const fecha = new Date(venta.fecha)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(35,29,24,0.6)', zIndex: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380,
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

        {/* Barra de acciones (no se imprime) */}
        <div className="recibo-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 14px 0' }}>
          <button onClick={() => window.print()}
            style={{ background: C.goldBg, border: 'none', borderRadius: 8, padding: '7px 12px',
              color: C.goldDark, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
            <Printer size={13} /> IMPRIMIR
          </button>
          <button onClick={onClose}
            style={{ background: '#F1E9D8', border: 'none', borderRadius: 8, padding: '7px 10px',
              color: '#6B5F49', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        {/* Recibo */}
        <div id="recibo-imprimible" style={{ padding: '10px 28px 28px', fontFamily: "'Segoe UI', sans-serif", color: '#2B2420' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <img src={logo} alt="El Cabuyal" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid #C9A84C' }} />
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 2, marginTop: 8 }}>EL CABUYAL</div>
            <div style={{ fontSize: 11, color: '#8A7C63' }}>Restaurante · Palermo</div>
          </div>

          <div style={{ borderTop: '1px dashed #D8C9A3', borderBottom: '1px dashed #D8C9A3', padding: '8px 0', margin: '10px 0' }}>
            <Fila label="Recibo N°" val={`#${String(venta.id).padStart(5, '0')}`} />
            <Fila label="Mesa" val={venta.mesa?.numero ?? '—'} />
            <Fila label="Atendió" val={venta.mesero || '—'} />
            <Fila label="Fecha" val={fecha.toLocaleDateString('es-CO')} />
            <Fila label="Hora" val={fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
            <Fila label="Pago" val={METODOS[venta.metodoPago] || venta.metodoPago} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#8A7C63', marginBottom: 6 }}>DETALLE</div>
          {(venta.pedidos || []).map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span>x{p.cantidad} {p.nombrePlato}</span>
              <span>${(p.precio * p.cantidad).toLocaleString('es-CO')}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #D8C9A3', marginTop: 10, paddingTop: 10 }}>
            <Fila label="Subtotal" val={`$${Number(venta.subtotal).toLocaleString('es-CO')}`} />
            {venta.propina > 0 && <Fila label="Propina (voluntaria)" val={`$${Number(venta.propina).toLocaleString('es-CO')}`} />}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 12, paddingTop: 12, borderTop: '2px solid #231D18' }}>
            <span style={{ fontWeight: 800, letterSpacing: 1 }}>TOTAL</span>
            <span style={{ fontWeight: 800, fontSize: 22, color: '#B03A2E' }}>${Number(venta.total).toLocaleString('es-CO')}</span>
          </div>

          <div style={{ textAlign: 'center', color: '#8A7C63', fontSize: 11, marginTop: 22 }}>
            ¡Gracias por su visita!<br />El Cabuyal — Palermo
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #recibo-imprimible, #recibo-imprimible * { visibility: visible; }
          #recibo-imprimible { position: fixed; inset: 0; padding: 24px; }
          .recibo-no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function Fila({ label, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
      <span style={{ color: '#8A7C63' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{val}</span>
    </div>
  )
}
