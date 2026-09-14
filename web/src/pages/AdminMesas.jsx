import { useEffect, useRef, useState } from 'react'
import { Save, Square, Circle, RectangleHorizontal, LayoutGrid } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { C } from '../theme'

const FORMAS = [
  { value: 'cuadrada', label: 'Cuadrada', icon: Square },
  { value: 'circular', label: 'Circular', icon: Circle },
  { value: 'rectangular', label: 'Rectangular', icon: RectangleHorizontal },
]

const bordeRadio = (forma) => forma === 'circular' ? '50%' : forma === 'rectangular' ? '10px' : '14px'

const FORMA_TAMANOS = {
  cuadrada: { ancho: 80, alto: 80 },
  circular: { ancho: 80, alto: 80 },
  rectangular: { ancho: 120, alto: 66 },
}
const tamanoDe = (forma) => FORMA_TAMANOS[forma] || FORMA_TAMANOS.cuadrada

const GRID_COLS = 5
const GRID_GAP_X = 130
const GRID_GAP_Y = 130
const GRID_OFFSET = 24

function tieneSolape(lista) {
  const vistos = new Set()
  for (const m of lista) {
    const clave = `${m.posX},${m.posY}`
    if (vistos.has(clave)) return true
    vistos.add(clave)
  }
  return false
}

