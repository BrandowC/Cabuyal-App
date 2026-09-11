import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const CATEGORIAS = [
  'Parrilla', 'Pollo', 'Lasagna', 'Rápidos',
  'Hamburguesas', 'Adiciones', 'Salsas',
  'Bebidas', 'Limonadas', 'Malteadas',
  'Jarras', 'Gaseosas', 'Cervezas'
]

const EMPTY = { nombre: '', categoria: 'Parrilla', precio: '', descripcion: '', disponible: 1 }

export default function Menu() {
  const [platos, setPlatos] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const cargar = async () => {
    if (window.api) {
      const data = await window.api.getMenu()
      setPlatos(data)
    }
  }

  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.nombre || !form.precio) return
    if (window.api) {
      if (editando) await window.api.updatePlato({ ...form, id: editando })
      else await window.api.addPlato(form)
    }
    setModal(false)
    cargar()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este plato?')) return
    if (window.api) await window.api.deletePlato(id)
    setPlatos(prev => prev.filter(p => p.id !== id))
  }

  const toggleDisponible = async (p) => {
    const updated = { ...p, disponible: p.disponible ? 0 : 1 }
    if (window.api) await window.api.updatePlato(updated)
    setPlatos(prev => prev.map(x => x.id === p.id ? updated : x))
  }

  const filtrados = platos.filter(p => {
    const porCategoria = filtro === 'Todos' || p.categoria === filtro
    const porBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return porCategoria && porBusqueda
  })

  return (
    <div style={{ background:'#111', minHeight:'100vh', color:'#fff', fontFamily:'Segoe UI,sans-serif', padding:24 }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ color:'#c9a84c', fontSize:20, fontWeight:700, letterSpacing:2 }}>MENÚ</div>
          <div style={{ color:'#888', fontSize:12 }}>{platos.length} platos registrados</div>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditando(null); setModal(true) }}
          style={{ background:'#c9a84c', border:'none', borderRadius:8, padding:'10px 18px',
            color:'#111', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + NUEVO PLATO
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {['Todos',...CATEGORIAS].map(c => (
          <button key={c} onClick={() => setFiltro(c)}
            style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
              background: filtro===c ? '#c9a84c' : '#1a1a1a',
              color: filtro===c ? '#111' : '#888',
              border: `1px solid ${filtro===c ? '#c9a84c' : '#333'}` }}>
            {c}
          </button>
        ))}
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          style={{ marginLeft:'auto', padding:'5px 12px', borderRadius:6, fontSize:12,
            background:'#1a1a1a', border:'1px solid #333', color:'#fff', outline:'none' }}/>
      </div>

      {/* Tabla */}
      <div style={{ background:'#1a1a1a', borderRadius:10, overflow:'hidden', border:'1px solid #2a2a2a' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#000', borderBottom:'1px solid #c9a84c33' }}>
              {['Plato','Categoría','Precio','Estado','Acciones'].map(h => (
                <th key={h} style={{ padding:'12px 16px', color:'#c9a84c', fontWeight:600,
                  textAlign: h==='Precio'||h==='Acciones' ? 'center' : 'left', fontSize:11, letterSpacing:1 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#444' }}>Sin platos</td></tr>
            )}
            {filtrados.map(p => (
              <tr key={p.id} style={{ borderBottom:'1px solid #222' }}>
                <td style={{ padding:'11px 16px', color:'#ddd' }}>{p.nombre}</td>
                <td style={{ padding:'11px 16px' }}>
                  <span style={{ background:'#c9a84c22', color:'#c9a84c', borderRadius:5,
                    padding:'3px 8px', fontSize:11, fontWeight:600 }}>{p.categoria}</span>
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center', color:'#c9a84c', fontWeight:700 }}>
                  ${Number(p.precio).toLocaleString('es-CO')}
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <button onClick={() => toggleDisponible(p)}
                    style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                      background: p.disponible ? '#2e7d3233' : '#c6282833',
                      color: p.disponible ? '#4caf50' : '#e53935' }}>
                    {p.disponible ? '● Disponible' : '○ No disponible'}
                  </button>
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                    <button onClick={() => { setForm({...p}); setEditando(p.id); setModal(true) }}
                      style={{ background:'#1565c033', border:'none', borderRadius:6, padding:'5px 8px',
                        color:'#42a5f5', cursor:'pointer' }}>
                      <Pencil size={13}/>
                    </button>
                    <button onClick={() => eliminar(p.id)}
                      style={{ background:'#c6282833', border:'none', borderRadius:6, padding:'5px 8px',
                        color:'#e53935', cursor:'pointer' }}>
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'#1a1a1a', border:'1px solid #c9a84c', borderRadius:12,
            width:'100%', maxWidth:440, margin:16, overflow:'hidden' }}>
            <div style={{ background:'#000', borderBottom:'1px solid #c9a84c', padding:'14px 18px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:'#c9a84c', fontWeight:700, letterSpacing:1 }}>
                {editando ? 'EDITAR PLATO' : 'NUEVO PLATO'}
              </div>
              <button onClick={() => setModal(false)}
                style={{ background:'transparent', border:'none', color:'#c9a84c', cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Nombre *', key:'nombre', type:'text', ph:'Ej: Bandeja paisa' },
                { label:'Precio *', key:'precio', type:'number', ph:'Ej: 25000' },
                { label:'Descripción', key:'descripcion', type:'text', ph:'Descripción corta' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ color:'#888', fontSize:11, marginBottom:5 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.ph}
                    style={{ width:'100%', background:'#111', border:'1px solid #333', borderRadius:7,
                      color:'#fff', fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
                </div>
              ))}
              <div>
                <div style={{ color:'#888', fontSize:11, marginBottom:5 }}>Categoría *</div>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                  style={{ width:'100%', background:'#111', border:'1px solid #333', borderRadius:7,
                    color:'#fff', fontSize:13, padding:'9px 12px', outline:'none' }}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, padding:'0 18px 18px' }}>
              <button onClick={() => setModal(false)}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:'1px solid #333',
                  background:'transparent', color:'#888', cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none',
                  background:'#c9a84c', color:'#111', fontWeight:700, cursor:'pointer' }}>
                {editando ? 'GUARDAR' : 'AGREGAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}