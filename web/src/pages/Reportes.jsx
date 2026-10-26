import { useCallback, useEffect, useState } from 'react'
import { TrendingUp, Receipt, Bike, Wallet, Users, UtensilsCrossed, Clock } from 'lucide-react'
import api from '../lib/api'
import { C } from '../theme'

const FILTROS = [
  { key: 'hoy', label: 'HOY' },
  { key: 'semana', label: 'SEMANA' },
  { key: 'mes', label: 'MES' },
  { key: 'rango', label: 'PERSONALIZADO' },
]

const pesos = (n) => `$${Math.round(n).toLocaleString('es-CO')}`
const etiquetaHora = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`

function Tarjeta({ icono, color, bg, etiqueta, valor }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16,
      boxShadow: '0 2px 8px rgba(43,36,32,0.05)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{icono}</div>
      <div style={{ fontSize: 21, fontWeight: 800 }}>{valor}</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{etiqueta}</div>
    </div>
  )
}

function Seccion({ icono, titulo, children }) {
  return (
    <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px',
      boxShadow: '0 2px 8px rgba(43,36,32,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: C.textMuted,
        fontWeight: 800, fontSize: 11, letterSpacing: 2 }}>
        {icono} {titulo}
      </div>
      {children}
    </section>
  )
}

function Barra({ etiqueta, sub, valor, max, color, derecha }) {
  const ancho = max > 0 ? Math.max(3, (valor / max) * 100) : 0
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {etiqueta} {sub && <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 11 }}>{sub}</span>}
        </span>
        <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{derecha}</span>
      </div>
      <div style={{ height: 8, background: C.bgAlt, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${ancho}%`, height: '100%', background: color, borderRadius: 6, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

