import { useEffect, useState } from 'react'
import { X, Search, Plus, Minus, Trash2, CreditCard, Save, Pencil, Check } from 'lucide-react'

const ZONAS = [
  { nombre: 'CASA',         icono: '', mesas: [1,2,3,4,5,6,7] },
  { nombre: 'SALÓN 1',      icono: '', mesas: [8,9,10] },
  { nombre: 'SALÓN MADERA', icono: '', mesas: [11,12] },
  { nombre: 'SALÓN 2',      icono: '', mesas: [13,14,15,16,17] },
  { nombre: 'SOMBRILLA 1',  icono: '', mesas: [18] },
  { nombre: 'SOMBRILLA 2',  icono: '', mesas: [19] },
]

const STATUS = {
  libre:   { bar: '#2e7d32', text: 'LIBRE',   card: '#c9a84c', glow: '#c9a84c33' },
  ocupada: { bar: '#c62828', text: 'OCUPADA', card: '#b8860b', glow: '#c6282833' },
  cuenta:  { bar: '#6a1b9a', text: 'CUENTA',  card: '#7b1fa2', glow: '#6a1b9a33' },
}

const CATS_BEBIDAS = ['Bebidas','Limonadas','Malteadas','Jarras','Gaseosas','Cervezas']

export default function Mesas() {
  const [mesas, setMesas]             = useState([])
  const [mesaSel, setMesaSel]         = useState(null)
  const [modalAbierto, setModal]      = useState(false)
  const [pedidos, setPedidos]         = useState([])
  const [menuCompleto, setMenu]       = useState([])
  const [ventasHoy, setVentasHoy]     = useState(0)
  const [busqueda, setBusqueda]       = useState('')
  const [resultados, setResultados]   = useState([])
  const [cantidadSel, setCantidad]    = useState(1)
  const [itemSel, setItemSel]         = useState(null)
  const [mostrarDrop, setMostrarDrop] = useState(false)
  const [editandoId, setEditandoId]   = useState(null)
  const [editCantidad, setEditCant]   = useState(1)

  const cargar = async () => {
    if (window.api) {
      const data = await window.api.getMesas()
      setMesas(data)
      const m = await window.api.getMenu()
      setMenu(m)
      const ventas = await window.api.getVentas('hoy')
      setVentasHoy(ventas.reduce((s, v) => s + v.total, 0))
    } else {
      setMesas(Array.from({length:19},(_,i)=>({id:i+1,numero:i+1,estado:'libre',zona:'',mesero:''})))
    }
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (busqueda.trim().length < 1) { setResultados([]); setMostrarDrop(false); return }
    if (itemSel) return
    const q = busqueda.toLowerCase()
    const found = menuCompleto.filter(p =>
      p.disponible !== 0 &&
      (p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q))
    ).slice(0, 8)
    setResultados(found)
    setMostrarDrop(found.length > 0)
  }, [busqueda, menuCompleto, itemSel])

  const agregarPedido = async () => {
    if (!itemSel || !mesaSel) return
    if (window.api) {
      await window.api.addPedido({
        mesa_id: mesaSel.id,
        menu_id: itemSel.id,
        nombre_plato: itemSel.nombre,
        categoria: itemSel.categoria,
        precio: itemSel.precio,
        cantidad: cantidadSel,
        notas: ''
      })
      const p = await window.api.getPedidosByMesa(mesaSel.id)
      setPedidos(p)
      if (mesaSel.estado === 'libre') {
        await window.api.updateMesa({ id: mesaSel.id, estado: 'ocupada', mesero: '' })
        setMesaSel(prev => ({...prev, estado:'ocupada'}))
      }
    } else {
      setPedidos(prev => [...prev, {
        id: Date.now(), nombre_plato: itemSel.nombre,
        precio: itemSel.precio, cantidad: cantidadSel, categoria: itemSel.categoria
      }])
    }
    setBusqueda(''); setItemSel(null); setCantidad(1)
    cargar()
  }

  const eliminarPedido = async (id) => {
    if (window.api) {
      await window.api.updatePedido({ id, estado: 'cerrado' })
      const p = await window.api.getPedidosByMesa(mesaSel.id)
      setPedidos(p)
    } else setPedidos(prev => prev.filter(p => p.id !== id))
    setEditandoId(null)
  }

  const guardarEdicion = async (p) => {
    if (editCantidad < 1) { eliminarPedido(p.id); return }
    if (window.api) {
      await window.api.updatePedido({ id: p.id, estado: 'cerrado' })
      await window.api.addPedido({
        mesa_id: mesaSel.id, menu_id: p.menu_id || 0,
        nombre_plato: p.nombre_plato, categoria: p.categoria || '',
        precio: p.precio, cantidad: editCantidad, notas: p.notas || ''
      })
      const updated = await window.api.getPedidosByMesa(mesaSel.id)
      setPedidos(updated)
    } else {
      setPedidos(prev => prev.map(x => x.id === p.id ? {...x, cantidad: editCantidad} : x))
    }
    setEditandoId(null)
  }

  const abrirMesa = async (mesa) => {
    setMesaSel(mesa)
    setBusqueda(''); setItemSel(null); setCantidad(1); setEditandoId(null)
    if (window.api) {
      const p = await window.api.getPedidosByMesa(mesa.id)
      setPedidos(p)
    } else setPedidos([])
    setModal(true)
  }

  const cambiarEstado = async (estado) => {
    if (window.api) await window.api.updateMesa({ id: mesaSel.id, estado, mesero: mesaSel.mesero || '' })
    setMesaSel(prev => ({...prev, estado}))
    cargar()
  }

  const guardarMesa = async () => {
    if (window.api) await window.api.updateMesa({ id: mesaSel.id, estado: mesaSel.estado, mesero: mesaSel.mesero || '' })
    setModal(false); cargar()
  }

  const cerrarCuenta = async () => {
    if (!confirm(`¿Cerrar y cobrar Mesa ${mesaSel.numero}?\nTotal: $${total.toLocaleString('es-CO')}`)) return
    if (window.api) {
      const res = await window.api.cerrarMesa(mesaSel.id)
      alert(`✅ Mesa ${mesaSel.numero} cerrada\nTotal: $${res.total?.toLocaleString('es-CO')}`)
    }
    setModal(false); setPedidos([]); cargar()
  }

  const getMesa  = (num) => mesas.find(m => m.numero === num) || { numero: num, estado: 'libre' }
  const total    = pedidos.reduce((s,p) => s + p.precio * p.cantidad, 0)
  const libres   = mesas.filter(m => m.estado === 'libre').length
  const ocupadas = mesas.filter(m => m.estado === 'ocupada').length
  const totalComidas = pedidos.filter(p => !CATS_BEBIDAS.includes(p.categoria)).reduce((s,p)=>s+p.precio*p.cantidad,0)
  const totalBebidas = pedidos.filter(p =>  CATS_BEBIDAS.includes(p.categoria)).reduce((s,p)=>s+p.precio*p.cantidad,0)

  return (
          <div style={{ background:'#0d0d0d', minHeight:'100vh', color:'#fff', fontFamily:'Segoe UI, sans-serif' }}>

            {/* HEADER — solo stats, sin logo central ni título */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr 1fr',
        gap:1, background:'#c9a84c22', borderBottom:'1px solid #c9a84c22' }}>

        {/* Stats */}
        {[
          { label:'TOTAL MESAS', val:mesas.length,   color:'#c9a84c', bg:'#c9a84c0a' },
          { label:'DISPONIBLES', val:libres,          color:'#4caf50', bg:'#4caf500a' },
          { label:'OCUPADAS',    val:ocupadas,        color:'#e53935', bg:'#e539350a' },
          { label:'VENTAS HOY',  val:`$${ventasHoy.toLocaleString('es-CO')}`, color:'#c9a84c', bg:'#c9a84c0a' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, padding:'14px 16px', textAlign:'center',
            borderBottom:`2px solid ${s.color}22` }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:9, color:'#555', letterSpacing:2, marginTop:3, textTransform:'uppercase' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ZONAS */}
      <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {ZONAS.map(zona => (
          <div key={zona.nombre} style={{ border:'1px solid #c9a84c33', borderRadius:12,
            overflow:'hidden', background:'#111', boxShadow:'0 4px 20px #00000044' }}>
            <div style={{ background:'linear-gradient(135deg, #1a1400, #2a2000)',
              borderBottom:'1px solid #c9a84c44', padding:'10px 16px',
              display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>{zona.icono}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#c9a84c', letterSpacing:2 }}>{zona.nombre}</span>
              <span style={{ fontSize:11, color:'#c9a84c55', marginLeft:2 }}>({zona.mesas.length} mesas)</span>
              <div style={{ flex:1, height:1, background:'linear-gradient(90deg, #c9a84c33, transparent)' }}/>
            </div>
            <div style={{ background:'#0d0d0d', padding:12, display:'grid',
              gridTemplateColumns: zona.mesas.length <= 2 ? `repeat(${zona.mesas.length}, 1fr)` : 'repeat(4, 1fr)',
              gap:8 }}>
              {zona.mesas.map(num => {
                const m  = getMesa(num)
                const st = STATUS[m.estado] || STATUS.libre
                return (
                  <button key={num} onClick={() => abrirMesa(m)}
                    style={{ background:`linear-gradient(145deg, ${st.card}, ${st.card}bb)`,
                      border:`1px solid ${st.card}88`, borderRadius:10, padding:'14px 6px 0',
                      cursor:'pointer', overflow:'hidden', transition:'all 0.2s',
                      boxShadow:`0 2px 12px ${st.glow}`, position:'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${st.glow}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 2px 12px ${st.glow}` }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                      background:'linear-gradient(90deg, transparent, #ffffff44, transparent)' }}/>
                    <div style={{ fontSize:11, fontWeight:700, color:'#111', textAlign:'center',
                      paddingBottom:12, letterSpacing:1 }}>MESA {num}</div>
                    <div style={{ background:st.bar, color:'#fff', fontSize:9, fontWeight:700,
                      textAlign:'center', padding:'4px 0', letterSpacing:2 }}>{st.text}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalAbierto && mesaSel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'#0d0d0d', border:'1px solid #c9a84c44', borderRadius:16,
            width:'100%', maxWidth:900, margin:16, overflow:'hidden', display:'flex',
            flexDirection:'column', maxHeight:'92vh', boxShadow:'0 20px 60px #000000aa' }}>

            <div style={{ height:2, background:'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}/>

            {/* Header modal */}
            <div style={{ background:'#000', borderBottom:'1px solid #c9a84c33',
              padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:'#c9a84c15',
                  border:'1px solid #c9a84c44', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:22 }}>🪑</div>
                <div>
                  <div style={{ color:'#c9a84c', fontWeight:700, fontSize:18, letterSpacing:3 }}>
                    MESA {mesaSel.numero}
                  </div>
                  <div style={{ color:'#555', fontSize:10, letterSpacing:2, marginTop:2 }}>
                    {(STATUS[mesaSel.estado]||STATUS.libre).text}
                    {pedidos.length > 0 && ` • ${pedidos.length} ÍTEM(S)`}
                  </div>
                </div>
              </div>
              <button onClick={() => setModal(false)}
                style={{ background:'#ffffff0a', border:'1px solid #333', borderRadius:8,
                  padding:'6px 10px', color:'#888', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#e5393515'; e.currentTarget.style.color='#e53935' }}
                onMouseLeave={e => { e.currentTarget.style.background='#ffffff0a'; e.currentTarget.style.color='#888' }}>
                <X size={18}/>
              </button>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* IZQUIERDA */}
              <div style={{ flex:1, padding:20, display:'flex', flexDirection:'column',
                gap:16, overflowY:'auto', borderRight:'1px solid #1a1a1a' }}>

                {/* Buscador */}
                <div>
                  <div style={{ color:'#c9a84c88', fontSize:10, fontWeight:700,
                    letterSpacing:3, marginBottom:10, textTransform:'uppercase' }}>
                    Agregar ítem
                  </div>
                  <div style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', background:'#111',
                      border:'1px solid #c9a84c44', borderRadius:10, padding:'0 14px' }}>
                      <Search size={14} color="#c9a84c88"/>
                      <input value={busqueda}
                        onChange={e => { setBusqueda(e.target.value); setItemSel(null) }}
                        onFocus={() => resultados.length > 0 && !itemSel && setMostrarDrop(true)}
                        placeholder="Buscar plato o bebida..."
                        style={{ flex:1, background:'transparent', border:'none',
                          outline:'none', color:'#fff', fontSize:13, padding:'11px 10px' }}/>
                      {busqueda && (
                        <button onClick={() => { setBusqueda(''); setItemSel(null); setMostrarDrop(false) }}
                          style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', padding:0 }}>
                          <X size={13}/>
                        </button>
                      )}
                    </div>

                    {/* Dropdown */}
                    {mostrarDrop && !itemSel && (
                      <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
                        background:'#151515', border:'1px solid #c9a84c44', borderRadius:10,
                        zIndex:100, overflow:'hidden', maxHeight:280, overflowY:'auto',
                        boxShadow:'0 8px 30px #000000aa' }}>
                        {resultados.map(r => (
                          <button key={r.id}
                            onMouseDown={e => {
                              e.preventDefault()
                              setItemSel(r)
                              setBusqueda(r.nombre)
                              setMostrarDrop(false)
                              setCantidad(1)
                            }}
                            style={{ width:'100%', background:'transparent', border:'none',
                              borderBottom:'1px solid #1a1a1a', padding:'11px 16px',
                              display:'flex', justifyContent:'space-between',
                              alignItems:'center', cursor:'pointer', textAlign:'left',
                              transition:'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background='#c9a84c0a'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <div>
                              <div style={{ color:'#ddd', fontSize:13 }}>{r.nombre}</div>
                              <div style={{ color:'#555', fontSize:11, marginTop:2 }}>{r.categoria}</div>
                            </div>
                            <div style={{ color:'#c9a84c', fontWeight:700, fontSize:13, marginLeft:12 }}>
                              ${r.precio.toLocaleString('es-CO')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item seleccionado */}
                  {itemSel && (
                    <div style={{ marginTop:10, background:'#111', border:'1px solid #c9a84c44',
                      borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'#fff', fontSize:13, fontWeight:500 }}>{itemSel.nombre}</div>
                        <div style={{ color:'#c9a84c88', fontSize:12, marginTop:2 }}>
                          ${itemSel.precio.toLocaleString('es-CO')} c/u
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <button onClick={() => setCantidad(c => Math.max(1, c-1))}
                          style={{ width:30, height:30, borderRadius:8, border:'1px solid #333',
                            background:'#1a1a1a', color:'#fff', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Minus size={12}/>
                        </button>
                        <span style={{ color:'#fff', fontWeight:700, minWidth:28,
                          textAlign:'center', fontSize:15 }}>{cantidadSel}</span>
                        <button onClick={() => setCantidad(c => c+1)}
                          style={{ width:30, height:30, borderRadius:8, border:'1px solid #333',
                            background:'#1a1a1a', color:'#fff', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Plus size={12}/>
                        </button>
                      </div>
                      <button onClick={agregarPedido}
                        style={{ background:'#c9a84c', border:'none', borderRadius:8,
                          padding:'9px 18px', color:'#111', fontWeight:700, fontSize:12,
                          cursor:'pointer', letterSpacing:1, transition:'opacity 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                        + AGREGAR
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista pedidos */}
                <div style={{ flex:1 }}>
                  <div style={{ color:'#c9a84c88', fontSize:10, fontWeight:700,
                    letterSpacing:3, marginBottom:10, textTransform:'uppercase' }}>
                    Pedidos actuales
                  </div>
                  {pedidos.length === 0
                    ? <div style={{ color:'#333', textAlign:'center', padding:'40px 0',
                        fontSize:13, letterSpacing:1 }}>SIN PEDIDOS AÚN</div>
                    : pedidos.map(p => (
                      <div key={p.id} style={{ marginBottom:4 }}>
                        {editandoId === p.id ? (
                          <div style={{ background:'#111', border:'1px solid #c9a84c44',
                            borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ color:'#fff', fontSize:13 }}>{p.nombre_plato}</div>
                              <div style={{ color:'#c9a84c88', fontSize:11 }}>
                                ${p.precio.toLocaleString('es-CO')} c/u
                              </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <button onClick={() => setEditCant(c => Math.max(0, c-1))}
                                style={{ width:26, height:26, borderRadius:6, border:'1px solid #333',
                                  background:'#1a1a1a', color:'#fff', cursor:'pointer',
                                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Minus size={10}/>
                              </button>
                              <span style={{ color:'#fff', fontWeight:700, minWidth:22, textAlign:'center' }}>
                                {editCantidad}
                              </span>
                              <button onClick={() => setEditCant(c => c+1)}
                                style={{ width:26, height:26, borderRadius:6, border:'1px solid #333',
                                  background:'#1a1a1a', color:'#fff', cursor:'pointer',
                                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Plus size={10}/>
                              </button>
                            </div>
                            <button onClick={() => guardarEdicion(p)}
                              style={{ background:'#2e7d3222', border:'1px solid #2e7d32',
                                borderRadius:7, padding:'5px 10px', color:'#4caf50',
                                cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                              <Check size={11}/> OK
                            </button>
                            <button onClick={() => eliminarPedido(p.id)}
                              style={{ background:'#c6282822', border:'1px solid #c62828',
                                borderRadius:7, padding:'5px 10px', color:'#e53935',
                                cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                              <Trash2 size={11}/> QUITAR
                            </button>
                          </div>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:10,
                            padding:'9px 12px', borderRadius:10, border:'1px solid #1a1a1a',
                            background:'#111', transition:'border-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor='#c9a84c22'}
                            onMouseLeave={e => e.currentTarget.style.borderColor='#1a1a1a'}>
                            <div style={{ flex:1 }}>
                              <div style={{ color:'#ddd', fontSize:13 }}>{p.nombre_plato}</div>
                              <div style={{ color:'#555', fontSize:11, marginTop:2 }}>
                                x{p.cantidad} —{' '}
                                <span style={{ color:'#c9a84c88' }}>
                                  ${(p.precio * p.cantidad).toLocaleString('es-CO')}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => { setEditandoId(p.id); setEditCant(p.cantidad) }}
                              style={{ background:'transparent', border:'none', color:'#333',
                                cursor:'pointer', padding:4, transition:'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color='#c9a84c'}
                              onMouseLeave={e => e.currentTarget.style.color='#333'}>
                              <Pencil size={13}/>
                            </button>
                            <button onClick={() => eliminarPedido(p.id)}
                              style={{ background:'transparent', border:'none', color:'#333',
                                cursor:'pointer', padding:4, transition:'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color='#e53935'}
                              onMouseLeave={e => e.currentTarget.style.color='#333'}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* DERECHA */}
              <div style={{ width:240, padding:20, display:'flex',
                flexDirection:'column', gap:12, background:'#080808' }}>
                <div style={{ color:'#c9a84c88', fontSize:10, fontWeight:700,
                  letterSpacing:3, textTransform:'uppercase' }}>Resumen</div>

                <div style={{ background:'#111', borderRadius:10, padding:14, border:'1px solid #1a1a1a' }}>
                  {[
                    { label:'🍽 Comidas', val: totalComidas },
                    { label:'🥤 Bebidas', val: totalBebidas },
                  ].map(x => (
                    <div key={x.label} style={{ display:'flex', justifyContent:'space-between',
                      padding:'7px 0', borderBottom:'1px solid #1a1a1a' }}>
                      <span style={{ color:'#888', fontSize:12 }}>{x.label}</span>
                      <span style={{ color: x.val > 0 ? '#c9a84c' : '#444', fontSize:12,
                        fontWeight: x.val > 0 ? 600 : 400 }}>
                        {x.val > 0 ? `$${x.val.toLocaleString('es-CO')}` : '$0'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background:'#000', borderRadius:10, padding:16,
                  border:'1px solid #c9a84c33', textAlign:'center', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                    background:'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}/>
                  <div style={{ color:'#c9a84c55', fontSize:9, letterSpacing:3, marginBottom:6 }}>TOTAL</div>
                  <div style={{ color:'#c9a84c', fontSize:28, fontWeight:700, letterSpacing:1 }}>
                    ${total.toLocaleString('es-CO')}
                  </div>
                  <div style={{ color:'#333', fontSize:10, marginTop:6, letterSpacing:1 }}>
                    {pedidos.reduce((s,p) => s+p.cantidad, 0)} ítem(s)
                  </div>
                </div>

                <div style={{ flex:1 }}/>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {mesaSel.estado === 'libre' && (
                    <Btn color="#2e7d32" onClick={() => cambiarEstado('ocupada')}>ABRIR MESA</Btn>
                  )}
                  {mesaSel.estado === 'ocupada' && (<>
                    <Btn color="#1a1a1a" border="#c9a84c44" textColor="#c9a84c"
                      onClick={guardarMesa} icon={<Save size={13}/>}>
                      GUARDAR MESA
                    </Btn>
                    <Btn color="#c9a84c" textColor="#111" onClick={() => cambiarEstado('cuenta')}>
                      PEDIR CUENTA
                    </Btn>
                  </>)}
                  {mesaSel.estado === 'cuenta' && (<>
                    <Btn color="#1a1a1a" border="#c9a84c44" textColor="#c9a84c"
                      onClick={guardarMesa} icon={<Save size={13}/>}>
                      GUARDAR MESA
                    </Btn>
                    <Btn color="#1565c0" onClick={() => cambiarEstado('ocupada')}>
                      VOLVER A OCUPADA
                    </Btn>
                    <Btn color="#c62828" onClick={cerrarCuenta} icon={<CreditCard size={13}/>}>
                      CERRAR Y COBRAR
                    </Btn>
                  </>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Btn({ children, color, border, textColor='#fff', onClick, icon }) {
  return (
    <button onClick={onClick}
      style={{ width:'100%', padding:'11px 0', borderRadius:10,
        border:`1px solid ${border || color}`,
        background:color, color:textColor, fontWeight:700,
        cursor:'pointer', letterSpacing:1, fontSize:12,
        display:'flex', alignItems:'center', justifyContent:'center',
        gap:7, transition:'opacity 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      {icon}{children}
    </button>
  )
}