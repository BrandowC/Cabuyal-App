import { useEffect, useState } from 'react'
import { X, Search, Plus, Minus, Phone, MapPin, User, CheckCircle, XCircle, Bike } from 'lucide-react'
import logoPath from '../logoPath'
// o desde pages:
// y usarlo como:



function Temporizador({ fecha }) {
  const [elapsed, setElapsed] = useState('')
  const [alerta, setAlerta]   = useState(false)

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((new Date() - new Date(fecha)) / 1000)
      const m = Math.floor(diff / 60)
      const s = diff % 60
      setElapsed(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
      setAlerta(m >= 30)
    }
    calc()
    const iv = setInterval(calc, 1000)
    return () => clearInterval(iv)
  }, [fecha])

  return (
    <span style={{ color: alerta ? '#e53935' : '#4caf50', fontWeight:700,
      fontSize:14, fontFamily:'monospace' }}>
      ⏱ {elapsed}
    </span>
  )
}

export default function Domicilios() {
  const [domicilios, setDomicilios] = useState([])
  const [menuCompleto, setMenu]     = useState([])
  const [modalAbierto, setModal]    = useState(false)
  const [cancelModal, setCancelModal] = useState(null)

  const [form, setForm]             = useState({ nombre:'', telefono:'', direccion:'' })
  const [items, setItems]           = useState([])
  const [busqueda, setBusqueda]     = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrarDrop, setMostrarDrop] = useState(false)
  const [itemSel, setItemSel]       = useState(null)
  const [cantidad, setCantidad]     = useState(1)

  const cargar = async () => {
    if (window.api) {
      const d = await window.api.getDomicilios()
      setDomicilios(d.map(x => ({ ...x, pedido: JSON.parse(x.pedido || '[]') })))
      const m = await window.api.getMenu()
      setMenu(m)
    } else {
      setMenu([
        { id:1, nombre:'HAMBURGUESA SENCILLA', categoria:'Hamburguesas', precio:11000, disponible:1 },
        { id:2, nombre:'HAMBURGUESA CON TODO',  categoria:'Hamburguesas', precio:22500, disponible:1 },
        { id:3, nombre:'COCA COLA PERSONAL',    categoria:'Gaseosas',     precio:4000,  disponible:1 },
        { id:4, nombre:'LIMONADA DE COCO',      categoria:'Limonadas',    precio:12000, disponible:1 },
        { id:5, nombre:'COSTILLAS BBQ',         categoria:'Parrilla',     precio:22000, disponible:1 },
      ])
    }
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (busqueda.trim().length < 1) { setResultados([]); setMostrarDrop(false); return }
    const q = busqueda.toLowerCase()
    const found = menuCompleto
      .filter(p => p.disponible !== 0 &&
        (p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)))
      .slice(0, 8)
    setResultados(found)
    setMostrarDrop(found.length > 0)
  }, [busqueda, menuCompleto])

  const seleccionar = (item) => {
    setItemSel(item); setBusqueda(item.nombre); setMostrarDrop(false); setCantidad(1)
  }

  const agregarItem = () => {
    if (!itemSel) return
    setItems(prev => {
      const exist = prev.find(x => x.id === itemSel.id)
      if (exist) return prev.map(x => x.id === itemSel.id ? { ...x, cantidad: x.cantidad + cantidad } : x)
      return [...prev, { ...itemSel, cantidad }]
    })
    setBusqueda(''); setItemSel(null); setCantidad(1)
  }

  const editarCantidad = (id, delta) => {
    setItems(prev => prev
      .map(x => x.id === id ? { ...x, cantidad: x.cantidad + delta } : x)
      .filter(x => x.cantidad > 0)
    )
  }

  const total = items.reduce((s, x) => s + x.precio * x.cantidad, 0)

  const guardar = async () => {
    if (!form.nombre || !form.telefono || !form.direccion || items.length === 0) {
      alert('Complete todos los datos y agregue al menos un ítem')
      return
    }
    if (window.api) {
      await window.api.addDomicilio({
        nombre: form.nombre, telefono: form.telefono,
        direccion: form.direccion, pedido: JSON.stringify(items), total
      })
    }
    setModal(false)
    setForm({ nombre:'', telefono:'', direccion:'' })
    setItems([]); setBusqueda(''); setItemSel(null)
    cargar()
  }

  const despachar = async (id) => {
    if (window.api) await window.api.updateDomicilio({ id, estado: 'despachado' })
    cargar()
  }

  const cancelar = async (id) => {
    if (window.api) await window.api.updateDomicilio({ id, estado: 'cancelado' })
    setCancelModal(null); cargar()
  }

  return (
    <div style={{ background:'#111', minHeight:'100vh', color:'#fff',
      fontFamily:'Segoe UI, sans-serif' }}>

      {/* HEADER — igual estilo que Mesas */}
      <div style={{ background:'#000', borderBottom:'2px solid #c9a84c',
        display:'flex', alignItems:'stretch' }}>
        
        <div style={{ flex:1, padding:'10px 24px', display:'flex',
          flexDirection:'column', justifyContent:'center' }}>
          <div style={{ color:'#c9a84c', fontSize:22, fontWeight:700, letterSpacing:4 }}>
            DOMICILIOS
          </div>
          <div style={{ color:'#888', fontSize:11, letterSpacing:2, marginTop:2 }}>
            EL CABUYAL • PALERMO — {domicilios.length} activo(s)
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', padding:'0 20px' }}>
          <button onClick={() => setModal(true)}
            style={{ background:'#c9a84c', border:'none', borderRadius:8,
              padding:'10px 20px', color:'#111', fontWeight:700, fontSize:13,
              cursor:'pointer', letterSpacing:1, display:'flex', alignItems:'center', gap:8 }}>
            <Bike size={16}/> NUEVO DOMICILIO
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'#c9a84c' }}>
        {[
          { label:'ACTIVOS',    val: domicilios.length,                                              color:'#c9a84c' },
          { label:'EN CAMINO',  val: domicilios.filter(d=>d.estado==='pendiente').length,            color:'#4caf50' },
          { label:'TOTAL HOY',  val: `$${domicilios.reduce((s,d)=>s+d.total,0).toLocaleString('es-CO')}`, color:'#c9a84c' },
        ].map(s => (
          <div key={s.label} style={{ background:'#1a1a1a', padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10, color:'#888', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* LISTA */}
      <div style={{ padding:20 }}>
        {domicilios.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#333' }}>
            <div style={{ fontSize:56, marginBottom:14 }}>🛵</div>
            <div style={{ fontSize:16, color:'#555' }}>Sin domicilios activos</div>
            <div style={{ fontSize:13, color:'#333', marginTop:6 }}>
              Presiona "Nuevo domicilio" para comenzar
            </div>
          </div>
        ) : (
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:16 }}>
            {domicilios.map(d => (
              <div key={d.id} style={{ background:'#1a1a1a', border:'1px solid #c9a84c',
                borderRadius:12, overflow:'hidden' }}>

                {/* Header tarjeta */}
                <div style={{ background:'#000', borderBottom:'1px solid #c9a84c',
                  padding:'12px 16px', display:'flex',
                  justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ background:'#c9a84c', borderRadius:6, padding:'3px 10px',
                      color:'#111', fontSize:11, fontWeight:700 }}>
                      #{String(d.id).padStart(3,'0')}
                    </div>
                    <Temporizador fecha={d.fecha}/>
                  </div>
                  <div style={{ background:'#2e7d3222', border:'1px solid #2e7d32',
                    borderRadius:6, padding:'3px 10px', color:'#4caf50',
                    fontSize:10, fontWeight:700, letterSpacing:1 }}>
                    EN CAMINO
                  </div>
                </div>

                {/* Datos cliente */}
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #222' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                    <User size={14} color="#c9a84c"/>
                    <span style={{ color:'#fff', fontSize:15, fontWeight:600 }}>{d.nombre}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <Phone size={13} color="#888"/>
                    <span style={{ color:'#aaa', fontSize:13 }}>{d.telefono}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <MapPin size={13} color="#888" style={{ marginTop:2 }}/>
                    <span style={{ color:'#aaa', fontSize:13 }}>{d.direccion}</span>
                  </div>
                </div>

                {/* Pedido */}
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #222' }}>
                  <div style={{ color:'#c9a84c', fontSize:10, fontWeight:700,
                    letterSpacing:2, marginBottom:8 }}>PEDIDO</div>
                  {d.pedido.map((p, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between',
                      marginBottom:5, fontSize:13 }}>
                      <span style={{ color:'#ddd' }}>x{p.cantidad} {p.nombre}</span>
                      <span style={{ color:'#c9a84c', fontWeight:600 }}>
                        ${(p.precio * p.cantidad).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid #2a2a2a', marginTop:8, paddingTop:8,
                    display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#888', fontSize:12 }}>TOTAL</span>
                    <span style={{ color:'#c9a84c', fontWeight:700, fontSize:16 }}>
                      ${d.total.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ padding:'12px 16px', display:'flex', gap:8 }}>
                  <button onClick={() => despachar(d.id)}
                    style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none',
                      background:'#2e7d32', color:'#fff', fontWeight:700, fontSize:11,
                      cursor:'pointer', letterSpacing:1, display:'flex',
                      alignItems:'center', justifyContent:'center', gap:6 }}>
                    <CheckCircle size={13}/> DESPACHADO
                  </button>
                  <button onClick={() => setCancelModal(d.id)}
                    style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none',
                      background:'#c62828', color:'#fff', fontWeight:700, fontSize:11,
                      cursor:'pointer', letterSpacing:1, display:'flex',
                      alignItems:'center', justifyContent:'center', gap:6 }}>
                    <XCircle size={13}/> CANCELAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NUEVO DOMICILIO */}
      {modalAbierto && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'#1a1a1a', border:'1px solid #c9a84c', borderRadius:14,
            width:'100%', maxWidth:860, margin:16, overflow:'hidden',
            display:'flex', flexDirection:'column', maxHeight:'92vh' }}>

            {/* Header */}
            {/* HEADER */}
            <div style={{ background:'#000', 
              padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#c9a84c', fontSize:18, fontWeight:700, letterSpacing:2 }}>
                  🛵 DOMICILIOS
                </div>
                <div style={{ color:'#888', fontSize:11, letterSpacing:1, marginTop:2 }}>
                  EL CABUYAL • PALERMO — {domicilios.length} activo(s)
                </div>
              </div>
              <button onClick={() => setModal(true)}
                style={{ background:'#c9a84c', border:'none', borderRadius:8,
                  padding:'10px 20px', color:'#111', fontWeight:700, fontSize:13,
                  cursor:'pointer', letterSpacing:1, display:'flex', alignItems:'center', gap:8 }}>
                <Bike size={16}/> NUEVO DOMICILIO
              </button>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* IZQUIERDA */}
              <div style={{ flex:1, padding:20, overflowY:'auto',
                borderRight:'1px solid #2a2a2a', display:'flex', flexDirection:'column', gap:18 }}>

                {/* Datos cliente */}
                <div>
                  <div style={{ color:'#c9a84c', fontSize:11, fontWeight:700,
                    letterSpacing:2, marginBottom:10 }}>DATOS DEL CLIENTE</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { icon: <User size={14} color="#c9a84c"/>,  key:'nombre',    ph:'Nombre del cliente' },
                      { icon: <Phone size={14} color="#c9a84c"/>, key:'telefono',  ph:'Número de teléfono' },
                      { icon: <MapPin size={14} color="#c9a84c"/>,key:'direccion', ph:'Dirección de entrega' },
                    ].map(f => (
                      <div key={f.key} style={{ display:'flex', alignItems:'center', gap:10,
                        background:'#111', border:'1px solid #333', borderRadius:8,
                        padding:'0 12px', transition:'border-color 0.15s' }}>
                        {f.icon}
                        <input value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                          placeholder={f.ph}
                          style={{ flex:1, background:'transparent', border:'none', outline:'none',
                            color:'#fff', fontSize:13, padding:'11px 0' }}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buscador */}
                <div>
                  <div style={{ color:'#c9a84c', fontSize:11, fontWeight:700,
                    letterSpacing:2, marginBottom:10 }}>AGREGAR ÍTEMS</div>
                  <div style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', background:'#111',
                      border:'1px solid #c9a84c', borderRadius:8, padding:'0 12px' }}>
                      <Search size={15} color="#c9a84c"/>
                      <input value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        onFocus={() => resultados.length > 0 && setMostrarDrop(true)}
                        placeholder="Buscar plato o bebida..."
                        style={{ flex:1, background:'transparent', border:'none', outline:'none',
                          color:'#fff', fontSize:13, padding:'11px 10px' }}/>
                      {busqueda && (
                        <button onClick={() => { setBusqueda(''); setItemSel(null); setMostrarDrop(false) }}
                          style={{ background:'transparent', border:'none', color:'#666', cursor:'pointer' }}>
                          <X size={14}/>
                        </button>
                      )}
                    </div>

                    {/* Dropdown */}
                    {mostrarDrop && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0,
                        background:'#222', border:'1px solid #c9a84c', borderRadius:8,
                        zIndex:100, marginTop:4, maxHeight:260, overflowY:'auto' }}>
                        {resultados.map(r => (
                          <button key={r.id} onClick={() => seleccionar(r)}
                            style={{ width:'100%', background:'transparent', border:'none',
                              borderBottom:'1px solid #2a2a2a', padding:'10px 14px',
                              display:'flex', justifyContent:'space-between',
                              alignItems:'center', cursor:'pointer', textAlign:'left' }}
                            onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <div>
                              <div style={{ color:'#fff', fontSize:13 }}>{r.nombre}</div>
                              <div style={{ color:'#888', fontSize:11 }}>{r.categoria}</div>
                            </div>
                            <div style={{ color:'#c9a84c', fontWeight:700, fontSize:13 }}>
                              ${r.precio.toLocaleString('es-CO')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item seleccionado */}
                  {itemSel && (
                    <div style={{ marginTop:10, background:'#111', border:'1px solid #c9a84c',
                      borderRadius:8, padding:'10px 14px', display:'flex',
                      alignItems:'center', gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'#fff', fontSize:13, fontWeight:500 }}>{itemSel.nombre}</div>
                        <div style={{ color:'#c9a84c', fontSize:12 }}>
                          ${itemSel.precio.toLocaleString('es-CO')} c/u
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button onClick={() => setCantidad(c => Math.max(1, c-1))}
                          style={{ width:28, height:28, borderRadius:6, border:'1px solid #444',
                            background:'#222', color:'#fff', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Minus size={12}/>
                        </button>
                        <span style={{ color:'#fff', fontWeight:700, minWidth:24, textAlign:'center' }}>
                          {cantidad}
                        </span>
                        <button onClick={() => setCantidad(c => c+1)}
                          style={{ width:28, height:28, borderRadius:6, border:'1px solid #444',
                            background:'#222', color:'#fff', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Plus size={12}/>
                        </button>
                      </div>
                      <button onClick={agregarItem}
                        style={{ background:'#c9a84c', border:'none', borderRadius:8,
                          padding:'8px 16px', color:'#111', fontWeight:700,
                          fontSize:12, cursor:'pointer' }}>
                        + AGREGAR
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista de ítems */}
                {items.length > 0 && (
                  <div>
                    <div style={{ color:'#c9a84c', fontSize:11, fontWeight:700,
                      letterSpacing:2, marginBottom:8 }}>ÍTEMS DEL PEDIDO</div>
                    {items.map(item => (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8,
                        padding:'8px 0', borderBottom:'1px solid #222' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ color:'#ddd', fontSize:13 }}>{item.nombre}</div>
                          <div style={{ color:'#c9a84c', fontSize:11 }}>
                            ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <button onClick={() => editarCantidad(item.id, -1)}
                            style={{ width:24, height:24, borderRadius:5, border:'1px solid #444',
                              background:'#222', color:'#fff', cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Minus size={10}/>
                          </button>
                          <span style={{ color:'#fff', fontWeight:700, minWidth:22,
                            textAlign:'center', fontSize:13 }}>{item.cantidad}</span>
                          <button onClick={() => editarCantidad(item.id, 1)}
                            style={{ width:24, height:24, borderRadius:5, border:'1px solid #444',
                              background:'#222', color:'#fff', cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Plus size={10}/>
                          </button>
                        </div>
                        <button onClick={() => editarCantidad(item.id, -item.cantidad)}
                          style={{ background:'transparent', border:'none', color:'#555',
                            cursor:'pointer', padding:4 }}
                          onMouseEnter={e => e.currentTarget.style.color='#e53935'}
                          onMouseLeave={e => e.currentTarget.style.color='#555'}>
                          <X size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DERECHA — resumen */}
              <div style={{ width:230, padding:18, background:'#111',
                display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ color:'#c9a84c', fontSize:11, fontWeight:700, letterSpacing:2 }}>
                  RESUMEN
                </div>

                <div style={{ background:'#1a1a1a', borderRadius:8, padding:12,
                  border:'1px solid #222', flex:1, overflowY:'auto' }}>
                  {items.length === 0
                    ? <div style={{ color:'#444', fontSize:12, textAlign:'center', padding:'20px 0' }}>
                        Sin ítems aún
                      </div>
                    : items.map(x => (
                      <div key={x.id} style={{ display:'flex', justifyContent:'space-between',
                        marginBottom:6, fontSize:12, gap:8 }}>
                        <span style={{ color:'#aaa' }}>x{x.cantidad} {x.nombre}</span>
                        <span style={{ color:'#c9a84c', whiteSpace:'nowrap' }}>
                          ${(x.precio * x.cantidad).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))
                  }
                </div>

                <div style={{ background:'#000', borderRadius:8, padding:14,
                  border:'1px solid #c9a84c', textAlign:'center' }}>
                  <div style={{ color:'#888', fontSize:10, letterSpacing:2, marginBottom:4 }}>TOTAL</div>
                  <div style={{ color:'#c9a84c', fontSize:26, fontWeight:700 }}>
                    ${total.toLocaleString('es-CO')}
                  </div>
                  <div style={{ color:'#555', fontSize:10, marginTop:4 }}>
                    {items.reduce((s,x) => s+x.cantidad, 0)} ítem(s)
                  </div>
                </div>

                <button onClick={guardar}
                  style={{ width:'100%', padding:'13px 0', borderRadius:8, border:'none',
                    background: items.length > 0 && form.nombre ? '#c9a84c' : '#333',
                    color: items.length > 0 && form.nombre ? '#111' : '#666',
                    fontWeight:700, fontSize:13, cursor:'pointer', letterSpacing:1,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    transition:'all 0.2s' }}>
                  <Bike size={15}/> GUARDAR DOMICILIO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR */}
      {cancelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div style={{ background:'#1a1a1a', border:'1px solid #c62828', borderRadius:12,
            padding:28, maxWidth:360, width:'100%', margin:16, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ color:'#fff', fontSize:16, fontWeight:700, marginBottom:8 }}>
              ¿Cancelar domicilio?
            </div>
            <div style={{ color:'#888', fontSize:13, marginBottom:24 }}>
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setCancelModal(null)}
                style={{ flex:1, padding:'11px 0', borderRadius:8, border:'1px solid #444',
                  background:'transparent', color:'#fff', cursor:'pointer', fontWeight:600 }}>
                VOLVER
              </button>
              <button onClick={() => cancelar(cancelModal)}
                style={{ flex:1, padding:'11px 0', borderRadius:8, border:'none',
                  background:'#c62828', color:'#fff', cursor:'pointer', fontWeight:700 }}>
                SÍ, CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}