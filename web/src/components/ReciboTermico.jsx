import { X, Printer } from 'lucide-react'
import logo from '../assets/logo.png'
import { C } from '../theme'

// Recibo con formato de ticket térmico de 80 mm. En pantalla se ve como el papel; al imprimir
// solo sale el ticket (sin botones ni fondo), del ancho exacto del rollo, para cualquier impresora
// térmica instalada en el computador (ver README del proyecto: configuración de impresora).
const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`

function telefonoNegocio() {
  const digitos = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  if (digitos.length === 12 && digitos.startsWith('57')) {
    return `+57 ${digitos.slice(2, 5)} ${digitos.slice(5, 8)} ${digitos.slice(8)}`
  }
  return digitos ? `+${digitos}` : ''
}

export default function ReciboTermico({
  onClose, subtitulo = 'Restaurante · Palermo', titulo, numero, fecha, filas = [], items = [],
  subtotales = [], propinasSugeridas = [], total, notasPago, pie = '¡Gracias por su visita!', barraExtra, copia = false,
}) {
  const f = new Date(fecha)
  const tel = telefonoNegocio()

  return (
    <div className="recibo-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(35,29,24,0.6)', zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          body * { visibility: hidden; }
          #recibo-imprimible, #recibo-imprimible * { visibility: visible; }
          #recibo-imprimible { position: absolute; left: 0; top: 0; width: 72mm; margin: 0 4mm; padding: 3mm 0;
            box-shadow: none !important; border-radius: 0 !important; }
          .recibo-no-print { display: none !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380, maxHeight: '96vh', overflowY: 'auto', background: '#EFEBE1',
        borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>

        <div className="recibo-no-print" style={{ position: 'sticky', top: 0, background: '#EFEBE1', zIndex: 2,
          padding: '12px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: C.textMuted }}>RECIBO</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => window.print()}
                style={{ background: C.header, border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}>
                <Printer size={14} /> IMPRIMIR
              </button>
              <button onClick={onClose} aria-label="Cerrar"
                style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px',
                  color: C.textMuted, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          </div>
          {barraExtra}
        </div>

        <div style={{ padding: '4px 16px 18px' }}>
          <div id="recibo-imprimible" style={{ width: 302, maxWidth: '100%', margin: '0 auto', background: '#fff',
            padding: '16px 14px 18px', boxSizing: 'border-box', color: '#111', fontSize: 12, lineHeight: 1.35,
            fontFamily: "'Segoe UI', Arial, sans-serif", boxShadow: '0 4px 14px rgba(0,0,0,0.12)', borderRadius: 4 }}>

            <div style={{ textAlign: 'center' }}>
              <img src={logo} alt="El Cabuyal" style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover',
                filter: 'grayscale(1) contrast(1.15)' }} />
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 3, marginTop: 6 }}>EL CABUYAL</div>
              <div style={{ fontSize: 11 }}>{subtitulo}</div>
              {tel && <div style={{ fontSize: 11 }}>WhatsApp {tel}</div>}
            </div>

            <Linea />

            <div style={{ textAlign: 'center' }}>
              {copia && (
                <div style={{ display: 'inline-block', border: '2px solid #111', padding: '1px 12px', marginBottom: 4,
                  fontWeight: 800, fontSize: 12, letterSpacing: 4 }}>COPIA</div>
              )}
              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>{titulo} N° {String(numero).padStart(5, '0')}</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>
                {f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {'  ·  '}
                <b>{f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</b>
              </div>
            </div>

            <Linea />

            {filas.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '1px 0' }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700, textAlign: 'right' }}>{val}</span>
              </div>
            ))}

            <div style={{ borderTop: '2px solid #111', borderBottom: '1px solid #111', marginTop: 10, padding: '3px 0',
              display: 'grid', gridTemplateColumns: '30px 1fr auto', gap: 6, fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>
              <span>CANT</span><span>DESCRIPCIÓN</span><span>VALOR</span>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px dotted #999' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', gap: 6 }}>
                  <span style={{ fontWeight: 700 }}>{it.cantidad}</span>
                  <span>{it.nombre}</span>
                  <span style={{ textAlign: 'right' }}>{pesos(it.valor)}</span>
                </div>
                {it.notas && <div style={{ paddingLeft: 36, fontSize: 10, fontStyle: 'italic' }}>• {it.notas}</div>}
              </div>
            ))}

            <div style={{ paddingTop: 8 }}>
              {subtotales.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span>{label}</span><span>{pesos(val)}</span>
                </div>
              ))}
            </div>

            {propinasSugeridas.length > 0 && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dotted #999' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>
                  TOTAL SI DESEA DEJAR PROPINA
                </div>
                {propinasSugeridas.map((p) => (
                  <div key={p.pct} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span>{p.pct}% <span style={{ fontSize: 10 }}>(+{pesos(p.valor)})</span></span>
                    <span style={{ fontWeight: 700 }}>{pesos(p.total)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
              padding: '8px 0', borderTop: '2px solid #111', borderBottom: '2px solid #111' }}>
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>TOTAL</span>
              <span style={{ fontWeight: 800, fontSize: 21 }}>{pesos(total)}</span>
            </div>

            {notasPago && (
              <div style={{ marginTop: 8, fontSize: 11 }}><b>Pago:</b> {notasPago}</div>
            )}

            <Linea />
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{pie}</div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 6, color: '#444' }}>
              Documento de control interno. No es factura electrónica de venta.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Linea() {
  return <div style={{ borderTop: '1px dashed #111', margin: '9px 0' }} />
}
