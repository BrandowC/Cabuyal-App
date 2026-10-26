import { useEffect, useState } from 'react'
import { X, Search, Plus, Minus, Phone, MapPin, User, CheckCircle, XCircle, Bike, Globe, Check, Store, Truck, StickyNote, History, Receipt, ChevronDown, ChevronUp, Banknote, CreditCard, Landmark, Home } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { C } from '../theme'
import ReciboDomicilio from '../components/ReciboDomicilio'
import { urlWhatsapp, mensajeConfirmacion } from '../lib/whatsapp'

const COLUMNAS = [
  { key: 'pendiente', titulo: 'PENDIENTES', estados: ['pendiente', 'pendiente_confirmacion'] },
  { key: 'despachado', titulo: 'DESPACHADOS', estados: ['despachado'] },
]

const LIMITE_VISIBLE = 2

const METODOS_PAGO = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: Landmark },
]

const FORM_VACIO = { nombre:'', telefono:'', direccion:'', referencia:'' }

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
    <span style={{ color: alerta ? C.danger : C.success, fontWeight:700,
      fontSize:14, fontFamily:'monospace' }}>
      ⏱ {elapsed}
    </span>
  )
}

export default function Domicilios() {
  const [domicilios, setDomicilios] = useState([])
  const [cancelados, setCancelados] = useState([])
  const [verCancelados, setVerCancelados] = useState(false)
  const [menuCompleto, setMenu]     = useState([])
  const [modalAbierto, setModal]    = useState(false)
  const [cancelModal, setCancelModal] = useState(null)
  const [reciboVer, setReciboVer]   = useState(null)
  const [expandidos, setExpandidos] = useState({})

  const [form, setForm]             = useState(FORM_VACIO)
  const [tipoEntrega, setTipoEntrega] = useState('domicilio')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [costoEnvio, setCostoEnvio] = useState('')
  const [items, setItems]           = useState([])
  const [busqueda, setBusqueda]     = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrarDrop, setMostrarDrop] = useState(false)
  const [itemSel, setItemSel]       = useState(null)
  const [cantidad, setCantidad]     = useState(1)
  const [notaItem, setNotaItem]     = useState('')

  const cargar = async () => {
    const [d, m] = await Promise.all([api.getDomicilios(), api.getMenu()])
    setDomicilios(d)
    setMenu(m)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (verCancelados) api.getDomicilios({ cancelados: '1' }).then(setCancelados)
  }, [verCancelados])

  useEffect(() => {
    const onCambio = () => { cargar(); if (verCancelados) api.getDomicilios({ cancelados: '1' }).then(setCancelados) }
    socket.on('domicilios:cambio', onCambio)
    return () => socket.off('domicilios:cambio', onCambio)
  }, [verCancelados])

  useEffect(() => {
    if (busqueda.trim().length < 1) { setResultados([]); setMostrarDrop(false); return }
    if (itemSel) return
    const q = busqueda.toLowerCase()
    const found = menuCompleto
      .filter(p => p.disponible &&
        (p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)))
      .slice(0, 8)
    setResultados(found)
    setMostrarDrop(found.length > 0)
  }, [busqueda, menuCompleto, itemSel])

  const seleccionar = (item) => {
    setItemSel(item); setBusqueda(item.nombre); setMostrarDrop(false); setCantidad(1); setNotaItem('')
  }

  const agregarItem = () => {
    if (!itemSel) return
    setItems(prev => {
      const exist = prev.find(x => x.id === itemSel.id && x.notas === notaItem.trim())
      if (exist) return prev.map(x => x === exist ? { ...x, cantidad: x.cantidad + cantidad } : x)
      return [...prev, { ...itemSel, cantidad, notas: notaItem.trim() }]
    })
    setBusqueda(''); setItemSel(null); setCantidad(1); setNotaItem(''); setMostrarDrop(false)
  }

  const editarCantidad = (idx, delta) => {
    setItems(prev => prev
      .map((x, i) => i === idx ? { ...x, cantidad: x.cantidad + delta } : x)
      .filter(x => x.cantidad > 0)
    )
  }

  const subtotal = items.reduce((s, x) => s + x.precio * x.cantidad, 0)
  const envio = tipoEntrega === 'domicilio' ? (Number(costoEnvio) || 0) : 0
  const total = subtotal + envio

  const guardar = async () => {
    if (!form.nombre || !form.telefono || !form.direccion || items.length === 0) {
      alert('Complete todos los datos y agregue al menos un ítem')
      return
    }
    await api.addDomicilio({
      nombre: form.nombre, telefono: form.telefono, direccion: form.direccion, referencia: form.referencia || '',
      items: items.map(x => ({ nombre: x.nombre, precio: x.precio, cantidad: x.cantidad, notas: x.notas || '' })),
      tipoEntrega, costoEnvio: envio, metodoPago,
    })
    setModal(false)
    setForm(FORM_VACIO); setTipoEntrega('domicilio'); setCostoEnvio(''); setMetodoPago('efectivo')
    setItems([]); setBusqueda(''); setItemSel(null)
    cargar()
  }

  const cambiarEstado = async (id, estado) => {
    await api.updateDomicilio({ id, estado })
    cargar()
  }

  // Confirma el pedido y abre WhatsApp con el aviso listo para el cliente. La ventana se abre antes
  // del await para que el navegador no la bloquee como ventana emergente.
  const confirmarYAvisar = async (d) => {
    if (d.telefono) window.open(urlWhatsapp(d.telefono, mensajeConfirmacion(d)), '_blank', 'noopener')
    await cambiarEstado(d.id, 'pendiente')
  }

  const cancelar = async (id) => {
    await api.updateDomicilio({ id, estado: 'cancelado' })
    setCancelModal(null); cargar()
  }

  const activos = domicilios.filter(d => d.estado !== 'despachado')
  const totalHoy = domicilios.reduce((s, d) => s + d.total, 0)

  const onDragStart = (e, d) => {
    e.dataTransfer.setData('text/plain', String(d.id))
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOverCol = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const onDropCol = (e, columnaKey) => {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('text/plain'))
    if (!id) return
    cambiarEstado(id, columnaKey === 'despachado' ? 'despachado' : 'pendiente')
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text,
      fontFamily:'Segoe UI, sans-serif' }}>
      <style>{`
        @media (max-width: 760px) {
          .cabuyal-domi-header { flex-wrap: wrap !important; }
          .cabuyal-domi-stats { grid-template-columns: 1fr 1fr !important; }
          .cabuyal-domi-kanban { grid-template-columns: 1fr !important; }
          .cabuyal-domi-modal-row { flex-direction: column !important; overflow-y: auto !important; }
          .cabuyal-domi-modal-right { width: 100% !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="cabuyal-domi-header" style={{ background:C.header, borderBottom:`3px solid ${C.gold}`,
        display:'flex', alignItems:'stretch', flexWrap:'wrap' }}>
        <div style={{ flex:1, padding:'10px 24px', display:'flex',
          flexDirection:'column', justifyContent:'center' }}>
          <div style={{ color:C.gold, fontSize:22, fontWeight:800, letterSpacing:4 }}>
            DOMICILIOS
          </div>
          <div style={{ color:C.headerTextMuted, fontSize:11, letterSpacing:2, marginTop:2 }}>
            EL CABUYAL • PALERMO — {activos.length} activo(s)
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 20px' }}>
          <button onClick={() => setVerCancelados(v => !v)}
            style={{ background: verCancelados ? `${C.gold}22` : 'transparent', border:'1px solid #ffffff33', borderRadius:8,
              padding:'9px 14px', color: verCancelados ? C.gold : C.headerTextMuted, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
            <History size={14}/> CANCELADOS
          </button>
          <button onClick={() => setModal(true)}
            style={{ background:C.gold, border:'none', borderRadius:8,
              padding:'10px 20px', color:C.header, fontWeight:800, fontSize:13,
              cursor:'pointer', letterSpacing:1, display:'flex', alignItems:'center', gap:8 }}>
            <Bike size={16}/> NUEVO DOMICILIO
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="cabuyal-domi-stats" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, padding:'16px 20px 0' }}>
        {[
          { label:'PENDIENTES', val: domicilios.filter(d=>d.estado!=='despachado').length,  color:C.terracotta },
          { label:'DESPACHADOS HOY', val: domicilios.filter(d=>d.estado==='despachado').length, color:C.success },
          { label:'TOTAL HOY',  val: `$${totalHoy.toLocaleString('es-CO')}`, color:C.teal },
        ].map(s => (
          <div key={s.label} style={{ background:C.surface, padding:'12px 16px', textAlign:'center',
            borderRadius:12, border:`1px solid ${C.border}`, boxShadow:'0 2px 8px rgba(11,36,54,0.05)' }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10, color:C.textMuted, letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CANCELADOS (colapsable) */}
      {verCancelados && (
        <div style={{ padding:'16px 20px 0' }}>
          <div style={{ background:C.dangerBg, border:`1px solid ${C.danger}55`, borderRadius:12, padding:14 }}>
            <div style={{ color:C.danger, fontWeight:800, fontSize:12, letterSpacing:1, marginBottom:10 }}>
              CANCELADOS HOY ({cancelados.length})
            </div>
            {cancelados.length === 0 ? (
              <div style={{ color:C.textMuted, fontSize:12 }}>Ningún domicilio cancelado hoy.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {cancelados.map(d => (
                  <div key={d.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12,
                    background:C.surface, borderRadius:8, padding:'8px 12px' }}>
                    <span>#{String(d.id).padStart(3,'0')} — {d.nombre} {d.creadoPor && `(por ${d.creadoPor})`}</span>
                    <span style={{ fontWeight:700, color:C.textMuted }}>${d.total.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABLERO KANBAN */}
      <div className="cabuyal-domi-kanban" style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
        {COLUMNAS.map(col => {
          const items = domicilios.filter(d => col.estados.includes(d.estado))
          const expandido = !!expandidos[col.key]
          const visibles = expandido ? items : items.slice(0, LIMITE_VISIBLE)
          return (
            <div key={col.key} onDragOver={onDragOverCol} onDrop={(e) => onDropCol(e, col.key)}
              style={{ background:C.surfaceAlt, border:`1px dashed ${C.border}`, borderRadius:14, padding:14, minHeight:200 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ color:C.goldDark, fontWeight:800, fontSize:12, letterSpacing:2 }}>{col.titulo}</span>
                <span style={{ background:C.goldBg, color:C.goldDark, borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:700 }}>
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:C.textFaint, fontSize:12 }}>
                  Arrastra una tarjeta aquí
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {visibles.map(d => (
                    <div key={d.id} draggable onDragStart={(e) => onDragStart(e, d)}
                      style={{ background:C.surface, border:`1px solid ${C.border}`,
                        borderRadius:12, overflow:'hidden', boxShadow:'0 3px 10px rgba(43,36,32,0.06)',
                        cursor:'grab' }}>

                      {/* Header tarjeta */}
                      <div style={{ background:C.header,
                        padding:'10px 14px', display:'flex',
                        justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ background:C.gold, borderRadius:6, padding:'2px 8px',
                            color:C.header, fontSize:11, fontWeight:800 }}>
                            #{String(d.id).padStart(3,'0')}
                          </div>
                          <span title={d.tipoEntrega === 'recoger' ? 'Recoger en el local' : 'Domicilio'} style={{
                            display:'flex', alignItems:'center', gap:4, background:'#ffffff18',
                            color:C.gold, borderRadius:6, padding:'2px 7px', fontSize:9, fontWeight:800, letterSpacing:1 }}>
                            {d.tipoEntrega === 'recoger' ? <Store size={10}/> : <Truck size={10}/>}
                            {d.tipoEntrega === 'recoger' ? 'RECOGE' : 'DOMI'}
                          </span>
                          {d.estado === 'pendiente_confirmacion' && (
                            <span title="Pedido enviado desde el catálogo público" style={{
                              display:'flex', alignItems:'center', gap:4, background:'#ffffff18',
                              color:C.gold, borderRadius:6, padding:'2px 7px', fontSize:9, fontWeight:800, letterSpacing:1 }}>
                              <Globe size={10}/> CATÁLOGO
                            </span>
                          )}
                          {d.metodoPago && (
                            <span style={{
                              display:'flex', alignItems:'center', gap:4, background:'#ffffff18',
                              color:C.gold, borderRadius:6, padding:'2px 7px', fontSize:9, fontWeight:800, letterSpacing:1,
                              textTransform:'uppercase' }}>
                              {d.metodoPago}
                            </span>
                          )}
                        </div>
                        {d.estado !== 'despachado' && <Temporizador fecha={d.fecha}/>}
                      </div>

                      {/* Datos cliente */}
                      <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <User size={13} color={C.goldDark}/>
                          <span style={{ color:C.text, fontSize:14, fontWeight:700 }}>{d.nombre}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <Phone size={12} color={C.textFaint}/>
                          <span style={{ color:C.textMuted, fontSize:12 }}>{d.telefono}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                          <MapPin size={12} color={C.textFaint} style={{ marginTop:2 }}/>
                          <span style={{ color:C.textMuted, fontSize:12 }}>{d.direccion}</span>
                        </div>
                        {d.referencia && (
                          <div style={{ marginTop:4, marginLeft:20, color:C.textMuted, fontSize:11, fontStyle:'italic' }}>
                            {d.referencia}
                          </div>
                        )}
                        {d.creadoPor && (
                          <div style={{ marginTop:6, color:C.goldDark, fontSize:11 }}>Tomado por: {d.creadoPor}</div>
                        )}
                      </div>

                      {/* Pedido */}
                      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                        {d.items.map((p, i) => (
                          <div key={i} style={{ marginBottom:4 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                              <span style={{ color:C.text }}>x{p.cantidad} {p.nombre}</span>
                              <span style={{ color:C.goldDark, fontWeight:700 }}>
                                ${(p.precio * p.cantidad).toLocaleString('es-CO')}
                              </span>
                            </div>
                            {p.notas && (
                              <div style={{ color:C.terracotta, fontSize:10, fontStyle:'italic' }}>📝 {p.notas}</div>
                            )}
                          </div>
                        ))}
                        <div style={{ borderTop:`1px solid ${C.border}`, marginTop:6, paddingTop:6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.textMuted }}>
                            <span>Subtotal</span><span>${d.subtotal.toLocaleString('es-CO')}</span>
                          </div>
                          {d.costoEnvio > 0 && (
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.textMuted }}>
                              <span>Domicilio</span><span>${d.costoEnvio.toLocaleString('es-CO')}</span>
                            </div>
                          )}
                          <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                            <span style={{ color:C.textMuted, fontSize:11 }}>TOTAL</span>
                            <span style={{ color:C.goldDark, fontWeight:800, fontSize:14 }}>
                              ${d.total.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{ padding:'10px 14px', display:'flex', gap:6 }}>
                        {d.estado === 'pendiente_confirmacion' && (
                          <button onClick={() => confirmarYAvisar(d)}
                            title="Confirma el pedido y abre WhatsApp para avisarle al cliente"
                            style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none',
                              background:C.infoBg, color:C.info, fontWeight:700, fontSize:11,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <Check size={12}/> CONFIRMAR Y AVISAR
                          </button>
                        )}
                        {d.estado !== 'despachado' ? (
                          <button onClick={() => cambiarEstado(d.id, 'despachado')}
                            style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none',
                              background:C.success, color:'#fff', fontWeight:700, fontSize:11,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <CheckCircle size={13}/> DESPACHAR
                          </button>
                        ) : (
                          <button onClick={() => cambiarEstado(d.id, 'pendiente')}
                            style={{ flex:1, padding:'9px 0', borderRadius:8, border:`1px solid ${C.border}`,
                              background:'transparent', color:C.textMuted, fontWeight:700, fontSize:11,
                              cursor:'pointer' }}>
                            VOLVER A PENDIENTE
                          </button>
                        )}
                        {d.estado === 'despachado' && (
                          <button onClick={() => setReciboVer(d)}
                            style={{ padding:'9px 12px', borderRadius:8, border:`1px solid ${C.gold}`,
                              background:C.goldBg, color:C.goldDark, fontWeight:700, fontSize:11,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <Receipt size={13}/>
                          </button>
                        )}
                        {d.estado !== 'despachado' && (
                          <button onClick={() => setCancelModal(d.id)}
                            style={{ padding:'9px 12px', borderRadius:8, border:'none',
                              background:C.dangerBg, color:C.danger, fontWeight:700, fontSize:11,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <XCircle size={13}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length > LIMITE_VISIBLE && (
                    <button onClick={() => setExpandidos(prev => ({ ...prev, [col.key]: !expandido }))}
                      style={{ padding:'9px 0', borderRadius:8, border:`1px dashed ${C.border}`,
                        background:'transparent', color:C.textMuted, fontWeight:700, fontSize:11,
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      {expandido ? <><ChevronUp size={13}/> VER MENOS</> : <><ChevronDown size={13}/> VER MÁS ({items.length - LIMITE_VISIBLE})</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* MODAL NUEVO DOMICILIO */}
      {modalAbierto && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.gold}`, borderRadius:14,
            width:'100%', maxWidth:1080, margin:16, overflow:'hidden',
            display:'flex', flexDirection:'column', maxHeight:'94vh' }}>

            {/* HEADER */}
            <div style={{ background:C.header,
              padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:C.gold, fontSize:18, fontWeight:800, letterSpacing:2 }}>
                  🛵 NUEVO DOMICILIO
                </div>
                <div style={{ color:C.headerTextMuted, fontSize:11, letterSpacing:1, marginTop:2 }}>
                  EL CABUYAL • PALERMO
                </div>
              </div>
              <button onClick={() => setModal(false)}
                style={{ background:'#ffffff14', border:'1px solid #ffffff22', borderRadius:8,
                  padding:'8px 10px', color:C.headerTextMuted, cursor:'pointer' }}>
                <X size={16}/>
              </button>
            </div>

            <div className="cabuyal-domi-modal-row" style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* IZQUIERDA */}
              <div style={{ flex:1, minWidth:0, padding:24, overflowY:'auto',
                borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:20 }}>

                {/* Tipo de entrega */}
                <div>
                  <div style={{ color:C.goldDark, fontSize:11, fontWeight:800,
                    letterSpacing:2, marginBottom:10 }}>TIPO DE ENTREGA</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {[
                      { key:'domicilio', label:'DOMICILIO', icon:Truck },
                      { key:'recoger', label:'RECOGER EN EL LOCAL', icon:Store },
                    ].map(({ key, label, icon:Icon }) => (
                      <button key={key} onClick={() => setTipoEntrega(key)}
                        style={{ flex:1, padding:'12px 0', borderRadius:10, cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:12, fontWeight:800,
                          background: tipoEntrega===key ? C.goldBg : C.bgAlt,
                          color: tipoEntrega===key ? C.goldDark : C.textMuted,
                          border:`1.5px solid ${tipoEntrega===key ? C.gold : C.border}` }}>
                        <Icon size={16}/> {label}
                      </button>
                    ))}
                  </div>
                  {tipoEntrega === 'domicilio' && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>
                        Valor del domicilio (según la zona)
                      </div>
                      <input type="number" value={costoEnvio} onChange={e => setCostoEnvio(e.target.value)}
                        placeholder="Ej: 5000"
                        style={{ width:220, background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:8,
                          color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
                    </div>
                  )}
                </div>

                {/* Datos cliente */}
                <div>
                  <div style={{ color:C.goldDark, fontSize:11, fontWeight:800,
                    letterSpacing:2, marginBottom:10 }}>DATOS DEL CLIENTE</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { icon: <User size={14} color={C.goldDark}/>,  key:'nombre',    ph:'Nombre del cliente' },
                      { icon: <Phone size={14} color={C.goldDark}/>, key:'telefono',  ph:'Número de teléfono' },
                      { icon: <MapPin size={14} color={C.goldDark}/>,key:'direccion', ph: tipoEntrega==='recoger' ? 'Dirección (referencia, opcional)' : 'Dirección de entrega' },
                      { icon: <Home size={14} color={C.goldDark}/>,  key:'referencia',ph:'Datos de la casa (torre, apto, color, referencia)' },
                    ].map(f => (
                      <div key={f.key} style={{ display:'flex', alignItems:'center', gap:10,
                        background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:8,
                        padding:'0 12px', transition:'border-color 0.15s' }}>
                        {f.icon}
                        <input value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                          placeholder={f.ph}
                          style={{ flex:1, background:'transparent', border:'none', outline:'none',
                            color:C.text, fontSize:13, padding:'11px 0' }}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Método de pago */}
                <div>
                  <div style={{ color:C.goldDark, fontSize:11, fontWeight:800,
                    letterSpacing:2, marginBottom:10 }}>MÉTODO DE PAGO</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {METODOS_PAGO.map(({ key, label, icon:Icon }) => (
                      <button key={key} onClick={() => setMetodoPago(key)}
                        style={{ flex:1, padding:'10px 4px', borderRadius:9, cursor:'pointer',
                          display:'flex', flexDirection:'column', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                          background: metodoPago===key ? C.goldBg : C.bgAlt,
                          color: metodoPago===key ? C.goldDark : C.textMuted,
                          border:`1.5px solid ${metodoPago===key ? C.gold : C.border}` }}>
                        <Icon size={15}/> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buscador */}
                <div>
                  <div style={{ color:C.goldDark, fontSize:11, fontWeight:800,
                    letterSpacing:2, marginBottom:10 }}>AGREGAR ÍTEMS</div>
                  <div style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', background:C.bgAlt,
                      border:`1px solid ${C.gold}`, borderRadius:8, padding:'0 12px' }}>
                      <Search size={15} color={C.goldDark}/>
                      <input value={busqueda}
                        onChange={e => { setBusqueda(e.target.value); setItemSel(null) }}
                        onFocus={() => resultados.length > 0 && !itemSel && setMostrarDrop(true)}
                        placeholder="Buscar plato o bebida..."
                        style={{ flex:1, background:'transparent', border:'none', outline:'none',
                          color:C.text, fontSize:13, padding:'11px 10px' }}/>
                      {busqueda && (
                        <button onClick={() => { setBusqueda(''); setItemSel(null); setMostrarDrop(false) }}
                          style={{ background:'transparent', border:'none', color:C.textFaint, cursor:'pointer' }}>
                          <X size={14}/>
                        </button>
                      )}
                    </div>

                    {/* Dropdown */}
                    {mostrarDrop && !itemSel && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0,
                        background:C.surface, border:`1px solid ${C.gold}`, borderRadius:8,
                        zIndex:100, marginTop:4, maxHeight:260, overflowY:'auto',
                        boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
                        {resultados.map(r => (
                          <button key={r.id}
                            onMouseDown={e => { e.preventDefault(); seleccionar(r) }}
                            style={{ width:'100%', background:'transparent', border:'none',
                              borderBottom:`1px solid ${C.border}`, padding:'10px 14px',
                              display:'flex', justifyContent:'space-between',
                              alignItems:'center', cursor:'pointer', textAlign:'left' }}
                            onMouseEnter={e => e.currentTarget.style.background=C.bgAlt}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <div>
                              <div style={{ color:C.text, fontSize:13 }}>{r.nombre}</div>
                              <div style={{ color:C.textMuted, fontSize:11 }}>{r.categoria}</div>
                            </div>
                            <div style={{ color:C.goldDark, fontWeight:800, fontSize:13 }}>
                              ${r.precio.toLocaleString('es-CO')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item seleccionado */}
                  {itemSel && (
                    <div style={{ marginTop:10, background:C.goldBg, border:`1px solid ${C.gold}`,
                      borderRadius:8, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{itemSel.nombre}</div>
                          <div style={{ color:C.goldDark, fontSize:12 }}>
                            ${itemSel.precio.toLocaleString('es-CO')} c/u
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <button onClick={() => setCantidad(c => Math.max(1, c-1))}
                            style={{ width:28, height:28, borderRadius:6, border:`1px solid ${C.border}`,
                              background:C.surface, color:C.text, cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Minus size={12}/>
                          </button>
                          <span style={{ color:C.text, fontWeight:800, minWidth:24, textAlign:'center' }}>
                            {cantidad}
                          </span>
                          <button onClick={() => setCantidad(c => c+1)}
                            style={{ width:28, height:28, borderRadius:6, border:`1px solid ${C.border}`,
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
                          placeholder="Nota (ej: sin cebolla, poco frito)..."
                          style={{ flex:1, background:'transparent', border:'none', outline:'none',
                            color:C.text, fontSize:12, padding:'9px 0' }}/>
                      </div>
                      <button onClick={agregarItem}
                        style={{ background:C.gold, border:'none', borderRadius:8,
                          padding:'8px 16px', color:C.header, fontWeight:800,
                          fontSize:12, cursor:'pointer' }}>
                        + AGREGAR
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista de ítems */}
                {items.length > 0 && (
                  <div>
                    <div style={{ color:C.goldDark, fontSize:11, fontWeight:800,
                      letterSpacing:2, marginBottom:8 }}>ÍTEMS DEL PEDIDO</div>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ display:'flex', alignItems:'center', gap:8,
                        padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.text, fontSize:13 }}>{item.nombre}</div>
                          {item.notas && <div style={{ color:C.terracotta, fontSize:11, fontStyle:'italic' }}>📝 {item.notas}</div>}
                          <div style={{ color:C.goldDark, fontSize:11 }}>
                            ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <button onClick={() => editarCantidad(idx, -1)}
                            style={{ width:24, height:24, borderRadius:5, border:`1px solid ${C.border}`,
                              background:C.surface, color:C.text, cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Minus size={10}/>
                          </button>
                          <span style={{ color:C.text, fontWeight:800, minWidth:22,
                            textAlign:'center', fontSize:13 }}>{item.cantidad}</span>
                          <button onClick={() => editarCantidad(idx, 1)}
                            style={{ width:24, height:24, borderRadius:5, border:`1px solid ${C.border}`,
                              background:C.surface, color:C.text, cursor:'pointer',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Plus size={10}/>
                          </button>
                        </div>
                        <button onClick={() => editarCantidad(idx, -item.cantidad)}
                          style={{ background:'transparent', border:'none', color:C.textFaint,
                            cursor:'pointer', padding:4 }}
                          onMouseEnter={e => e.currentTarget.style.color=C.danger}
                          onMouseLeave={e => e.currentTarget.style.color=C.textFaint}>
                          <X size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DERECHA — resumen */}
              <div className="cabuyal-domi-modal-right" style={{ width:260, padding:20, background:C.surfaceAlt,
                display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>
                <div style={{ color:C.goldDark, fontSize:11, fontWeight:800, letterSpacing:2 }}>
                  RESUMEN
                </div>

                <div style={{ background:C.surface, borderRadius:8, padding:12,
                  border:`1px solid ${C.border}`, flex:1, overflowY:'auto' }}>
                  {items.length === 0
                    ? <div style={{ color:C.textFaint, fontSize:12, textAlign:'center', padding:'20px 0' }}>
                        Sin ítems aún
                      </div>
                    : items.map((x, idx) => (
                      <div key={idx} style={{ display:'flex', justifyContent:'space-between',
                        marginBottom:6, fontSize:12, gap:8 }}>
                        <span style={{ color:C.textMuted }}>x{x.cantidad} {x.nombre}</span>
                        <span style={{ color:C.goldDark, whiteSpace:'nowrap' }}>
                          ${(x.precio * x.cantidad).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))
                  }
                </div>

                <div style={{ background:C.header, borderRadius:8, padding:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.headerTextMuted, marginBottom:4 }}>
                    <span>Subtotal</span><span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {envio > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.headerTextMuted, marginBottom:4 }}>
                      <span>Domicilio</span><span>${envio.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, paddingTop:6, borderTop:'1px solid #ffffff22' }}>
                    <span style={{ color:C.headerTextMuted, fontSize:10, letterSpacing:1 }}>TOTAL</span>
                    <span style={{ color:C.gold, fontSize:20, fontWeight:800 }}>${total.toLocaleString('es-CO')}</span>
                  </div>
                  <div style={{ color:C.headerTextMuted, fontSize:10, marginTop:4, textAlign:'right' }}>
                    {items.reduce((s,x) => s+x.cantidad, 0)} ítem(s)
                  </div>
                </div>

                <button onClick={guardar}
                  style={{ width:'100%', padding:'13px 0', borderRadius:8, border:'none',
                    background: items.length > 0 && form.nombre ? C.gold : C.border,
                    color: items.length > 0 && form.nombre ? C.header : C.textFaint,
                    fontWeight:800, fontSize:13, cursor:'pointer', letterSpacing:1,
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
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.danger}`, borderRadius:12,
            padding:28, maxWidth:360, width:'100%', margin:16, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:8 }}>
              ¿Cancelar domicilio?
            </div>
            <div style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setCancelModal(null)}
                style={{ flex:1, padding:'11px 0', borderRadius:8, border:`1px solid ${C.border}`,
                  background:'transparent', color:C.text, cursor:'pointer', fontWeight:700 }}>
                VOLVER
              </button>
              <button onClick={() => cancelar(cancelModal)}
                style={{ flex:1, padding:'11px 0', borderRadius:8, border:'none',
                  background:C.danger, color:'#fff', cursor:'pointer', fontWeight:700 }}>
                SÍ, CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {reciboVer && <ReciboDomicilio domicilio={reciboVer} onClose={() => setReciboVer(null)} />}
    </div>
  )
}
