import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, CalendarDays } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { C } from '../theme'

const EMPTY = { nombre: '', descripcion: '', precio: '' }

export default function MenuDia() {
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const cargar = async () => setItems(await api.getMenuDia())
  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const onCambio = () => cargar()
    socket.on('menu-dia:cambio', onCambio)
    return () => socket.off('menu-dia:cambio', onCambio)
  }, [])

  const guardar = async () => {
    if (!form.nombre || !form.precio) return
    const payload = { nombre: form.nombre, descripcion: form.descripcion, precio: Number(form.precio) }
    if (editando) await api.updateMenuDia({ id: editando, ...payload })
    else await api.addMenuDia(payload)
    setModal(false)
    cargar()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Quitar este plato del menú del día?')) return
    await api.deleteMenuDia(id)
    cargar()
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text, fontFamily:'Segoe UI,sans-serif', padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div>
          <div style={{ color:C.goldDark, fontSize:20, fontWeight:800, letterSpacing:2, display:'flex', alignItems:'center', gap:8 }}>
            <CalendarDays size={20}/> MENÚ DEL DÍA
          </div>
          <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>
            {items.length} plato(s) de hoy — se ofrece junto a la carta al tomar el pedido de una mesa
          </div>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditando(null); setModal(true) }}
          style={{ background:C.gold, border:'none', borderRadius:8, padding:'10px 18px',
            color:C.header, fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <Plus size={15}/> AGREGAR PLATO
        </button>
      </div>

      {items.length >= 6 && (
        <div style={{ background:C.goldBg, color:C.goldDark, borderRadius:8, padding:'8px 14px', fontSize:12, marginTop:10 }}>
          Ya tienes {items.length} platos en el menú del día — lo usual son 4 o 5 para que el mesero elija rápido.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:14, marginTop:20 }}>
        {items.map(item => (
          <div key={item.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
            padding:16, display:'flex', flexDirection:'column', gap:8, boxShadow:'0 2px 8px rgba(43,36,32,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontWeight:800, fontSize:14 }}>{item.nombre}</div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => { setForm({ nombre:item.nombre, descripcion:item.descripcion, precio:item.precio }); setEditando(item.id); setModal(true) }}
                  style={{ background:C.infoBg, border:'none', borderRadius:6, padding:'5px 7px', color:C.info, cursor:'pointer' }}>
                  <Pencil size={12}/>
                </button>
                <button onClick={() => eliminar(item.id)}
                  style={{ background:C.dangerBg, border:'none', borderRadius:6, padding:'5px 7px', color:C.danger, cursor:'pointer' }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
            {item.descripcion && <div style={{ color:C.textMuted, fontSize:12 }}>{item.descripcion}</div>}
            <div style={{ color:C.goldDark, fontWeight:800, fontSize:15 }}>${Number(item.precio).toLocaleString('es-CO')}</div>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'50px 0', color:C.textFaint }}>
            Aún no has armado el menú del día. Presiona "Agregar plato" para empezar.
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.gold}`, borderRadius:12,
            width:'100%', maxWidth:420, margin:16, overflow:'hidden' }}>
            <div style={{ background:C.header, padding:'14px 18px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:C.gold, fontWeight:800, letterSpacing:1 }}>
                {editando ? 'EDITAR PLATO DEL DÍA' : 'NUEVO PLATO DEL DÍA'}
              </div>
              <button onClick={() => setModal(false)}
                style={{ background:'transparent', border:'none', color:C.gold, cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>Nombre *</div>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Sopa de guineo + bandeja + jugo"
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                    color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
              </div>
              <div>
                <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>Descripción</div>
                <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Incluye, sopa, principio, jugo y postre"
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                    color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
              </div>
              <div>
                <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>Precio *</div>
                <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                  placeholder="Ej: 15000"
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                    color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
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
