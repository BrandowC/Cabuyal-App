import { useEffect, useState } from 'react'
import { FileSpreadsheet, TrendingUp, Calendar, Clock, Download, RefreshCw } from 'lucide-react'
import logoPath from '../logoPath'



const FILTROS = [
  { key:'hoy',    label:'HOY' },
  { key:'semana', label:'ESTA SEMANA' },
  { key:'mes',    label:'ESTE MES' },
]

export default function Ventas() {
  const [ventas, setVentas]   = useState([])
  const [stats, setStats]     = useState({ hoy_cierres:0, hoy_total:0, semana:0, mes:0 })
  const [filtro, setFiltro]   = useState('hoy')
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargar = async (f = filtro) => {
    setCargando(true)
    if (window.api) {
      const [v, s] = await Promise.all([
        window.api.getVentas(f),
        window.api.getVentasStats()
      ])
      setVentas(v)
      setStats(s)
    } else {
      setVentas([
        { id:1, mesa:3, total:79500, mesero:'', fecha:'2025-05-23 19:30:00' },
        { id:2, mesa:7, total:45000, mesero:'', fecha:'2025-05-23 20:15:00' },
        { id:3, mesa:1, total:32000, mesero:'', fecha:'2025-05-23 21:00:00' },
      ])
      setStats({ hoy_cierres:3, hoy_total:156500, semana:890000, mes:3450000 })
    }
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const cambiarFiltro = (f) => { setFiltro(f); cargar(f) }

  const exportar = async () => {
    setExportando(true)
    setMensaje('')
    if (window.api) {
      const res = await window.api.exportarExcel(filtro)
      if (res.ok) setMensaje('✅ Excel guardado correctamente')
      else setMensaje('❌ Exportación cancelada')
    } else {
      setMensaje('⚠️ Disponible solo en la app de escritorio')
    }
    setExportando(false)
    setTimeout(() => setMensaje(''), 4000)
  }

  const totalFiltro = ventas.reduce((s, v) => s + v.total, 0)

  const formatFecha = (f) => {
    const d = new Date(f)
    return d.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' })
  }
  const formatHora = (f) => {
    const d = new Date(f)
    return d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div style={{ background:'#111', minHeight:'100vh', color:'#fff',
      fontFamily:'Segoe UI, sans-serif' }}>

      {/* HEADER */}
      <div style={{ background:'#000', borderBottom:'2px solid #c9a84c',
        display:'flex', alignItems:'stretch' }}>
        <div style={{ flex:1, padding:'10px 24px', display:'flex',
          flexDirection:'column', justifyContent:'center' }}>
          <div style={{ color:'#c9a84c', fontSize:22, fontWeight:700, letterSpacing:4 }}>VENTAS</div>
          <div style={{ color:'#888', fontSize:11, letterSpacing:2, marginTop:2 }}>
            EL CABUYAL • PALERMO — HISTORIAL Y REPORTES
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 20px' }}>
          <button onClick={() => cargar()}
            style={{ background:'transparent', border:'1px solid #444', borderRadius:8,
              padding:'8px 14px', color:'#888', cursor:'pointer', display:'flex',
              alignItems:'center', gap:6, fontSize:12 }}>
            <RefreshCw size={14}/> ACTUALIZAR
          </button>
          <button onClick={exportar} disabled={exportando}
            style={{ background: exportando ? '#333' : '#c9a84c', border:'none', borderRadius:8,
              padding:'10px 18px', color: exportando ? '#666' : '#111', fontWeight:700,
              fontSize:13, cursor: exportando ? 'not-allowed' : 'pointer',
              letterSpacing:1, display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }}>
            <Download size={15}/>
            {exportando ? 'EXPORTANDO...' : 'EXPORTAR EXCEL'}
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{ background: mensaje.includes('✅') ? '#2e7d3233' : '#c6282833',
          border:`1px solid ${mensaje.includes('✅') ? '#2e7d32' : '#c62828'}`,
          borderRadius:8, margin:'12px 20px', padding:'10px 16px',
          color: mensaje.includes('✅') ? '#4caf50' : '#e53935',
          fontSize:13, fontWeight:600, textAlign:'center' }}>
          {mensaje}
        </div>
      )}

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'#c9a84c' }}>
        {[
          { label:'CIERRES HOY',   val: stats.hoy_cierres,                                          color:'#c9a84c',  icon:<Calendar size={16}/> },
          { label:'VENTAS HOY',    val: `$${Number(stats.hoy_total).toLocaleString('es-CO')}`,       color:'#4caf50',  icon:<TrendingUp size={16}/> },
          { label:'ESTA SEMANA',   val: `$${Number(stats.semana).toLocaleString('es-CO')}`,          color:'#42a5f5',  icon:<Clock size={16}/> },
          { label:'ESTE MES',      val: `$${Number(stats.mes).toLocaleString('es-CO')}`,             color:'#c9a84c',  icon:<FileSpreadsheet size={16}/> },
        ].map(s => (
          <div key={s.label} style={{ background:'#1a1a1a', padding:'12px 16px', textAlign:'center' }}>
            <div style={{ color:'#555', marginBottom:4, display:'flex',
              justifyContent:'center' }}>{s.icon}</div>
            <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10, color:'#888', letterSpacing:1, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:20 }}>

        {/* Filtros + total */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', gap:6 }}>
            {FILTROS.map(f => (
              <button key={f.key} onClick={() => cambiarFiltro(f.key)}
                style={{ padding:'7px 16px', borderRadius:8, fontSize:12,
                  fontWeight:700, cursor:'pointer', letterSpacing:1, transition:'all 0.15s',
                  background: filtro===f.key ? '#c9a84c' : '#1a1a1a',
                  color: filtro===f.key ? '#111' : '#888',
                  border:`1px solid ${filtro===f.key ? '#c9a84c' : '#333'}` }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ color:'#c9a84c', fontWeight:700, fontSize:14 }}>
            {ventas.length} venta(s) —
            <span style={{ fontSize:18, marginLeft:8 }}>
              ${totalFiltro.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background:'#1a1a1a', borderRadius:10,
          overflow:'hidden', border:'1px solid #2a2a2a' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#000', borderBottom:'1px solid #c9a84c44' }}>
                {['#', 'MESA', 'FECHA', 'HORA', 'TOTAL'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:'#c9a84c',
                    fontWeight:700, fontSize:11, letterSpacing:1,
                    textAlign: h==='TOTAL' ? 'right' : 'center' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#555' }}>
                  Cargando...
                </td></tr>
              )}
              {!cargando && ventas.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:60, color:'#444' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
                  <div>Sin ventas en este período</div>
                </td></tr>
              )}
              {!cargando && ventas.map((v, idx) => (
                <tr key={v.id}
                  style={{ borderBottom:'1px solid #222',
                    background: idx%2===0 ? '#1a1a1a' : '#161616' }}>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:'#555', fontSize:12 }}>
                    {v.id}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center' }}>
                    <span style={{ background:'#c9a84c22', color:'#c9a84c',
                      borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                      Mesa {v.mesa}
                    </span>
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:'#aaa', fontSize:12 }}>
                    {formatFecha(v.fecha)}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'center', color:'#888', fontSize:12 }}>
                    {formatHora(v.fecha)}
                  </td>
                  <td style={{ padding:'11px 16px', textAlign:'right',
                    color:'#c9a84c', fontWeight:700, fontSize:14 }}>
                    ${Number(v.total).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nota de impresión */}
        {ventas.length > 0 && (
          <div style={{ marginTop:14, padding:'10px 16px', background:'#1a1a1a',
            borderRadius:8, border:'1px solid #2a2a2a',
            display:'flex', alignItems:'center', gap:10 }}>
            <FileSpreadsheet size={16} color="#c9a84c"/>
            <span style={{ color:'#888', fontSize:12 }}>
              Exporta el Excel y ábrelo en cualquier PC para imprimir.
              Compatible con Excel, LibreOffice y Google Sheets.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}