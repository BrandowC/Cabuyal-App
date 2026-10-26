import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChefHat, Bell, BellOff, Clock, Flame, Undo2, StickyNote } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { C } from '../theme'

// Cada plato es un botón: un toque lo avanza de color (rojo → amarillo → verde) y la flecha lo devuelve un paso.
const FLUJO = ['pendiente', 'preparando', 'listo']
const ESTILO = {
  pendiente:  { color: C.terracotta, bg: C.terracottaBg, texto: 'NUEVO' },
  preparando: { color: '#B8860B',    bg: '#FBF1CC',      texto: 'PREPARANDO' },
  listo:      { color: C.success,    bg: C.successBg,    texto: 'LISTO' },
}

const minutosDesde = (fecha, ahora) => Math.max(0, Math.floor((ahora - new Date(fecha).getTime()) / 60000))

// Un pedido en espera se pone naranja a los 10 min y rojo a los 20
function colorUrgencia(min) {
  if (min >= 20) return C.danger
  if (min >= 10) return '#B8860B'
  return C.textMuted
}

// El navegador solo deja sonar audio después de que la persona toca la pantalla; por eso el
// contexto de audio se crea y se "despierta" en el primer toque (o al pulsar PROBAR SONIDO).
let contextoAudio = null
function obtenerAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!contextoAudio) contextoAudio = new Ctx()
  if (contextoAudio.state === 'suspended') contextoAudio.resume()
  return contextoAudio
}

