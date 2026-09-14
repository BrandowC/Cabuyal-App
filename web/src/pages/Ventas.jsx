import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, TrendingUp, Calendar, Clock, RefreshCw, Download, Receipt } from 'lucide-react'
import api from '../lib/api'
import { C } from '../theme'
import Recibo from '../components/Recibo'

const FILTROS = [
  { key:'hoy',    label:'HOY' },
  { key:'semana', label:'ESTA SEMANA' },
  { key:'mes',    label:'ESTE MES' },
  { key:'rango',  label:'PERSONALIZADO' },
]

function StatCard({ icon, iconBg, iconColor, label, val, extra }) {
  return (
    <div style={{ background:C.surface, borderRadius:14, padding:'18px 18px', border:`1px solid ${C.border}`,
      boxShadow:'0 2px 8px rgba(43,36,32,0.05)', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ width:38, height:38, borderRadius:11, background:iconBg, color:iconColor,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:21, fontWeight:800, color:C.text }}>{val}</div>
        <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{label}</div>
      </div>
      {extra && <div style={{ fontSize:11, color:C.success, fontWeight:700 }}>{extra}</div>}
    </div>
  )
}

function GraficoBarras({ datos }) {
  if (datos.length === 0) {
    return (
      <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:C.textFaint, fontSize:13 }}>
        Sin datos para graficar en este período
      </div>
    )
  }
  const max = Math.max(...datos.map(d => d.total), 1)
  const W = 640, H = 180, PAD = 24
  const CELDA_MAX = 76
  const celda = Math.min(CELDA_MAX, (W - PAD * 2) / datos.length)
  const anchoUsado = celda * datos.length
  const offsetX = PAD + Math.max(0, (W - PAD * 2 - anchoUsado) / 2)
  const barW = celda * 0.55
  return (
    <svg viewBox={`0 0 ${W} ${H + 26}`} style={{ width:'100%', height:'auto', display:'block' }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD} x2={W - PAD} y1={H - H * f} y2={H - H * f} stroke={C.border} strokeWidth={1} />
      ))}
      {datos.map((d, i) => {
        const h = Math.max(3, (d.total / max) * (H - 8))
        const x = offsetX + i * celda + (celda - barW) / 2
        return (
          <g key={d.fecha}>
            <rect x={x} y={H - h} width={barW} height={h} rx={5} fill={C.gold} />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="9" fill={C.textMuted}>
              {d.etiqueta}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Ventas() {
  const [ventas, setVentas]   = useState([])
  const [stats, setStats]     = useState({ hoy_cierres:0, hoy_total:0, semana:0, mes:0 })
  const [filtro, setFiltro]   = useState('hoy')
  const [desde, setDesde]     = useState('')
  const [hasta, setHasta]     = useState('')
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [recibo, setRecibo] = useState(null)

  const verRecibo = async (ventaId) => setRecibo(await api.getRecibo(ventaId))

  const paramsActuales = () => filtro === 'rango' ? { desde, hasta } : { filtro }

  const cargar = async () => {
    if (filtro === 'rango' && (!desde || !hasta)) return
    setCargando(true)
    const [v, s] = await Promise.all([
      filtro === 'rango' ? api.getVentas('', { desde, hasta }) : api.getVentas(filtro),
      api.getVentasStats()
    ])
    setVentas(v)
    setStats(s)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [filtro, desde, hasta])

  const totalFiltro = ventas.reduce((s, v) => s + v.total, 0)

  const datosGrafico = useMemo(() => {
    const porDia = new Map()
    ventas.forEach((v) => {
      const key = new Date(v.fecha).toISOString().slice(0, 10)
      porDia.set(key, (porDia.get(key) || 0) + v.total)
    })
    return [...porDia.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({
        fecha, total,
        etiqueta: new Date(fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit' }),
      }))
  }, [ventas])

  const formatFecha = (f) => {
    const d = new Date(f)
    return d.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' })
  }
  const formatHora = (f) => {
    const d = new Date(f)
    return d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })
  }

  const exportar = async () => {
    setExportando(true)
    setMensaje('')
    try {
      await api.descargarReporteGanancias(paramsActuales())
      setMensaje('✅ Excel descargado')
    } catch (err) {
      setMensaje(`❌ ${err.message}`)
    } finally {
      setExportando(false)
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text,
      fontFamily:'Segoe UI, sans-serif' }}>

      {/* HEADER */}
      <div style={{ padding:'20px 24px 4px', display:'flex', justifyContent:'space-between',
        alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ color:C.text, fontSize:22, fontWeight:800 }}>Ventas</div>
          <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>
            El Cabuyal · Palermo — historial y reportes
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => cargar()}
            style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
              padding:'9px 14px', color:C.textMuted, cursor:'pointer', display:'flex',
              alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
            <RefreshCw size={14}/> ACTUALIZAR
          </button>
          <button onClick={exportar} disabled={exportando || ventas.length === 0}
            style={{ background: exportando || ventas.length === 0 ? C.border : C.gold, border:'none', borderRadius:8,
              padding:'10px 18px', color: exportando || ventas.length === 0 ? C.textFaint : C.header, fontWeight:800,
              fontSize:13, cursor: exportando || ventas.length === 0 ? 'not-allowed' : 'pointer',
              letterSpacing:1, display:'flex', alignItems:'center', gap:8 }}>
            <Download size={15}/> {exportando ? 'EXPORTANDO…' : 'EXPORTAR EXCEL'}
          </button>
        </div>
      </div>

      {mensaje && (
        <div style={{ background: mensaje.includes('✅') ? C.successBg : C.dangerBg,
          border:`1px solid ${mensaje.includes('✅') ? C.success : C.danger}55`,
          borderRadius:8, margin:'12px 24px 0', padding:'10px 16px',
          color: mensaje.includes('✅') ? C.success : C.danger,
          fontSize:13, fontWeight:700, textAlign:'center' }}>
          {mensaje}
        </div>
      )}

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, padding:'20px 24px 0' }}>
        <StatCard icon={<Calendar size={18}/>} iconBg={C.goldBg} iconColor={C.goldDark}
          label="Cierres hoy" val={stats.hoy_cierres} />
        <StatCard icon={<TrendingUp size={18}/>} iconBg={C.successBg} iconColor={C.success}
          label="Ventas hoy" val={`$${Number(stats.hoy_total).toLocaleString('es-CO')}`} />
        <StatCard icon={<Clock size={18}/>} iconBg={C.infoBg} iconColor={C.info}
          label="Esta semana" val={`$${Number(stats.semana).toLocaleString('es-CO')}`} />
        <StatCard icon={<FileSpreadsheet size={18}/>} iconBg={C.terracottaBg} iconColor={C.terracotta}
          label="Este mes" val={`$${Number(stats.mes).toLocaleString('es-CO')}`} />
      </div>

      {/* GRÁFICO */}
      <div style={{ margin:'20px 24px 0', background:C.surface, borderRadius:14, border:`1px solid ${C.border}`,
        padding:'18px 20px', boxShadow:'0 2px 8px rgba(43,36,32,0.05)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:800, fontSize:14 }}>Ventas por día</div>
          <div style={{ color:C.goldDark, fontWeight:800, fontSize:16 }}>${totalFiltro.toLocaleString('es-CO')}</div>
        </div>
        <GraficoBarras datos={datosGrafico} />
      </div>

      <div style={{ padding:20 }}>

        {/* Filtros + total */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {FILTROS.map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                style={{ padding:'7px 16px', borderRadius:8, fontSize:12,
                  fontWeight:700, cursor:'pointer', letterSpacing:1, transition:'all 0.15s',
                  background: filtro===f.key ? C.gold : C.surface,
                  color: filtro===f.key ? C.header : C.textMuted,
                  border:`1px solid ${filtro===f.key ? C.gold : C.border}` }}>
                {f.label}
              </button>
            ))}
            {filtro === 'rango' && (
              <div style={{ display:'flex', gap:6, alignItems:'center', marginLeft:6 }}>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                  style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
                    color:C.text, fontSize:12, padding:'6px 8px' }}/>
                <span style={{ color:C.textFaint }}>—</span>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                  style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
                    color:C.text, fontSize:12, padding:'6px 8px' }}/>
              </div>
            )}
          </div>
          <div style={{ color:C.goldDark, fontWeight:800, fontSize:14 }}>
            {ventas.length} venta(s) —
            <span style={{ fontSize:18, marginLeft:8 }}>
              ${totalFiltro.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background:C.surface, borderRadius:10,
          overflow:'hidden', border:`1px solid ${C.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bgAlt, borderBottom:`1px solid ${C.border}` }}>
                {['#', 'MESA', 'ATENDIÓ', 'FECHA', 'HORA', 'TOTAL', ''].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:C.textMuted,
                    fontWeight:800, fontSize:11, letterSpacing:1,
                    textAlign: h==='TOTAL' ? 'right' : 'center' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:C.textMuted }}>
                  Cargando...
                </td></tr>
              )}
              {!cargando && ventas.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:60, color:C.textFaint }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
                  <div>Sin ventas en este período</div>
                </td></tr>
              )}
              {!cargando && ventas.map((v, idx) => (
                <tr key={v.id}
                  style={{ borderBottom:`1px solid ${C.border}`,
                    background: idx%2===0 ? C.surface : C.surfaceAlt }}>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:C.textFaint, fontSize:12 }}>
                    {v.id}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center' }}>
                    <span style={{ background:C.goldBg, color:C.goldDark,
                      borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                      Mesa {v.mesa}
                    </span>
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:C.textMuted, fontSize:12 }}>
                    {v.mesero || '—'}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:C.textMuted, fontSize:12 }}>
                    {formatFecha(v.fecha)}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:C.textMuted, fontSize:12 }}>
                    {formatHora(v.fecha)}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'right',
                    color:C.goldDark, fontWeight:800, fontSize:14 }}>
                    ${Number(v.total).toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center' }}>
                    <button onClick={() => verRecibo(v.id)}
                      style={{ background:C.infoBg, border:'none', borderRadius:6, padding:'6px 9px',
                        color:C.info, cursor:'pointer', display:'inline-flex', alignItems:'center' }}>
                      <Receipt size={13}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recibo && <Recibo venta={recibo} onClose={() => setRecibo(null)} />}
    </div>
  )
}
