import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChefHat, Bell, BellOff, Clock, Flame, CheckCircle2, ChevronRight, StickyNote } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { C } from '../theme'

const COLUMNAS = [
  { estado: 'pendiente',  titulo: 'NUEVOS',          color: C.terracotta, bg: C.terracottaBg, siguiente: 'preparando', accion: 'EMPEZAR' },
  { estado: 'preparando', titulo: 'EN PREPARACIÓN',  color: C.gold,       bg: C.goldBg,       siguiente: 'listo',      accion: 'TODO LISTO' },
  { estado: 'listo',      titulo: 'LISTOS PARA SERVIR', color: C.success, bg: C.successBg,    siguiente: null,         accion: null },
]

const minutosDesde = (fecha, ahora) => Math.max(0, Math.floor((ahora - new Date(fecha).getTime()) / 60000))

// Un pedido en espera se pone amarillo a los 10 min y rojo a los 20
function colorUrgencia(min) {
  if (min >= 20) return C.danger
  if (min >= 10) return C.goldDark
  return C.textMuted
}

function pitar() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    ;[880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18); osc.stop(ctx.currentTime + i * 0.18 + 0.17)
    })
    setTimeout(() => ctx.close(), 800)
  } catch { /* sin audio disponible */ }
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState([])
  const [ahora, setAhora] = useState(() => Date.now())
  const [sonido, setSonido] = useState(true)
  const [error, setError] = useState('')
  const pendientesPrevios = useRef(null)
  const sonidoRef = useRef(true)
  useEffect(() => { sonidoRef.current = sonido }, [sonido])

  const cargar = useCallback(async () => {
    try {
      const data = await api.getPedidosCocina()
      const nuevos = data.filter((p) => p.estado === 'pendiente').length
      if (pendientesPrevios.current !== null && nuevos > pendientesPrevios.current && sonidoRef.current) pitar()
      pendientesPrevios.current = nuevos
      setPedidos(data)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cocina')
    }
  }, [])

  useEffect(() => {
    const inicial = setTimeout(cargar, 0)
    const onCambio = () => cargar()
    socket.on('mesas:cambio', onCambio)
    // Respaldo por si se corta la conexión en tiempo real
    const refresco = setInterval(cargar, 20000)
    const reloj = setInterval(() => setAhora(Date.now()), 15000)
    return () => {
      clearTimeout(inicial)
      socket.off('mesas:cambio', onCambio)
      clearInterval(refresco); clearInterval(reloj)
    }
  }, [cargar])

  const avanzar = async (ids, estado) => {
    // Actualiza la pantalla al instante y confirma con el servidor
    setPedidos((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, estado } : p)))
    try {
      await Promise.all(ids.map((id) => api.updatePedido({ id, estado })))
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el pedido')
      cargar()
    }
  }

  // Una "comanda" por mesa dentro de cada columna
  const tablero = useMemo(() => COLUMNAS.map((col) => {
    const porMesa = new Map()
    pedidos.filter((p) => p.estado === col.estado).forEach((p) => {
      if (!porMesa.has(p.mesaId)) porMesa.set(p.mesaId, { mesaId: p.mesaId, mesa: p.mesa, mesero: p.mesero, items: [] })
      porMesa.get(p.mesaId).items.push(p)
    })
    return { ...col, comandas: [...porMesa.values()] }
  }), [pedidos])

  const totalPendientes = pedidos.filter((p) => p.estado !== 'listo').length

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Segoe UI, sans-serif' }}>
      <style>{`
        .cocina-cols { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:16px; align-items:start; }
        @keyframes cocina-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
        @media (max-width: 900px) { .cocina-cols { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ background: C.headerGradient, padding: '18px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ChefHat size={28} color={C.gold} />
          <div>
            <div style={{ color: C.headerText, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>COCINA</div>
            <div style={{ color: C.headerTextMuted, fontSize: 11, letterSpacing: 1 }}>
              {totalPendientes === 0 ? 'Sin pedidos en espera' : `${totalPendientes} ítem(s) por preparar`}
            </div>
          </div>
        </div>
        <button onClick={() => { setSonido((s) => !s); if (!sonido) pitar() }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10,
            border: `1px solid ${C.gold}66`, background: sonido ? `${C.gold}22` : 'transparent',
            color: C.gold, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          {sonido ? <Bell size={15} /> : <BellOff size={15} />} {sonido ? 'SONIDO ACTIVO' : 'SONIDO APAGADO'}
        </button>
      </div>

      {error && (
        <div style={{ margin: '14px 24px 0', background: C.dangerBg, color: C.danger, borderRadius: 10,
          padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      <div className="cocina-cols" style={{ padding: 24 }}>
        {tablero.map((col) => (
          <section key={col.estado}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
              <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 2, color: C.textMuted }}>{col.titulo}</div>
              <div style={{ background: col.bg, color: col.color, borderRadius: 20, padding: '1px 9px',
                fontSize: 12, fontWeight: 800 }}>{col.comandas.reduce((s, c) => s + c.items.length, 0)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.comandas.length === 0 && (
                <div style={{ border: `1px dashed ${C.border}`, borderRadius: 12, padding: '26px 0',
                  textAlign: 'center', color: C.textFaint, fontSize: 12 }}>Nada por aquí</div>
              )}

              {col.comandas.map((cm) => {
                const masVieja = Math.min(...cm.items.map((i) => new Date(i.fecha).getTime()))
                const min = minutosDesde(masVieja, ahora)
                const urgencia = col.estado === 'listo' ? C.success : colorUrgencia(min)
                const ids = cm.items.map((i) => i.id)
                return (
                  <article key={cm.mesaId} style={{ background: C.surface, borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${C.border}`, borderTop: `4px solid ${col.color}`,
                    boxShadow: '0 2px 10px rgba(11,36,54,0.07)', animation: 'cocina-in .25s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 17 }}>Mesa {cm.mesa}</div>
                        {cm.mesero && <div style={{ fontSize: 11, color: C.textMuted }}>Atiende: {cm.mesero}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: urgencia, fontWeight: 800, fontSize: 14 }}>
                        {col.estado !== 'listo' && min >= 10 ? <Flame size={15} /> : <Clock size={15} />}
                        {min} min
                      </div>
                    </div>

                    <div style={{ padding: '6px 14px' }}>
                      {cm.items.map((it) => (
                        <div key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
                          borderBottom: `1px solid ${C.bgAlt}` }}>
                          <div style={{ background: col.bg, color: col.color, fontWeight: 800, borderRadius: 8,
                            minWidth: 30, textAlign: 'center', padding: '3px 0', fontSize: 14 }}>{it.cantidad}×</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{it.nombrePlato}</div>
                            {it.notas && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, background: C.goldBg,
                                color: C.goldDark, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                                <StickyNote size={12} /> {it.notas}
                              </div>
                            )}
                          </div>
                          {col.siguiente && cm.items.length > 1 && (
                            <button onClick={() => avanzar([it.id], col.siguiente)} aria-label="Pasar este plato al siguiente estado"
                              style={{ border: `1px solid ${C.border}`, background: C.surfaceAlt, borderRadius: 8, width: 30, height: 30,
                                cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChevronRight size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {col.siguiente ? (
                      <button onClick={() => avanzar(ids, col.siguiente)}
                        style={{ width: '100%', border: 'none', cursor: 'pointer', padding: '13px 0', fontWeight: 800,
                          fontSize: 13, letterSpacing: 1, color: '#fff', background: col.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <CheckCircle2 size={16} /> {col.accion}
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px 0', color: C.success, fontWeight: 700, fontSize: 12,
                        background: C.successBg }}>Avisar al mesero para llevar a la mesa</div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
