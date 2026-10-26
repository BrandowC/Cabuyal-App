import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Receipt, Bike, Store, Clock, User, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { C } from '../theme'
import Recibo from '../components/Recibo'
import ReciboDomicilio from '../components/ReciboDomicilio'

const FILTROS = [
  { key: 'hoy', label: 'HOY' },
  { key: 'semana', label: 'SEMANA' },
  { key: 'mes', label: 'MES' },
  { key: 'rango', label: 'PERSONALIZADO' },
]
const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }
const ESTADO_DOMI = {
  pendiente_confirmacion: { texto: 'POR CONFIRMAR', bg: C.infoBg, color: C.info },
  pendiente: { texto: 'EN PREPARACIÓN', bg: C.goldBg, color: C.goldDark },
  despachado: { texto: 'DESPACHADO', bg: C.successBg, color: C.success },
  cancelado: { texto: 'CANCELADO', bg: C.dangerBg, color: C.danger },
}

const pesos = (n) => `$${Math.round(n).toLocaleString('es-CO')}`
const hora = (f) => new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
const dia = (f) => new Date(f).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' })
const llaveDia = (f) => new Date(f).toDateString()

function duracion(desde, hasta) {
  if (!desde) return ''
  const min = Math.max(0, Math.round((new Date(hasta) - new Date(desde)) / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
}

export default function Historial() {
  const [pestana, setPestana] = useState('mesas')
  const [filtro, setFiltro] = useState('hoy')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [mesaSel, setMesaSel] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mesas, setMesas] = useState([])
  const [ventas, setVentas] = useState([])
  const [domicilios, setDomicilios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [reciboMesa, setReciboMesa] = useState(null)
  const [reciboDomi, setReciboDomi] = useState(null)

  useEffect(() => { api.getMesas().then(setMesas).catch(() => {}) }, [])

  const cargar = useCallback(async () => {
    if (filtro === 'rango' && (!desde || !hasta)) return
    setCargando(true); setError('')
    try {
      const periodo = filtro === 'rango' ? { desde, hasta } : { filtro }
      if (pestana === 'mesas') setVentas(await api.getVentas(filtro === 'rango' ? '' : filtro, { ...(filtro === 'rango' ? periodo : {}), ...(mesaSel ? { mesa: mesaSel } : {}) }))
      else setDomicilios(await api.getDomiciliosHistorial(periodo))
    } catch (err) {
      setError(err.message || 'No se pudo cargar el historial')
    } finally {
      setCargando(false)
    }
  }, [pestana, filtro, desde, hasta, mesaSel])

  useEffect(() => {
    const t = setTimeout(cargar, 0)
    return () => clearTimeout(t)
  }, [cargar])

  const verCopiaMesa = async (id) => {
    try { setReciboMesa(await api.getRecibo(id)) } catch (err) { setError(err.message || 'No se pudo abrir el recibo') }
  }

  const q = busqueda.trim().toLowerCase()
  const ventasVista = useMemo(() => ventas.filter((v) => !q
    || String(v.id).padStart(5, '0').includes(q) || String(v.id) === q || (v.mesero || '').toLowerCase().includes(q)), [ventas, q])
  const domiVista = useMemo(() => domicilios.filter((d) => !q
    || String(d.id).padStart(5, '0').includes(q) || d.nombre.toLowerCase().includes(q) || d.telefono.includes(q)), [domicilios, q])

  // Cuántas veces se usó cada mesa en el periodo (para saltar directo a una)
  const usosPorMesa = useMemo(() => {
    const m = new Map()
    ventas.forEach((v) => m.set(v.mesa, (m.get(v.mesa) || 0) + 1))
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [ventas])

  const lista = pestana === 'mesas' ? ventasVista : domiVista
  const totalLista = pestana === 'mesas'
    ? ventasVista.reduce((s, v) => s + v.total, 0)
    : domiVista.filter((d) => d.estado !== 'cancelado').reduce((s, d) => s + d.total, 0)

  // Agrupa por día cuando el periodo abarca varios
  const grupos = useMemo(() => {
    const g = new Map()
    lista.forEach((x) => {
      const k = llaveDia(x.fecha)
      if (!g.has(k)) g.set(k, { etiqueta: dia(x.fecha), filas: [] })
      g.get(k).filas.push(x)
    })
    return [...g.values()]
  }, [lista])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ background: C.headerGradient, padding: '20px 24px', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ color: C.headerText, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>HISTORIAL</div>
        <div style={{ color: C.headerTextMuted, fontSize: 11, letterSpacing: 1, marginTop: 2 }}>
          Cuentas de mesas y domicilios · abre cualquiera para ver o imprimir la copia del recibo
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ k: 'mesas', l: 'MESAS', i: <Receipt size={14} /> }, { k: 'domicilios', l: 'DOMICILIOS', i: <Bike size={14} /> }].map((p) => (
            <button key={p.k} onClick={() => { setPestana(p.k); setBusqueda('') }}
              style={{ flex: 1, padding: '11px 0', borderRadius: 10, fontWeight: 800, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: pestana === p.k ? C.header : C.surface, color: pestana === p.k ? '#fff' : C.textMuted,
                border: `1px solid ${pestana === p.k ? C.header : C.border}` }}>{p.i} {p.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{ padding: '8px 14px', borderRadius: 9, fontSize: 11, fontWeight: 800, letterSpacing: 1, cursor: 'pointer',
                background: filtro === f.key ? C.gold : C.surface, color: filtro === f.key ? C.header : C.textMuted,
                border: `1px solid ${filtro === f.key ? C.gold : C.border}` }}>{f.label}</button>
          ))}
          {filtro === 'rango' && (
            <>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface }} />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface }} />
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pestana === 'mesas' && (
            <select value={mesaSel} onChange={(e) => setMesaSel(e.target.value)} aria-label="Filtrar por mesa"
              style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 13, fontWeight: 700, color: C.text }}>
              <option value="">Todas las mesas</option>
              {[...mesas].sort((a, b) => a.numero - b.numero).map((m) => <option key={m.id} value={m.numero}>Mesa {m.numero}</option>)}
            </select>
          )}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 12px' }}>
            <Search size={14} color={C.goldDark} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder={pestana === 'mesas' ? 'Buscar por N° de recibo o mesero…' : 'Buscar por N° de recibo, cliente o teléfono…'}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, padding: '11px 0', color: C.text }} />
          </div>
        </div>

        {pestana === 'mesas' && !mesaSel && usosPorMesa.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>Usos por mesa:</span>
            {usosPorMesa.map(([num, n]) => (
              <button key={num} onClick={() => setMesaSel(String(num))}
                style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', color: C.text }}>
                Mesa {num} · {n} {n === 1 ? 'vez' : 'veces'}
              </button>
            ))}
          </div>
        )}

        {error && <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, color: C.textMuted }}>
          <span>
            {cargando ? 'Cargando…' : `${lista.length} ${pestana === 'mesas' ? 'cuenta(s)' : 'pedido(s)'}`}
            {pestana === 'mesas' && mesaSel && <b style={{ color: C.text }}> · Mesa {mesaSel}</b>}
          </span>
          <span>Total: <b style={{ color: C.text, fontSize: 15 }}>{pesos(totalLista)}</b></span>
        </div>

        {!cargando && lista.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: C.textFaint, fontSize: 14 }}>
            No hay registros en este periodo
          </div>
        )}

        {grupos.map((g) => (
          <section key={g.etiqueta}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.textMuted, textTransform: 'uppercase', margin: '4px 0 8px' }}>
              {g.etiqueta}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.filas.map((x) => (pestana === 'mesas' ? (
                <button key={x.id} onClick={() => verCopiaMesa(x.id)}
                  style={{ display: 'grid', gridTemplateColumns: '78px 1fr auto', alignItems: 'center', gap: 12, textAlign: 'left',
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
                    fontFamily: 'inherit', color: C.text }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>Mesa {x.mesa}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>#{String(x.id).padStart(5, '0')}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Clock size={13} color={C.goldDark} />
                      {x.abiertaEn ? `${hora(x.abiertaEn)} → ${hora(x.fecha)}` : hora(x.fecha)}
                      {x.abiertaEn && <span style={{ color: C.textMuted, fontWeight: 600, fontSize: 12 }}>({duracion(x.abiertaEn, x.fecha)})</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {x.mesero || 'Sin asignar'}</span>
                      <span>{METODOS[x.metodoPago] || x.metodoPago}</span>
                      <span>{x.items} producto(s)</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: C.goldDark }}>{pesos(x.total)}</span>
                    <ChevronRight size={16} color={C.textFaint} />
                  </div>
                </button>
              ) : (
                <button key={x.id} onClick={() => setReciboDomi(x)}
                  style={{ display: 'grid', gridTemplateColumns: '78px 1fr auto', alignItems: 'center', gap: 12, textAlign: 'left',
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
                    fontFamily: 'inherit', color: C.text, opacity: x.estado === 'cancelado' ? 0.7 : 1 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {x.tipoEntrega === 'recoger' ? <Store size={14} /> : <Bike size={14} />}
                      {x.tipoEntrega === 'recoger' ? 'Recoge' : 'Domi'}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>#{String(x.id).padStart(5, '0')}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {x.nombre}
                      {ESTADO_DOMI[x.estado] && (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 7px', borderRadius: 20,
                          background: ESTADO_DOMI[x.estado].bg, color: ESTADO_DOMI[x.estado].color }}>{ESTADO_DOMI[x.estado].texto}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {hora(x.fecha)}</span>
                      <span>{x.telefono}</span>
                      <span>{METODOS[x.metodoPago] || x.metodoPago}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: C.goldDark,
                      textDecoration: x.estado === 'cancelado' ? 'line-through' : 'none' }}>{pesos(x.total)}</span>
                    <ChevronRight size={16} color={C.textFaint} />
                  </div>
                </button>
              )))}
            </div>
          </section>
        ))}
      </div>

      {reciboMesa && <Recibo venta={reciboMesa} onClose={() => setReciboMesa(null)} copia />}
      {reciboDomi && <ReciboDomicilio domicilio={reciboDomi} onClose={() => setReciboDomi(null)} copia />}
    </div>
  )
}