function pitar() {
  const ctx = obtenerAudio()
  if (!ctx) return false
  // Tres notas cortas tipo "ding-ding-dong"
  ;[[880, 0], [880, 0.22], [660, 0.44]].forEach(([freq, inicio]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = ctx.currentTime + inicio
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.6, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.21)
  })
  return true
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
    // Primer toque en la pantalla: habilita el audio del navegador
    const desbloquear = () => { obtenerAudio(); window.removeEventListener('pointerdown', desbloquear) }
    window.addEventListener('pointerdown', desbloquear)
    return () => {
      clearTimeout(inicial)
      socket.off('mesas:cambio', onCambio)
      clearInterval(refresco); clearInterval(reloj)
      window.removeEventListener('pointerdown', desbloquear)
    }
  }, [cargar])

  const cambiarEstado = async (item, estado) => {
    // Cambia el color al instante y confirma con el servidor
    setPedidos((prev) => prev.map((p) => (p.id === item.id ? { ...p, estado } : p)))
    try {
      await api.updatePedido({ id: item.id, estado })
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el pedido')
      cargar()
    }
  }

  const avanzar = (item) => {
    const i = FLUJO.indexOf(item.estado)
    if (i < FLUJO.length - 1) cambiarEstado(item, FLUJO[i + 1])
  }
  const devolver = (item) => {
    const i = FLUJO.indexOf(item.estado)
    if (i > 0) cambiarEstado(item, FLUJO[i - 1])
  }

  // Una comanda por mesa; las que aún tienen algo por hacer van primero, las más viejas arriba
  const comandas = useMemo(() => {
    const porMesa = new Map()
    pedidos.forEach((p) => {
      if (!porMesa.has(p.mesaId)) porMesa.set(p.mesaId, { mesaId: p.mesaId, mesa: p.mesa, mesero: p.mesero, items: [] })
      porMesa.get(p.mesaId).items.push(p)
    })
    return [...porMesa.values()]
      .map((c) => ({
        ...c,
        completa: c.items.every((i) => i.estado === 'listo'),
        masVieja: Math.min(...c.items.filter((i) => i.estado !== 'listo').map((i) => new Date(i.fecha).getTime()), Infinity),
      }))
      .sort((a, b) => Number(a.completa) - Number(b.completa) || a.masVieja - b.masVieja || a.mesa - b.mesa)
  }, [pedidos])

  const porHacer = pedidos.filter((p) => p.estado !== 'listo').length
  const conteo = (estado) => pedidos.filter((p) => p.estado === estado).length

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Segoe UI, sans-serif' }}>
      <style>{`
        .cocina-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap:16px; align-items:start; }
        @keyframes cocina-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
        .cocina-item { transition: background .15s ease, border-color .15s ease, transform .1s ease; }
        .cocina-item:active { transform: scale(0.985); }
      `}</style>

      <div style={{ background: C.headerGradient, padding: '16px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ChefHat size={28} color={C.gold} />
          <div>
            <div style={{ color: C.headerText, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>COCINA</div>
            <div style={{ color: C.headerTextMuted, fontSize: 11, letterSpacing: 1 }}>
              {porHacer === 0 ? 'Sin pedidos en espera' : `${porHacer} plato(s) por hacer`} · toca un plato para cambiarle el color
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {FLUJO.map((e) => (
            <span key={e} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '4px 11px', color: C.headerText, fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: ESTILO[e].color }} />
              {ESTILO[e].texto} {conteo(e)}
            </span>
          ))}
          <button onClick={() => setSonido((s) => !s)} aria-pressed={sonido}
            title="Suena en este aparato cuando llega un pedido nuevo"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10,
              border: `1px solid ${C.gold}66`, background: sonido ? `${C.gold}22` : 'transparent',
              color: C.gold, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {sonido ? <Bell size={15} /> : <BellOff size={15} />} {sonido ? 'AVISO SONORO ACTIVO' : 'AVISO SONORO APAGADO'}
          </button>
          <button onClick={() => { if (!pitar()) setError('Este navegador no permite reproducir sonido') }}
            style={{ padding: '8px 13px', borderRadius: 10, border: `1px solid ${C.gold}66`, background: 'transparent',
              color: C.gold, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            🔊 PROBAR SONIDO
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '14px 24px 0', background: C.dangerBg, color: C.danger, borderRadius: 10,
          padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      <div style={{ padding: 24 }}>
        {comandas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.textFaint }}>
            <ChefHat size={48} style={{ opacity: 0.4 }} />
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700 }}>No hay pedidos en cocina</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Cuando un mesero pulse "Enviar a cocina" aparecerán aquí.</div>
          </div>
        ) : (
          <div className="cocina-grid">
            {comandas.map((cm) => {
              const min = Number.isFinite(cm.masVieja) ? minutosDesde(cm.masVieja, ahora) : 0
              const urgencia = cm.completa ? C.success : colorUrgencia(min)
              return (
                <article key={cm.mesaId} style={{ background: C.surface, borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${C.border}`, borderTop: `5px solid ${cm.completa ? C.success : C.header}`,
                  boxShadow: '0 2px 10px rgba(11,36,54,0.08)', animation: 'cocina-in .25s ease',
                  opacity: cm.completa ? 0.8 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 20 }}>Mesa {cm.mesa}</div>
                      {cm.mesero && <div style={{ fontSize: 11, color: C.textMuted }}>Atiende: {cm.mesero}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: urgencia, fontWeight: 800, fontSize: 14 }}>
                      {cm.completa ? '✓ COMPLETA' : (<>
                        {min >= 10 ? <Flame size={15} /> : <Clock size={15} />} {min} min
                      </>)}
                    </div>
                  </div>

                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cm.items.map((it) => {
                      const e = ESTILO[it.estado] || ESTILO.pendiente
                      return (
                        <div key={it.id} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                          <button className="cocina-item" onClick={() => avanzar(it)}
                            disabled={it.estado === 'listo'}
                            title={it.estado === 'listo' ? 'Plato listo' : 'Toca para pasar al siguiente color'}
                            style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: it.estado === 'listo' ? 'default' : 'pointer',
                              background: e.bg, border: `2px solid ${e.color}`, borderRadius: 10, padding: '10px 12px',
                              display: 'flex', alignItems: 'center', gap: 10, color: C.text, fontFamily: 'inherit' }}>
                            <span style={{ background: e.color, color: '#fff', fontWeight: 800, borderRadius: 8, minWidth: 34,
                              textAlign: 'center', padding: '4px 0', fontSize: 15 }}>{it.cantidad}×</span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 800, fontSize: 15, textDecoration: it.estado === 'listo' ? 'line-through' : 'none',
                                opacity: it.estado === 'listo' ? 0.7 : 1 }}>{it.nombrePlato}</span>
                              {it.notas && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, background: '#fff',
                                  color: C.goldDark, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                                  <StickyNote size={12} /> {it.notas}
                                </span>
                              )}
                            </span>
                            <span style={{ color: e.color, fontWeight: 800, fontSize: 10, letterSpacing: 1 }}>{e.texto}</span>
                          </button>
                          {it.estado !== 'pendiente' && (
                            <button onClick={() => devolver(it)} aria-label="Devolver un paso" title="Devolver al color anterior"
                              style={{ width: 38, border: `1px solid ${C.border}`, background: C.surfaceAlt, borderRadius: 10,
                                cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Undo2 size={16} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
