import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Minus, Trash2, CreditCard, Save, Pencil, Check, User, Banknote, Landmark, StickyNote } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { C } from '../theme'
import Recibo from '../components/Recibo'

const METODOS_PAGO = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: Landmark },
]

const PROPINA_PORCENTAJES = [5, 8, 10]

const ZONAS = [
  { nombre: 'CASA',         mesas: [1,2,3,4,5,6,7] },
  { nombre: 'SALÓN 1',      mesas: [8,9,10] },
  { nombre: 'SALÓN MADERA', mesas: [11,12] },
  { nombre: 'SALÓN 2',      mesas: [13,14,15,16,17] },
  { nombre: 'SOMBRILLA 1',  mesas: [18] },
  { nombre: 'SOMBRILLA 2',  mesas: [19] },
]

const STATUS = {
  libre:   { bar: C.success,     text: 'LIBRE',   card: C.gold,       glow: 'rgba(201,168,76,0.35)' },
  ocupada: { bar: C.terracotta,  text: 'OCUPADA', card: '#D89A4A',    glow: 'rgba(176,58,46,0.25)' },
  cuenta:  { bar: '#6A3FA0',     text: 'CUENTA',  card: '#B48CDB',    glow: 'rgba(106,63,160,0.3)' },
}

const CATS_BEBIDAS = ['Bebidas','Limonadas','Malteadas','Jarras','Gaseosas','Cervezas']

const FORMA_DIMS = {
  circular:     { width: 46, height: 46, borderRadius: '50%' },
  rectangular:  { width: 62, height: 34, borderRadius: 8 },
  cuadrada:     { width: 46, height: 46, borderRadius: 10 },
}
const formaDe = (forma) => FORMA_DIMS[forma] || FORMA_DIMS.cuadrada