export default function AdminMesas() {
  const [mesas, setMesas] = useState([])
  const [seleccionId, setSeleccionId] = useState(null)
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [organizando, setOrganizando] = useState(false)
  const canvasRef = useRef(null)
  const arrastreRef = useRef(null)

  const organizarEnCuadricula = async (lista) => {
    setOrganizando(true)
    try {
      const ordenadas = [...lista].sort((a, b) => a.numero - b.numero)
      const actualizadas = await Promise.all(ordenadas.map((m, i) => {
        const col = i % GRID_COLS
        const row = Math.floor(i / GRID_COLS)
        return api.updateMesaLayout(m.id, {
          posX: GRID_OFFSET + col * GRID_GAP_X,
          posY: GRID_OFFSET + row * GRID_GAP_Y,
        })
      }))
      setMesas(actualizadas.sort((a, b) => a.numero - b.numero))
    } finally {
      setOrganizando(false)
    }
  }

  const cargar = async () => {
    const data = await api.getMesas()
    if (data.length > 1 && tieneSolape(data)) {
      await organizarEnCuadricula(data)
    } else {
      setMesas(data)
    }
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const onCambio = () => cargar()
    socket.on('mesas:layout', onCambio)
    return () => socket.off('mesas:layout', onCambio)
  }, [])

  const seleccionar = (mesa) => {
    setSeleccionId(mesa.id)
    setForm({ ...mesa })
  }

  const onPointerDown = (e, mesa) => {
    e.preventDefault()
    seleccionar(mesa)
    const canvasRect = canvasRef.current.getBoundingClientRect()
    arrastreRef.current = {
      id: mesa.id,
      offsetX: e.clientX - canvasRect.left - mesa.posX,
      offsetY: e.clientY - canvasRect.top - mesa.posY,
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const onPointerMove = (e) => {
    const drag = arrastreRef.current
    if (!drag) return
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const posX = Math.max(0, Math.round(e.clientX - canvasRect.left - drag.offsetX))
    const posY = Math.max(0, Math.round(e.clientY - canvasRect.top - drag.offsetY))
    setMesas((prev) => prev.map((m) => m.id === drag.id ? { ...m, posX, posY } : m))
  }

  const onPointerUp = async () => {
    const drag = arrastreRef.current
    arrastreRef.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    if (!drag) return
    const mesa = mesas.find((m) => m.id === drag.id)
    if (!mesa) return
    await api.updateMesaLayout(mesa.id, { posX: mesa.posX, posY: mesa.posY })
    setForm((prev) => prev && prev.id === mesa.id ? { ...prev, posX: mesa.posX, posY: mesa.posY } : prev)
  }

  const guardarPanel = async () => {
    if (!form) return
    setGuardando(true)
    try {
      const { ancho, alto } = tamanoDe(form.forma)
      const actualizado = await api.updateMesaLayout(form.id, {
        capacidad: Number(form.capacidad),
        zona: form.zona,
        forma: form.forma,
        ancho, alto,
        imagenUrl: form.imagenUrl?.trim() ? form.imagenUrl.trim() : null,
      })
      setMesas((prev) => prev.map((m) => m.id === actualizado.id ? actualizado : m))
      setForm(actualizado)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Segoe UI, sans-serif', display: 'flex' }}>
      {/* CANVAS */}
      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
          <div>
            <div style={{ color: C.goldDark, fontSize: 18, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>
              EDITOR DE MESAS
            </div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>
              Arrastra las mesas para ubicarlas. Selecciona una para cambiar forma, tamaño e imagen.
            </div>
          </div>
          <button onClick={() => organizarEnCuadricula(mesas)} disabled={organizando}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 14px',
              color: C.textMuted, fontWeight: 700, fontSize: 12, cursor: organizando ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <LayoutGrid size={14} /> {organizando ? 'ORGANIZANDO…' : 'ORGANIZAR EN CUADRÍCULA'}
          </button>
        </div>

        <div ref={canvasRef} style={{
          position: 'relative', width: '100%', minWidth: 700, height: 640,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          backgroundImage: `linear-gradient(${C.bgAlt} 1px, transparent 1px), linear-gradient(90deg, ${C.bgAlt} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}>
          {mesas.map((m) => {
            const { ancho, alto } = tamanoDe(m.forma)
            return (
            <div key={m.id} onPointerDown={(e) => onPointerDown(e, m)}
              style={{
                position: 'absolute', left: m.posX, top: m.posY, width: ancho, height: alto,
                borderRadius: bordeRadio(m.forma), cursor: 'grab', userSelect: 'none',
                border: `2px solid ${seleccionId === m.id ? C.gold : C.goldDark}`,
                background: m.imagenUrl ? `url(${m.imagenUrl}) center/cover` : `linear-gradient(145deg, ${C.gold}, ${C.goldDark})`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                boxShadow: seleccionId === m.id ? `0 0 0 3px ${C.gold}44, 0 6px 16px rgba(0,0,0,0.18)` : '0 2px 6px rgba(0,0,0,0.08)',
                transition: 'box-shadow .15s',
                zIndex: seleccionId === m.id ? 10 : 1,
              }}>
              <span style={{ background: 'rgba(35,29,24,0.75)', color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '2px 6px', borderRadius: 6 }}>
                {m.numero}
              </span>
            </div>
            )
          })}
        </div>
      </div>

      {/* PANEL LATERAL */}
      <div style={{ width: 280, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: 20 }}>
        {!form ? (
          <div style={{ color: C.textFaint, fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Selecciona una mesa para editarla
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: C.goldDark, fontWeight: 800, letterSpacing: 1 }}>MESA {form.numero}</div>

            <Campo label="Capacidad">
              <input type="number" value={form.capacidad}
                onChange={(e) => setForm({ ...form, capacidad: e.target.value })} style={inputStyle} />
            </Campo>

            <Campo label="Zona">
              <input value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} style={inputStyle} />
            </Campo>

            <Campo label="Forma">
              <div style={{ display: 'flex', gap: 6 }}>
                {FORMAS.map(({ value, icon: Icon }) => (
                  <button key={value} onClick={() => setForm({ ...form, forma: value })}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                      background: form.forma === value ? C.gold : C.bgAlt,
                      color: form.forma === value ? C.header : C.textMuted,
                      border: `1px solid ${form.forma === value ? C.gold : C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </Campo>

            <Campo label="URL de imagen (opcional)">
              <input value={form.imagenUrl ?? ''} placeholder="https://..."
                onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })} style={inputStyle} />
            </Campo>

            <button onClick={guardarPanel} disabled={guardando}
              style={{ marginTop: 8, padding: '11px 0', borderRadius: 8, border: 'none',
                background: guardando ? C.border : C.gold, color: C.header, fontWeight: 800,
                cursor: guardando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8 }}>
              <Save size={14} /> {guardando ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 7,
  color: C.text, fontSize: 13, padding: '9px 12px', outline: 'none', boxSizing: 'border-box',
}

function Campo({ label, children }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}