export default function Reportes() {
  const [filtro, setFiltro] = useState('hoy')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ordenPlato, setOrdenPlato] = useState('cantidad')

  const cargar = useCallback(async () => {
    if (filtro === 'rango' && (!desde || !hasta)) return
    setCargando(true); setError('')
    try {
      setDatos(await api.getReporteVentas(filtro === 'rango' ? { desde, hasta } : { filtro }))
    } catch (err) {
      setError(err.message || 'No se pudo cargar el reporte')
    } finally {
      setCargando(false)
    }
  }, [filtro, desde, hasta])

  useEffect(() => {
    const t = setTimeout(cargar, 0)
    return () => clearTimeout(t)
  }, [cargar])

  const platos = datos ? [...datos.porPlato].sort((a, b) => b[ordenPlato] - a[ordenPlato]).slice(0, 15) : []
  const maxPlato = platos.length ? Math.max(...platos.map((p) => p[ordenPlato])) : 0
  const maxMesero = datos?.porMesero.length ? Math.max(...datos.porMesero.map((m) => m.total)) : 0
  const maxHora = datos ? Math.max(0, ...datos.porHora.map((h) => h.total)) : 0
  const horaPico = datos && maxHora > 0 ? datos.porHora.find((h) => h.total === maxHora).hora : null
  // Solo se dibujan las horas en que el restaurante realmente vende
  const horasConVenta = datos ? datos.porHora.filter((h) => h.ordenes > 0).map((h) => h.hora) : []
  const desdeHora = horasConVenta.length ? Math.min(...horasConVenta) : 10
  const hastaHora = horasConVenta.length ? Math.max(...horasConVenta) : 22
  const horas = datos ? datos.porHora.filter((h) => h.hora >= desdeHora && h.hora <= hastaHora) : []

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Segoe UI, sans-serif' }}>
      <style>{`
        .rep-grid4 { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; }
        .rep-grid2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; align-items:start; }
        @media (max-width: 900px) { .rep-grid4 { grid-template-columns: repeat(2, minmax(0,1fr)); } .rep-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ background: C.headerGradient, padding: '20px 24px', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ color: C.headerText, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>REPORTES DE VENTAS</div>
        <div style={{ color: C.headerTextMuted, fontSize: 11, letterSpacing: 1, marginTop: 2 }}>
          Por mesero, por plato y por hora · mesas y domicilios
        </div>
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{ padding: '8px 16px', borderRadius: 9, fontSize: 11, fontWeight: 800, letterSpacing: 1, cursor: 'pointer',
                background: filtro === f.key ? C.header : C.surface, color: filtro === f.key ? '#fff' : C.textMuted,
                border: `1px solid ${filtro === f.key ? C.header : C.border}` }}>{f.label}</button>
          ))}
          {filtro === 'rango' && (
            <>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface }} />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface }} />
            </>
          )}
          {cargando && <span style={{ color: C.textMuted, fontSize: 12 }}>Actualizando…</span>}
        </div>

        {error && <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>{error}</div>}

        {datos && (
          <>
            <div className="rep-grid4">
              <Tarjeta icono={<TrendingUp size={18} />} color={C.success} bg={C.successBg} etiqueta="Ventas totales" valor={pesos(datos.resumen.totalGeneral)} />
              <Tarjeta icono={<Receipt size={18} />} color={C.info} bg={C.infoBg}
                etiqueta={`Mesas · ${datos.resumen.cuentasMesas} cuentas`} valor={pesos(datos.resumen.totalMesas)} />
              <Tarjeta icono={<Bike size={18} />} color={C.terracotta} bg={C.terracottaBg}
                etiqueta={`Domicilios · ${datos.resumen.ordenesDomicilios} pedidos`} valor={pesos(datos.resumen.totalDomicilios)} />
              <Tarjeta icono={<Wallet size={18} />} color={C.goldDark} bg={C.goldBg} etiqueta="Ticket promedio" valor={pesos(datos.resumen.ticketPromedio)} />
            </div>

            <div className="rep-grid2">
              <Seccion icono={<Users size={14} />} titulo="VENTAS POR MESERO">
                {datos.porMesero.length === 0 && <div style={{ color: C.textFaint, fontSize: 13 }}>Sin cuentas cerradas en este periodo</div>}
                {datos.porMesero.map((m) => (
                  <Barra key={m.mesero} etiqueta={m.mesero} sub={`${m.cuentas} cuenta(s)${m.propinas ? ` · propinas ${pesos(m.propinas)}` : ''}`}
                    valor={m.total} max={maxMesero} color={C.teal} derecha={pesos(m.total)} />
                ))}
              </Seccion>

              <Seccion icono={<UtensilsCrossed size={14} />} titulo="PLATOS MÁS VENDIDOS">
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {[{ k: 'cantidad', l: 'Por unidades' }, { k: 'ingresos', l: 'Por ingresos' }].map((o) => (
                    <button key={o.k} onClick={() => setOrdenPlato(o.k)}
                      style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: ordenPlato === o.k ? C.goldBg : 'transparent', color: ordenPlato === o.k ? C.goldDark : C.textMuted,
                        border: `1px solid ${ordenPlato === o.k ? C.gold : C.border}` }}>{o.l}</button>
                  ))}
                </div>
                {platos.length === 0 && <div style={{ color: C.textFaint, fontSize: 13 }}>Sin ventas en este periodo</div>}
                {platos.map((p, i) => (
                  <Barra key={p.nombre} etiqueta={`${i + 1}. ${p.nombre}`} sub={ordenPlato === 'cantidad' ? pesos(p.ingresos) : `${p.cantidad} und`}
                    valor={p[ordenPlato]} max={maxPlato} color={C.gold}
                    derecha={ordenPlato === 'cantidad' ? `${p.cantidad} und` : pesos(p.ingresos)} />
                ))}
              </Seccion>
            </div>

            <Seccion icono={<Clock size={14} />} titulo="VENTAS POR HORA">
              {horaPico === null ? (
                <div style={{ color: C.textFaint, fontSize: 13 }}>Sin ventas en este periodo</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                    Hora pico: <b style={{ color: C.text }}>{etiquetaHora(horaPico)}</b> con {pesos(maxHora)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 170 }}>
                    {horas.map((h) => (
                      <div key={h.hora} title={`${etiquetaHora(h.hora)} · ${h.ordenes} orden(es) · ${pesos(h.total)}`}
                        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 3 }}>{h.ordenes || ''}</div>
                        <div style={{ width: '100%', maxWidth: 34, borderRadius: '6px 6px 0 0',
                          height: `${maxHora ? (h.total / maxHora) * 100 : 0}%`, minHeight: h.total ? 4 : 0,
                          background: h.hora === horaPico ? C.terracotta : C.teal, transition: 'height .4s ease' }} />
                        <div style={{ fontSize: 10, color: h.hora === horaPico ? C.terracotta : C.textMuted, marginTop: 5,
                          fontWeight: h.hora === horaPico ? 800 : 400 }}>{etiquetaHora(h.hora)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: C.textFaint, marginTop: 8 }}>El número sobre cada barra es la cantidad de órdenes (cuentas + domicilios).</div>
                </>
              )}
            </Seccion>
          </>
        )}
      </div>
    </div>
  )
}