export default function Mesas({ rol }) {
  const puedeCerrarCuenta = rol === 'admin' || rol === 'caja'

  const [mesas, setMesas]             = useState([])
  const [mesaSel, setMesaSel]         = useState(null)
  const [modalAbierto, setModal]      = useState(false)
  const [pedidos, setPedidos]         = useState([])
  const [menuCompleto, setMenu]       = useState([])
  const [menuDia, setMenuDia]         = useState([])
  const [origen, setOrigen]           = useState('carta') // 'carta' | 'dia'
  const [ventasHoy, setVentasHoy]     = useState(0)
  const [busqueda, setBusqueda]       = useState('')
  const [resultados, setResultados]   = useState([])
  const [cantidadSel, setCantidad]    = useState(1)
  const [itemSel, setItemSel]         = useState(null)
  const [mostrarDrop, setMostrarDrop] = useState(false)
  const [editandoId, setEditandoId]   = useState(null)
  const [editCantidad, setEditCant]   = useState(1)
  const [notaItem, setNotaItem]       = useState('')
  const [pagoModal, setPagoModal]     = useState(false)
  const [metodoPago, setMetodoPago]   = useState('efectivo')
  const [propina, setPropina]         = useState('')
  const [notasPago, setNotasPago]     = useState('')
  const [cerrando, setCerrando]       = useState(false)
  const [recibo, setRecibo]           = useState(null)

  const cargar = async () => {
    const [data, m, md] = await Promise.all([api.getMesas(), api.getMenu(), api.getMenuDia()])
    setMesas(data)
    setMenu(m)
    setMenuDia(md)
    if (puedeCerrarCuenta) {
      const ventas = await api.getVentas('hoy')
      setVentasHoy(ventas.reduce((s, v) => s + v.total, 0))
    }
  }

  useEffect(() => { cargar() }, [])

  const mesaSelRef = useRef(null)
  useEffect(() => { mesaSelRef.current = mesaSel }, [mesaSel])

  useEffect(() => {
    const onCambio = ({ mesaId }) => {
      cargar()
      if (mesaSelRef.current && mesaId === mesaSelRef.current.id) {
        api.getPedidosByMesa(mesaId).then(setPedidos)
      }
    }
    socket.on('mesas:cambio', onCambio)
    socket.on('mesas:layout', onCambio)
    return () => {
      socket.off('mesas:cambio', onCambio)
      socket.off('mesas:layout', onCambio)
    }
  }, [])

  useEffect(() => {
    if (busqueda.trim().length < 1) { setResultados([]); setMostrarDrop(false); return }
    if (itemSel) return
    const q = busqueda.toLowerCase()
    const found = menuCompleto.filter(p =>
      p.disponible &&
      (p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q))
    ).slice(0, 8)
    setResultados(found)
    setMostrarDrop(found.length > 0)
  }, [busqueda, menuCompleto, itemSel])

  const agregarPedido = async () => {
    if (!itemSel || !mesaSel) return
    const esDia = origen === 'dia'
    await api.addPedido({
      mesa_id: mesaSel.id,
      menu_id: esDia ? undefined : itemSel.id,
      menu_dia_id: esDia ? itemSel.id : undefined,
      nombre_plato: itemSel.nombre,
      categoria: esDia ? 'Menú del día' : itemSel.categoria,
      precio: itemSel.precio,
      cantidad: cantidadSel,
      notas: notaItem.trim(),
    })
    const p = await api.getPedidosByMesa(mesaSel.id)
    setPedidos(p)
    if (mesaSel.estado === 'libre') {
      const actualizada = await api.getMesas()
      const yaConMesero = actualizada.find(m => m.id === mesaSel.id)
      setMesaSel(prev => ({...prev, estado:'ocupada', mesero: yaConMesero?.mesero || prev.mesero}))
    }
    setBusqueda(''); setItemSel(null); setCantidad(1); setNotaItem('')
    cargar()
  }

  const eliminarPedido = async (id) => {
    await api.updatePedido({ id, estado: 'cerrado' })
    const p = await api.getPedidosByMesa(mesaSel.id)
    setPedidos(p)
    setEditandoId(null)
  }

  const guardarEdicion = async (p) => {
    if (editCantidad < 1) { eliminarPedido(p.id); return }
    await api.updatePedido({ id: p.id, estado: 'cerrado' })
    await api.addPedido({
      mesa_id: mesaSel.id, menu_id: p.menuId ?? undefined, menu_dia_id: p.menuDiaId ?? undefined,
      nombre_plato: p.nombrePlato, categoria: p.categoria || '',
      precio: p.precio, cantidad: editCantidad, notas: p.notas || ''
    })
    const updated = await api.getPedidosByMesa(mesaSel.id)
    setPedidos(updated)
    setEditandoId(null)
  }

  const abrirMesa = async (mesa) => {
    setMesaSel(mesa)
    setBusqueda(''); setItemSel(null); setCantidad(1); setEditandoId(null); setOrigen('carta')
    const p = await api.getPedidosByMesa(mesa.id)
    setPedidos(p)
    setModal(true)
  }

  const cambiarEstado = async (estado) => {
    await api.updateMesa({ id: mesaSel.id, estado, mesero: mesaSel.mesero || '' })
    setMesaSel(prev => ({...prev, estado}))
    cargar()
  }

  const guardarMesa = async () => {
    await api.updateMesa({ id: mesaSel.id, estado: mesaSel.estado, mesero: mesaSel.mesero || '' })
    setModal(false); cargar()
  }

  const abrirPago = () => {
    if (!puedeCerrarCuenta) return
    setMetodoPago('efectivo'); setPropina(''); setNotasPago(''); setPagoModal(true)
  }

  const confirmarPago = async () => {
    setCerrando(true)
    try {
      const res = await api.cerrarMesa(mesaSel.id, {
        metodo_pago: metodoPago, propina: Number(propina) || 0, notas_pago: notasPago.trim(),
      })
      const detalle = await api.getRecibo(res.ventaId)
      setPagoModal(false); setModal(false); setPedidos([])
      setRecibo(detalle)
      cargar()
    } finally {
      setCerrando(false)
    }
  }

  const getMesa  = (num) => mesas.find(m => m.numero === num) || { numero: num, estado: 'libre' }
  const total    = pedidos.reduce((s,p) => s + p.precio * p.cantidad, 0)
  const libres   = mesas.filter(m => m.estado === 'libre').length
  const ocupadas = mesas.filter(m => m.estado === 'ocupada').length
  const totalComidas = pedidos.filter(p => !CATS_BEBIDAS.includes(p.categoria)).reduce((s,p)=>s+p.precio*p.cantidad,0)
  const totalBebidas = pedidos.filter(p =>  CATS_BEBIDAS.includes(p.categoria)).reduce((s,p)=>s+p.precio*p.cantidad,0)

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text, fontFamily:'Segoe UI, sans-serif' }}>
      <style>{`
        .mesa-tile:hover { transform: translateY(-4px); box-shadow: 0 10px 22px rgba(43,36,32,0.18) !important; }
        .mesa-tile:active { transform: translateY(-1px) scale(0.98); }
        @keyframes mesa-pulso-anim {
          0% { box-shadow: 0 0 0 0 rgba(176,58,46,0.55); }
          70% { box-shadow: 0 0 0 7px rgba(176,58,46,0); }
          100% { box-shadow: 0 0 0 0 rgba(176,58,46,0); }
        }
        .mesa-pulso { animation: mesa-pulso-anim 1.8s ease-out infinite; }
        @media (max-width: 760px) {
          .cabuyal-zonas-grid { grid-template-columns: 1fr !important; }
          .cabuyal-mesa-modal-row { flex-direction: column !important; overflow-y: auto !important; }
          .cabuyal-mesa-modal-right { width: 100% !important; }
        }
      `}</style>

      {/* HEADER — stats */}
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))',
        gap:12, padding:'16px 16px 0' }}>
        {[
          { label:'TOTAL MESAS', val:mesas.length,   color:C.goldDark, bg:C.goldBg },
          { label:'DISPONIBLES', val:libres,          color:C.success,  bg:C.successBg },
          { label:'OCUPADAS',    val:ocupadas,        color:C.terracotta, bg:C.terracottaBg },
          ...(puedeCerrarCuenta ? [{ label:'VENTAS HOY',  val:`$${ventasHoy.toLocaleString('es-CO')}`, color:C.teal, bg:C.infoBg }] : []),
        ].map(s => (
          <div key={s.label} style={{ background:C.surface, padding:'14px 16px', borderRadius:12,
            border:`1px solid ${C.border}`, boxShadow:'0 2px 8px rgba(11,36,54,0.05)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, marginBottom:8 }}/>
            <div style={{ fontSize:21, fontWeight:800, color:C.text }}>{s.val}</div>
            <div style={{ fontSize:10, color:C.textMuted, letterSpacing:1, marginTop:2, textTransform:'uppercase' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ZONAS */}
      <div className="cabuyal-zonas-grid" style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {ZONAS.map(zona => (
          <div key={zona.nombre} style={{ border:`1px solid ${C.border}`, borderRadius:12,
            overflow:'hidden', background:C.surface, boxShadow:'0 3px 12px rgba(43,36,32,0.06)' }}>
            <div style={{ background:C.header,
              padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:12, fontWeight:800, color:C.gold, letterSpacing:2 }}>{zona.nombre}</span>
              <span style={{ fontSize:11, color:C.headerTextMuted, marginLeft:2 }}>({zona.mesas.length} mesas)</span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.gold}44, transparent)` }}/>
            </div>
            <div style={{ background:C.surfaceAlt, padding:12, display:'grid',
              gridTemplateColumns: zona.mesas.length <= 2 ? `repeat(${zona.mesas.length}, 1fr)` : 'repeat(4, 1fr)',
              gap:10 }}>
              {zona.mesas.map(num => {
                const m  = getMesa(num)
                const st = STATUS[m.estado] || STATUS.libre
                const dims = formaDe(m.forma)
                const ocupada = m.estado === 'ocupada'
                return (
                  <button key={num} className="mesa-tile" onClick={() => abrirMesa(m)}
                    style={{ background:C.surface,
                      border:`1px solid ${st.card}`, borderRadius:12, padding:'12px 6px 0',
                      cursor:'pointer', overflow:'visible', transition:'transform 0.18s, box-shadow 0.18s',
                      boxShadow:`0 2px 10px ${st.glow}`, position:'relative',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    {ocupada && (
                      <span className="mesa-pulso" style={{
                        position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%',
                        background:st.bar,
                      }}/>
                    )}
                    <div style={{
                      ...dims,
                      background: m.imagenUrl ? `center/cover no-repeat url(${m.imagenUrl})` : `linear-gradient(145deg, ${st.card}, ${st.card}cc)`,
                      border:`2px solid ${st.card}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`inset 0 0 0 2px ${C.surface}`,
                    }}>
                      <span style={{ fontSize:13, fontWeight:800, color:'#2B2420',
                        background: m.imagenUrl ? 'rgba(255,255,255,0.85)' : 'transparent',
                        borderRadius: m.imagenUrl ? 6 : 0, padding: m.imagenUrl ? '1px 5px' : 0 }}>
                        {num}
                      </span>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:1 }}>MESA {num}</div>
                    {ocupada && m.mesero && (
                      <div style={{ fontSize:9, color:C.goldDark, marginTop:-4, whiteSpace:'nowrap',
                        overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>{m.mesero}</div>
                    )}
                    <div style={{ background:st.bar, color:'#fff', fontSize:9, fontWeight:800,
                      textAlign:'center', padding:'4px 0', letterSpacing:2, width:'100%', borderRadius:'0 0 9px 9px' }}>{st.text}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalAbierto && mesaSel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16,
            width:'100%', maxWidth:1180, margin:16, overflow:'hidden', display:'flex',
            flexDirection:'column', maxHeight:'94vh', boxShadow:'0 24px 60px rgba(0,0,0,0.28)' }}>

            {/* Header modal */}
            <div style={{ background:C.header, borderBottom:`3px solid ${C.gold}`,
              padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:'#ffffff18',
                  border:`1px solid ${C.gold}66`, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:22 }}>🪑</div>
                <div>
                  <div style={{ color:C.gold, fontWeight:800, fontSize:18, letterSpacing:3 }}>
                    MESA {mesaSel.numero}
                  </div>
                  <div style={{ color:C.headerTextMuted, fontSize:10, letterSpacing:2, marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
                    <span>{(STATUS[mesaSel.estado]||STATUS.libre).text}</span>
                    {pedidos.length > 0 && <span>• {pedidos.length} ÍTEM(S)</span>}
                    {mesaSel.mesero && (
                      <span style={{ display:'flex', alignItems:'center', gap:3, color:C.gold }}>
                        • <User size={10}/> {mesaSel.mesero}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setModal(false)}
                style={{ background:'#ffffff14', border:'1px solid #ffffff22', borderRadius:8,
                  padding:'6px 10px', color:C.headerTextMuted, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background=C.terracottaDark; e.currentTarget.style.color='#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background='#ffffff14'; e.currentTarget.style.color=C.headerTextMuted }}>
                <X size={18}/>
              </button>
            </div>

            <div className="cabuyal-mesa-modal-row" style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* IZQUIERDA */}
              <div style={{ flex:1, minWidth:0, padding:26, display:'flex', flexDirection:'column',
                gap:20, overflowY:'auto', borderRight:`1px solid ${C.border}` }}>

                {/* Buscador */}
                <div>
                  <div style={{ color:C.textMuted, fontSize:10, fontWeight:800,
                    letterSpacing:3, marginBottom:10, textTransform:'uppercase' }}>
                    Agregar ítem
                  </div>

                  {/* Selector Carta / Menú del día */}
                  <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                    {[
                      { key:'carta', label:'CARTA' },
                      { key:'dia', label:`MENÚ DEL DÍA${menuDia.length ? ` (${menuDia.length})` : ''}` },
                    ].map(o => (
                      <button key={o.key} onClick={() => { setOrigen(o.key); setItemSel(null); setBusqueda(''); setMostrarDrop(false); setNotaItem('') }}
                        style={{ flex:1, padding:'8px 0', borderRadius:8, fontSize:11, fontWeight:800,
                          letterSpacing:1, cursor:'pointer',
                          background: origen === o.key ? C.gold : C.bgAlt,
                          color: origen === o.key ? C.header : C.textMuted,
                          border:`1px solid ${origen === o.key ? C.gold : C.border}` }}>
                        {o.label}
                      </button>
                    ))}
                  </div>

                  {origen === 'carta' ? (
                    <div style={{ position:'relative' }}>
                      <div style={{ display:'flex', alignItems:'center', background:C.surfaceAlt,
                        border:`1px solid ${C.border}`, borderRadius:10, padding:'0 14px' }}>
                        <Search size={14} color={C.goldDark}/>
                        <input value={busqueda}
                          onChange={e => { setBusqueda(e.target.value); setItemSel(null) }}
                          onFocus={() => resultados.length > 0 && !itemSel && setMostrarDrop(true)}
                          placeholder="Buscar plato o bebida..."
                          style={{ flex:1, background:'transparent', border:'none',
                            outline:'none', color:C.text, fontSize:13, padding:'11px 10px' }}/>
                        {busqueda && (
                          <button onClick={() => { setBusqueda(''); setItemSel(null); setMostrarDrop(false) }}
                            style={{ background:'transparent', border:'none', color:C.textMuted, cursor:'pointer', padding:0 }}>
                            <X size={13}/>
                          </button>
                        )}
                      </div>

                      {/* Dropdown */}
                      {mostrarDrop && !itemSel && (
                        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
                          background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
                          zIndex:100, overflow:'hidden', maxHeight:340, overflowY:'auto',
                          boxShadow:'0 8px 30px rgba(0,0,0,0.15)' }}>
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
                                borderBottom:`1px solid ${C.border}`, padding:'10px 14px',
                                display:'flex', alignItems:'center', gap:12, cursor:'pointer', textAlign:'left',
                                transition:'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background=C.bgAlt}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                              <div style={{ width:44, height:44, borderRadius:8, flexShrink:0,
                                background: r.imagenUrl ? `center/cover no-repeat url(${r.imagenUrl})` : C.goldBg }} />
                              <div style={{ flex:1 }}>
                                <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{r.nombre}</div>
                                <div style={{ color:C.textMuted, fontSize:11, marginTop:2 }}>{r.categoria}</div>
                              </div>
                              <div style={{ color:C.goldDark, fontWeight:800, fontSize:13, marginLeft:12, whiteSpace:'nowrap' }}>
                                ${r.precio.toLocaleString('es-CO')}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    menuDia.length === 0 ? (
                      <div style={{ color:C.textFaint, fontSize:12, textAlign:'center', padding:'18px 0',
                        border:`1px dashed ${C.border}`, borderRadius:10 }}>
                        Hoy no se ha armado el menú del día (Admin/Caja → Menú del día)
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {menuDia.map(item => (
                          <button key={item.id}
                            onClick={() => { setItemSel(itemSel?.id === item.id ? null : item); setCantidad(1) }}
                            style={{ width:'100%', textAlign:'left', padding:'10px 14px', borderRadius:10,
                              cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10,
                              background: itemSel?.id === item.id ? C.goldBg : C.surfaceAlt,
                              border:`1px solid ${itemSel?.id === item.id ? C.gold : C.border}` }}>
                            <div>
                              <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{item.nombre}</div>
                              {item.descripcion && <div style={{ color:C.textMuted, fontSize:11, marginTop:2 }}>{item.descripcion}</div>}
                            </div>
                            <div style={{ color:C.goldDark, fontWeight:800, fontSize:13, whiteSpace:'nowrap' }}>
                              ${item.precio.toLocaleString('es-CO')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  )}

                  {/* Item seleccionado */}
                  {itemSel && (
                    <div style={{ marginTop:10, background:C.goldBg, border:`1px solid ${C.gold}`,
                      borderRadius:10, padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:48, height:48, borderRadius:9, flexShrink:0,
                          background: itemSel.imagenUrl ? `center/cover no-repeat url(${itemSel.imagenUrl})` : `linear-gradient(145deg, ${C.gold}, ${C.goldDark})` }} />
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{itemSel.nombre}</div>
                          <div style={{ color:C.goldDark, fontSize:12, marginTop:2 }}>
                            ${itemSel.precio.toLocaleString('es-CO')} c/u
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <button onClick={() => setCantidad(c => Math.max(1, c-1))}
                            style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`,
                              background:C.surface, color:C.text, cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Minus size={12}/>
                          </button>
                          <span style={{ color:C.text, fontWeight:800, minWidth:28,
                            textAlign:'center', fontSize:15 }}>{cantidadSel}</span>
                          <button onClick={() => setCantidad(c => c+1)}
                            style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`,
                              background:C.surface, color:C.text, cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Plus size={12}/>
                          </button>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, background:C.surface,
                        border:`1px solid ${C.border}`, borderRadius:8, padding:'0 10px' }}>
                        <StickyNote size={13} color={C.textFaint}/>
                        <input value={notaItem} onChange={e => setNotaItem(e.target.value)}
                          placeholder="Nota para cocina (ej: sin cebolla, poco frito)..."
                          style={{ flex:1, background:'transparent', border:'none', outline:'none',
                            color:C.text, fontSize:12, padding:'9px 0' }}/>
                      </div>
                      <button onClick={agregarPedido}
                        style={{ background:C.gold, border:'none', borderRadius:8,
                          padding:'9px 18px', color:C.header, fontWeight:800, fontSize:12,
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
                  <div style={{ color:C.textMuted, fontSize:10, fontWeight:800,
                    letterSpacing:3, marginBottom:10, textTransform:'uppercase' }}>
                    Pedidos actuales
                  </div>
                  {pedidos.length === 0
                    ? <div style={{ color:C.textFaint, textAlign:'center', padding:'40px 0',
                        fontSize:13, letterSpacing:1 }}>SIN PEDIDOS AÚN</div>
                    : pedidos.map(p => {
                      const fotoPlato = menuCompleto.find(m => m.id === p.menuId)?.imagenUrl
                      return (
                      <div key={p.id} style={{ marginBottom:8 }}>
                        {editandoId === p.id ? (
                          <div style={{ background:C.goldBg, border:`2px solid ${C.gold}`,
                            borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div>
                                <div style={{ color:C.textMuted, fontSize:10, fontWeight:800, letterSpacing:2, marginBottom:3 }}>
                                  EDITANDO CANTIDAD
                                </div>
                                <div style={{ color:C.text, fontSize:14, fontWeight:700 }}>{p.nombrePlato}</div>
                                <div style={{ color:C.goldDark, fontSize:12 }}>
                                  ${p.precio.toLocaleString('es-CO')} c/u
                                </div>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:8, background:C.surface,
                                border:`1px solid ${C.border}`, borderRadius:10, padding:'4px 6px' }}>
                                <button onClick={() => setEditCant(c => Math.max(0, c-1))}
                                  style={{ width:30, height:30, borderRadius:7, border:'none',
                                    background:C.bgAlt, color:C.text, cursor:'pointer',
                                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <Minus size={13}/>
                                </button>
                                <span style={{ color:C.text, fontWeight:800, minWidth:26, textAlign:'center', fontSize:15 }}>
                                  {editCantidad}
                                </span>
                                <button onClick={() => setEditCant(c => c+1)}
                                  style={{ width:30, height:30, borderRadius:7, border:'none',
                                    background:C.bgAlt, color:C.text, cursor:'pointer',
                                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <Plus size={13}/>
                                </button>
                              </div>
                            </div>
                            {editCantidad < 1 && (
                              <div style={{ color:C.terracotta, fontSize:11, fontWeight:600 }}>
                                La cantidad en 0 elimina el ítem del pedido.
                              </div>
                            )}
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={() => guardarEdicion(p)}
                                style={{ flex:1, background:C.success, border:'none',
                                  borderRadius:8, padding:'10px 0', color:'#fff',
                                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:12, fontWeight:700 }}>
                                <Check size={13}/> {editCantidad < 1 ? 'ELIMINAR' : 'CONFIRMAR'}
                              </button>
                              <button onClick={() => setEditandoId(null)}
                                style={{ flex:1, background:'transparent', border:`1px solid ${C.border}`,
                                  borderRadius:8, padding:'10px 0', color:C.textMuted,
                                  cursor:'pointer', fontSize:12, fontWeight:700 }}>
                                CANCELAR
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:10,
                            padding:'10px 12px', borderRadius:10, border:`1px solid ${C.border}`,
                            background:C.surfaceAlt, transition:'border-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor=C.gold}
                            onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
                            <div style={{ width:38, height:38, borderRadius:7, flexShrink:0,
                              background: fotoPlato ? `center/cover no-repeat url(${fotoPlato})` : C.goldBg }} />
                            <div style={{ flex:1 }}>
                              <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{p.nombrePlato}</div>
                              <div style={{ color:C.textMuted, fontSize:11, marginTop:2 }}>
                                x{p.cantidad} —{' '}
                                <span style={{ color:C.goldDark, fontWeight:700 }}>
                                  ${(p.precio * p.cantidad).toLocaleString('es-CO')}
                                </span>
                              </div>
                              {p.notas && (
                                <div style={{ color:C.terracotta, fontSize:11, marginTop:3, fontStyle:'italic' }}>
                                  📝 {p.notas}
                                </div>
                              )}
                            </div>
                            <button onClick={() => { setEditandoId(p.id); setEditCant(p.cantidad) }}
                              style={{ background:C.infoBg, border:'none', borderRadius:7,
                                cursor:'pointer', padding:7, color:C.info, transition:'opacity 0.15s' }}>
                              <Pencil size={13}/>
                            </button>
                            <button onClick={() => eliminarPedido(p.id)}
                              style={{ background:C.dangerBg, border:'none', borderRadius:7,
                                cursor:'pointer', padding:7, color:C.danger, transition:'opacity 0.15s' }}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        )}
                      </div>
                      )
                    })
                  }
                </div>
              </div>

              {/* DERECHA */}
              <div className="cabuyal-mesa-modal-right" style={{ width:280, padding:24, display:'flex',
                flexDirection:'column', gap:14, background:C.surfaceAlt, flexShrink:0 }}>
                <div style={{ color:C.textMuted, fontSize:10, fontWeight:800,
                  letterSpacing:3, textTransform:'uppercase' }}>Resumen</div>

                <div style={{ background:C.surface, borderRadius:10, padding:14, border:`1px solid ${C.border}` }}>
                  {[
                    { label:'🍽 Comidas', val: totalComidas },
                    { label:'🥤 Bebidas', val: totalBebidas },
                  ].map(x => (
                    <div key={x.label} style={{ display:'flex', justifyContent:'space-between',
                      padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ color:C.textMuted, fontSize:12 }}>{x.label}</span>
                      <span style={{ color: x.val > 0 ? C.goldDark : C.textFaint, fontSize:12,
                        fontWeight: x.val > 0 ? 700 : 400 }}>
                        {x.val > 0 ? `$${x.val.toLocaleString('es-CO')}` : '$0'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background:C.header, borderRadius:10, padding:16,
                  textAlign:'center', position:'relative', overflow:'hidden' }}>
                  <div style={{ color:C.headerTextMuted, fontSize:9, letterSpacing:3, marginBottom:6 }}>TOTAL</div>
                  <div style={{ color:C.gold, fontSize:28, fontWeight:800, letterSpacing:1 }}>
                    ${total.toLocaleString('es-CO')}
                  </div>
                  <div style={{ color:C.headerTextMuted, fontSize:10, marginTop:6, letterSpacing:1 }}>
                    {pedidos.reduce((s,p) => s+p.cantidad, 0)} ítem(s)
                  </div>
                </div>

                <div style={{ flex:1 }}/>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {mesaSel.estado === 'libre' && (
                    <Btn color={C.success} onClick={() => cambiarEstado('ocupada')}>ABRIR MESA</Btn>
                  )}
                  {mesaSel.estado === 'ocupada' && (<>
                    <Btn color={C.surface} border={C.gold} textColor={C.goldDark}
                      onClick={guardarMesa} icon={<Save size={13}/>}>
                      GUARDAR MESA
                    </Btn>
                    <Btn color={C.gold} textColor={C.header} onClick={() => cambiarEstado('cuenta')}>
                      PEDIR CUENTA
                    </Btn>
                  </>)}
                  {mesaSel.estado === 'cuenta' && (<>
                    <Btn color={C.surface} border={C.gold} textColor={C.goldDark}
                      onClick={guardarMesa} icon={<Save size={13}/>}>
                      GUARDAR MESA
                    </Btn>
                    <Btn color={C.info} onClick={() => cambiarEstado('ocupada')}>
                      VOLVER A OCUPADA
                    </Btn>
                    {puedeCerrarCuenta && (
                      <Btn color={C.terracotta} onClick={abrirPago} icon={<CreditCard size={13}/>}>
                        CERRAR Y COBRAR
                      </Btn>
                    )}
                  </>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO */}
      {pagoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.65)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:70 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.gold}`, borderRadius:14,
            width:'100%', maxWidth:380, margin:16, overflow:'hidden' }}>
            <div style={{ background:C.header, padding:'14px 20px', display:'flex',
              justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:C.gold, fontWeight:800, letterSpacing:1 }}>COBRAR MESA {mesaSel?.numero}</div>
              <button onClick={() => setPagoModal(false)}
                style={{ background:'transparent', border:'none', color:C.gold, cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <div style={{ color:C.textMuted, fontSize:11, fontWeight:800, letterSpacing:1, marginBottom:8 }}>
                  MÉTODO DE PAGO
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {METODOS_PAGO.map(({ key, label, icon:Icon }) => (
                    <button key={key} onClick={() => setMetodoPago(key)}
                      style={{ flex:1, padding:'12px 4px', borderRadius:10, cursor:'pointer',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:6, fontSize:11, fontWeight:700,
                        background: metodoPago===key ? C.goldBg : C.bgAlt,
                        color: metodoPago===key ? C.goldDark : C.textMuted,
                        border:`1.5px solid ${metodoPago===key ? C.gold : C.border}` }}>
                      <Icon size={18}/> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ color:C.textMuted, fontSize:11, fontWeight:800, letterSpacing:1, marginBottom:8 }}>
                  PROPINA (VOLUNTARIA)
                </div>
                <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                  {PROPINA_PORCENTAJES.map(pct => {
                    const valorPct = Math.round(total * pct / 100)
                    const activo = Number(propina) === valorPct && propina !== ''
                    return (
                      <button key={pct} onClick={() => setPropina(String(valorPct))}
                        style={{ flex:1, padding:'8px 0', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:800,
                          background: activo ? C.goldBg : C.bgAlt, color: activo ? C.goldDark : C.textMuted,
                          border:`1.5px solid ${activo ? C.gold : C.border}` }}>
                        {pct}%
                      </button>
                    )
                  })}
                  <button onClick={() => setPropina('0')}
                    style={{ flex:1, padding:'8px 0', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:800,
                      background: propina === '0' ? C.goldBg : C.bgAlt, color: propina === '0' ? C.goldDark : C.textMuted,
                      border:`1.5px solid ${propina === '0' ? C.gold : C.border}` }}>
                    Sin propina
                  </button>
                </div>
                <input type="number" value={propina} onChange={e => setPropina(e.target.value)}
                  placeholder="$0 (o escribe un valor personalizado)"
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:8,
                    color:C.text, fontSize:14, padding:'10px 12px', outline:'none', boxSizing:'border-box' }}/>
              </div>

              <div>
                <div style={{ color:C.textMuted, fontSize:11, fontWeight:800, letterSpacing:1, marginBottom:8, display:'flex',
                  alignItems:'center', gap:6 }}>
                  <StickyNote size={12}/> NOTAS DE PAGO (SI LO DIVIDEN)
                </div>
                <textarea value={notasPago} onChange={e => setNotasPago(e.target.value)} rows={2}
                  placeholder="Ej: $20.000 Nequi + $20.000 efectivo"
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:8,
                    color:C.text, fontSize:13, padding:'10px 12px', outline:'none', boxSizing:'border-box',
                    fontFamily:'inherit', resize:'vertical' }}/>
              </div>

              <div style={{ background:C.header, borderRadius:10, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.headerTextMuted, marginBottom:4 }}>
                  <span>Subtotal</span><span>${total.toLocaleString('es-CO')}</span>
                </div>
                {Number(propina) > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.headerTextMuted, marginBottom:4 }}>
                    <span>Propina</span><span>${Number(propina).toLocaleString('es-CO')}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800,
                  color:C.gold, marginTop:6, paddingTop:6, borderTop:'1px solid #ffffff22' }}>
                  <span>TOTAL</span><span>${(total + (Number(propina) || 0)).toLocaleString('es-CO')}</span>
                </div>
              </div>

              <button onClick={confirmarPago} disabled={cerrando}
                style={{ padding:'13px 0', borderRadius:10, border:'none',
                  background: cerrando ? C.border : C.terracotta, color:'#fff', fontWeight:800, fontSize:13,
                  cursor: cerrando ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8 }}>
                <CreditCard size={15}/> {cerrando ? 'PROCESANDO…' : 'CONFIRMAR PAGO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {recibo && <Recibo venta={recibo} onClose={() => setRecibo(null)} />}
    </div>
  )
}

function Btn({ children, color, border, textColor='#fff', onClick, icon }) {
  return (
    <button onClick={onClick}
      style={{ width:'100%', padding:'11px 0', borderRadius:10,
        border:`1px solid ${border || color}`,
        background:color, color:textColor, fontWeight:800,
        cursor:'pointer', letterSpacing:1, fontSize:12,
        display:'flex', alignItems:'center', justifyContent:'center',
        gap:7, transition:'opacity 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      {icon}{children}
    </button>
  )
}
