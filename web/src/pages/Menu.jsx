import { useEffect, useState } from 'react'
import { Pencil, Trash2, X, Download } from 'lucide-react'
import api from '../lib/api'
import { C } from '../theme'

const CATEGORIAS = [
  'Parrilla', 'Pollo', 'Lasagna', 'Rápidos',
  'Hamburguesas', 'Adiciones', 'Salsas',
  'Bebidas', 'Limonadas', 'Malteadas',
  'Jarras', 'Gaseosas', 'Cervezas'
]

const EMPTY = { nombre: '', categoria: 'Parrilla', precio: '', descripcion: '', disponible: 1, stock: '', imagenUrl: '' }

export default function Menu() {
  const [platos, setPlatos] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [exportando, setExportando] = useState(false)

  const cargar = async () => {
    const data = await api.getMenu()
    setPlatos(data)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.nombre || !form.precio) return
    const payload = {
      ...form,
      stock: form.stock === '' ? null : Number(form.stock),
      imagenUrl: form.imagenUrl?.trim() ? form.imagenUrl.trim() : null,
    }
    if (editando) await api.updatePlato({ ...payload, id: editando })
    else await api.addPlato(payload)
    setModal(false)
    cargar()
  }

  const exportarStock = async () => {
    setExportando(true)
    try {
      await api.descargarReporteStock()
    } finally {
      setExportando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este plato?')) return
    await api.deletePlato(id)
    setPlatos(prev => prev.filter(p => p.id !== id))
  }

  const toggleDisponible = async (p) => {
    const updated = { ...p, disponible: !p.disponible }
    await api.updatePlato(updated)
    setPlatos(prev => prev.map(x => x.id === p.id ? updated : x))
  }

  const filtrados = platos.filter(p => {
    const porCategoria = filtro === 'Todos' || p.categoria === filtro
    const porBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return porCategoria && porBusqueda
  })

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text, fontFamily:'Segoe UI,sans-serif', padding:24 }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ color:C.goldDark, fontSize:20, fontWeight:800, letterSpacing:2 }}>MENÚ</div>
          <div style={{ color:C.textMuted, fontSize:12 }}>{platos.length} platos registrados</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportarStock} disabled={exportando}
            style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 16px',
              color:C.textMuted, fontWeight:700, fontSize:12, cursor: exportando ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', gap:6 }}>
            <Download size={14}/> {exportando ? 'EXPORTANDO…' : 'EXPORTAR STOCK'}
          </button>
          <button onClick={() => { setForm(EMPTY); setEditando(null); setModal(true) }}
            style={{ background:C.gold, border:'none', borderRadius:8, padding:'10px 18px',
              color:C.header, fontWeight:800, fontSize:13, cursor:'pointer' }}>
            + NUEVO PLATO
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {['Todos',...CATEGORIAS].map(c => (
          <button key={c} onClick={() => setFiltro(c)}
            style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
              background: filtro===c ? C.gold : C.surface,
              color: filtro===c ? C.header : C.textMuted,
              border: `1px solid ${filtro===c ? C.gold : C.border}` }}>
            {c}
          </button>
        ))}
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          style={{ marginLeft:'auto', padding:'5px 12px', borderRadius:6, fontSize:12,
            background:C.surface, border:`1px solid ${C.border}`, color:C.text, outline:'none' }}/>
      </div>

      {/* Tabla */}
      <div style={{ background:C.surface, borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:C.header, borderBottom:`1px solid ${C.gold}55` }}>
              {['Plato','Categoría','Precio','Stock','Estado','Acciones'].map(h => (
                <th key={h} style={{ padding:'12px 16px', color:C.gold, fontWeight:700,
                  textAlign: h==='Plato'||h==='Categoría' ? 'left' : 'center', fontSize:11, letterSpacing:1 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:C.textFaint }}>Sin platos</td></tr>
            )}
            {filtrados.map(p => (
              <tr key={p.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                <td style={{ padding:'11px 16px', color:C.text }}>{p.nombre}</td>
                <td style={{ padding:'11px 16px' }}>
                  <span style={{ background:C.goldBg, color:C.goldDark, borderRadius:5,
                    padding:'3px 8px', fontSize:11, fontWeight:700 }}>{p.categoria}</span>
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center', color:C.goldDark, fontWeight:800 }}>
                  ${Number(p.precio).toLocaleString('es-CO')}
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center', color: p.stock !== null && p.stock <= 5 ? C.danger : C.textMuted, fontSize:12 }}>
                  {p.stock === null ? 'Ilimitado' : p.stock}
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <button onClick={() => toggleDisponible(p)}
                    style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                      background: p.disponible ? C.successBg : C.dangerBg,
                      color: p.disponible ? C.success : C.danger }}>
                    {p.disponible ? '● Disponible' : '○ No disponible'}
                  </button>
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                    <button onClick={() => { setForm({...p}); setEditando(p.id); setModal(true) }}
                      style={{ background:C.infoBg, border:'none', borderRadius:6, padding:'5px 8px',
                        color:C.info, cursor:'pointer' }}>
                      <Pencil size={13}/>
                    </button>
                    <button onClick={() => eliminar(p.id)}
                      style={{ background:C.dangerBg, border:'none', borderRadius:6, padding:'5px 8px',
                        color:C.danger, cursor:'pointer' }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.gold}`, borderRadius:12,
            width:'100%', maxWidth:440, margin:16, overflow:'hidden' }}>
            <div style={{ background:C.header, padding:'14px 18px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:C.gold, fontWeight:800, letterSpacing:1 }}>
                {editando ? 'EDITAR PLATO' : 'NUEVO PLATO'}
              </div>
              <button onClick={() => setModal(false)}
                style={{ background:'transparent', border:'none', color:C.gold, cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Nombre *', key:'nombre', type:'text', ph:'Ej: Bandeja paisa' },
                { label:'Precio *', key:'precio', type:'number', ph:'Ej: 25000' },
                { label:'Descripción', key:'descripcion', type:'text', ph:'Descripción corta' },
                { label:'Stock (vacío = ilimitado)', key:'stock', type:'number', ph:'Ej: 20' },
                { label:'URL de imagen', key:'imagenUrl', type:'text', ph:'https://...' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key] ?? ''}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.ph}
                    style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                      color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
                </div>
              ))}
              <div>
                <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>Categoría *</div>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                    color:C.text, fontSize:13, padding:'9px 12px', outline:'none' }}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, padding:'0 18px 18px' }}>
              <button onClick={() => setModal(false)}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:`1px solid ${C.border}`,
                  background:'transparent', color:C.textMuted, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none',
                  background:C.gold, color:C.header, fontWeight:800, cursor:'pointer' }}>
                {editando ? 'GUARDAR' : 'AGREGAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
