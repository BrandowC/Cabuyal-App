import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Minus, ShoppingCart, X, User, Phone, MapPin, Bike, Sun, Moon, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import api from '../lib/api'
import logo from '../assets/logo.png'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

const DIA = {
  bg: '#FAF6EF', bgAlt: '#F1E9D8', card: '#FFFFFF', border: '#E7DEC8',
  text: '#2B2420', textMuted: '#8A7C63', header: '#231D18', headerAlt: '#2F2721',
  headerText: '#F3E7C9', accent: '#C9A84C', accentDark: '#A9863A',
  accent2: '#B03A2E', accent2Dark: '#8F2E24', chip: '#F1E9D8', chipText: '#6B5F49',
  imgFrom: '#EFC9A0', imgTo: '#C9A84C',
}
const NOCHE = {
  bg: '#0c0b09', bgAlt: '#151210', card: '#1a1611', border: '#c9a84c33',
  text: '#f3ecd9', textMuted: '#a89a78', header: '#000000', headerAlt: '#151210',
  headerText: '#e8d9ab', accent: '#c9a84c', accentDark: '#dcb85c',
  accent2: '#e2645a', accent2Dark: '#e2645a', chip: '#211c16', chipText: '#c9bb98',
  imgFrom: '#3a2f1f', imgTo: '#5c4322',
}

const PASOS = ['Carrito', 'Datos', 'Confirmar']
const CHIPS_H = 52

const SLIDES = [
  { url: 'https://images.unsplash.com/photo-1558030137-d464dd688b00?w=1200&q=75&auto=format&fit=crop', titulo: 'Sabor a la parrilla', texto: 'Carnes y pollo asados al momento, todos los días.' },
  { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=75&auto=format&fit=crop', titulo: 'Hamburguesas de la casa', texto: 'Receta propia, ingredientes frescos.' },
  { url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=1200&q=75&auto=format&fit=crop', titulo: 'Para acompañar', texto: 'Cerveza y bebidas bien frías.' },
]

export default function Catalogo() {
  const [modo, setModo] = useState('dia')
  const T = modo === 'dia' ? DIA : NOCHE

  const [menu, setMenu] = useState([])
  const [carrito, setCarrito] = useState([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '' })
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [voladores, setVoladores] = useState([])
  const [pulso, setPulso] = useState(false)

  const carritoBtnRef = useRef(null)
  const voladorIdRef = useRef(0)
  const headerRef = useRef(null)
  const chipRefs = useRef({})
  const [headerH, setHeaderH] = useState(90)
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [slide, setSlide] = useState(0)

  useEffect(() => { api.getMenuPublico().then(setMenu) }, [])

  useEffect(() => {
    const medir = () => { if (headerRef.current) setHeaderH(headerRef.current.offsetHeight) }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500)
    return () => clearInterval(iv)
  }, [])

  const categorias = useMemo(() => [...new Set(menu.map((p) => p.categoria))], [menu])
  const porCategoria = useMemo(() => {
    const mapa = new Map()
    categorias.forEach((c) => mapa.set(c, menu.filter((p) => p.categoria === c)))
    return mapa
  }, [menu, categorias])

  useEffect(() => {
    if (categorias.length === 0) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cat = entry.target.id.replace('cat-', '')
          setCategoriaActiva(cat)
          chipRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }
      })
    }, { rootMargin: `-${headerH + CHIPS_H + 10}px 0px -70% 0px`, threshold: 0 })
    categorias.forEach((c) => {
      const el = document.getElementById(`cat-${c}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [categorias, headerH])

  const cantidadTotal = carrito.reduce((s, x) => s + x.cantidad, 0)
  const total = carrito.reduce((s, x) => s + x.precio * x.cantidad, 0)

  const irACategoria = (c) => {
    const el = document.getElementById(`cat-${c}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const lanzarVolador = (origenEl) => {
    const cartRect = carritoBtnRef.current?.getBoundingClientRect()
    if (!origenEl || !cartRect) return
    const o = origenEl.getBoundingClientRect()
    voladorIdRef.current += 1
    const id = voladorIdRef.current
    const start = { x: o.left + o.width / 2, y: o.top + o.height / 2 }
    const end = { x: cartRect.left + cartRect.width / 2, y: cartRect.top + cartRect.height / 2 }

    setVoladores((v) => [...v, { id, tx: start.x, ty: start.y, done: false }])
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVoladores((v) => v.map((f) => f.id === id ? { ...f, tx: end.x, ty: end.y, done: true } : f))
    }))
    setTimeout(() => {
      setVoladores((v) => v.filter((f) => f.id !== id))
      setPulso(true)
      setTimeout(() => setPulso(false), 260)
    }, 620)
  }

  const agregar = (plato, e) => {
    setCarrito((prev) => {
      const existe = prev.find((x) => x.id === plato.id)
      if (existe) return prev.map((x) => x.id === plato.id ? { ...x, cantidad: x.cantidad + 1 } : x)
      return [...prev, { ...plato, cantidad: 1 }]
    })
    lanzarVolador(e.currentTarget)
  }

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) => prev
      .map((x) => x.id === id ? { ...x, cantidad: x.cantidad + delta } : x)
      .filter((x) => x.cantidad > 0))
  }

  const abrirCarrito = () => { setPaso(0); setCarritoAbierto(true) }

  const enviarPedido = async () => {
    if (!form.nombre || !form.telefono || !form.direccion || carrito.length === 0) return
    setEnviando(true)
    try {
      await api.addDomicilioPublico({
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        items: carrito.map((x) => ({ nombre: x.nombre, precio: x.precio, cantidad: x.cantidad })),
        total,
      })

      if (WHATSAPP_NUMBER) {
        const lineas = carrito.map((x) => `• x${x.cantidad} ${x.nombre} — $${(x.precio * x.cantidad).toLocaleString('es-CO')}`)
        const mensaje = [
          'Pedido a domicilio — El Cabuyal',
          `Nombre: ${form.nombre}`, `Teléfono: ${form.telefono}`, `Dirección: ${form.direccion}`,
          '', ...lineas, '', `TOTAL: $${total.toLocaleString('es-CO')}`,
        ].join('\n')
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank')
      }

      setConfirmado(true)
      setCarrito([])
      setForm({ nombre: '', telefono: '', direccion: '' })
    } finally {
      setEnviando(false)
    }
  }

  if (confirmado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.bg, color: T.text, fontFamily: "'Segoe UI', sans-serif", padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <div style={{ color: T.accent2, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Pedido enviado!</div>
          <div style={{ color: T.textMuted, fontSize: 14, marginBottom: 26, maxWidth: 340 }}>
            Tu pedido llegó a El Cabuyal. Si se abrió WhatsApp, confirma el envío del mensaje para agilizar tu domicilio.
          </div>
          <button onClick={() => { setConfirmado(false); setCarritoAbierto(false) }}
            style={{ background: T.accent, border: 'none', borderRadius: 12, padding: '13px 26px',
              color: T.header, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
            Hacer otro pedido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes cabuyal-pop { 0% { transform: scale(1); } 45% { transform: scale(1.22); } 100% { transform: scale(1); } }
        @keyframes cabuyal-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .cabuyal-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .cabuyal-card:hover { transform: translateY(-5px); }
        .cabuyal-add:active { transform: scale(0.94); }
        .cabuyal-chip { transition: all .18s ease; }
        .cabuyal-seccion { scroll-margin-top: ${headerH + CHIPS_H + 12}px; }
        @keyframes cabuyal-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* HEADER */}
      <div ref={headerRef} style={{ background: T.header, borderBottom: `3px solid ${T.accent}`, padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${T.accent}`, boxShadow: `0 0 0 3px ${T.header}, 0 0 14px ${T.accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.headerAlt }}>
            <img src={logo} alt="El Cabuyal" style={{ width: '175%', height: '175%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ color: T.headerText, fontWeight: 800, fontSize: 17, letterSpacing: 3 }}>EL CABUYAL</div>
            <div style={{ color: T.accent, fontSize: 10, letterSpacing: 2 }}>PIDE TU DOMICILIO</div>
          </div>
        </div>
        <button onClick={() => setModo((m) => m === 'dia' ? 'noche' : 'dia')}
          aria-label="Cambiar tema"
          style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${T.accent}66`,
            background: T.headerAlt, color: T.accent, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {modo === 'dia' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>

      {/* CATEGORÍAS (navegación rápida a cada sección, resalta la sección visible) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 16px', position: 'sticky',
        top: headerH, background: T.bg, zIndex: 10, borderBottom: `1px solid ${T.border}`, height: CHIPS_H, boxSizing: 'border-box', alignItems: 'center' }}>
        {categorias.map((c) => {
          const activa = categoriaActiva === c
          return (
            <button key={c} ref={(el) => { chipRefs.current[c] = el }} className="cabuyal-chip" onClick={() => irACategoria(c)}
              style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                cursor: 'pointer', background: activa ? T.accent : T.chip, color: activa ? T.header : T.chipText,
                border: `1px solid ${activa ? T.accent : T.border}`,
                boxShadow: activa ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                transform: activa ? 'translateY(-1px)' : 'none' }}>
              {c}
            </button>
          )
        })}
      </div>

      {/* CARRUSEL + DESCRIPCIÓN */}
      <div style={{ padding: '16px 16px 4px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ position: 'relative', height: 220, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(43,36,32,0.15)' }}>
          {SLIDES.map((s, i) => (
            <div key={s.url} style={{ position: 'absolute', inset: 0,
              backgroundImage: `linear-gradient(0deg, rgba(20,16,10,0.75), rgba(20,16,10,0.1)), url(${s.url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: slide === i ? 1 : 0, transition: 'opacity 1s ease' }} />
          ))}
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, color: '#fff' }}>
            <div style={{ fontSize: 20, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {SLIDES[slide].titulo}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {SLIDES[slide].texto}
            </div>
          </div>
          <div style={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 5 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} aria-label={`Ir a la imagen ${i + 1}`}
                style={{ width: slide === i ? 18 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: slide === i ? T.accent : 'rgba(255,255,255,0.6)', transition: 'all .25s ease' }} />
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 8px 6px', color: T.textMuted, fontSize: 13, lineHeight: 1.6 }}>
          Restaurante familiar en Palermo — parrilla, pollo, hamburguesas y mucho más.
          Pide para recoger o a domicilio, ¡directo desde aquí!
        </div>
      </div>

      {/* SECCIONES POR CATEGORÍA */}
      <div style={{ padding: '4px 16px 110px', maxWidth: 980, margin: '0 auto' }}>
        {categorias.map((c) => (
          <div key={c} id={`cat-${c}`} className="cabuyal-seccion" style={{ paddingTop: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.accentDark, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              {c}
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {porCategoria.get(c).map((p) => (
                <div key={p.id} className="cabuyal-card" style={{ background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(43,36,32,0.06)' }}>
                  <div style={{ height: 110, background: p.imagenUrl
                    ? `center/cover no-repeat url(${p.imagenUrl})`
                    : `linear-gradient(135deg, ${T.imgFrom}, ${T.imgTo})` }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
                    {p.descripcion && (
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.descripcion}
                      </div>
                    )}
                    <div style={{ color: T.accent2, fontWeight: 800, fontSize: 14, marginTop: 6 }}>
                      ${p.precio.toLocaleString('es-CO')}
                    </div>
                    <button className="cabuyal-add" onClick={(e) => agregar(p, e)}
                      style={{ width: '100%', marginTop: 9, padding: '8px 0', borderRadius: 9, border: 'none',
                        background: T.accent, color: T.header, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'transform .12s ease' }}>
                      <Plus size={13} /> AGREGAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* VOLADORES (animación al carrito) */}
      {voladores.map((f) => (
        <div key={f.id} style={{ position: 'fixed', left: 0, top: 0, zIndex: 300, pointerEvents: 'none',
          width: 14, height: 14, borderRadius: '50%', background: T.accent,
          transform: `translate(${f.tx}px, ${f.ty}px) translate(-50%, -50%) scale(${f.done ? 0.3 : 1})`,
          opacity: f.done ? 0 : 1, transition: 'transform .62s cubic-bezier(.25,.85,.3,1), opacity .5s ease .12s' }} />
      ))}

      {/* BURBUJA DE CARRITO FLOTANTE */}
      <button ref={carritoBtnRef} onClick={abrirCarrito}
        style={{ position: 'fixed', bottom: 22, right: 22, width: 62, height: 62, borderRadius: '50%',
          background: T.accent2, border: `3px solid ${T.bg}`, color: '#fff', cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(176,58,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 40, animation: pulso ? 'cabuyal-pop .26s ease' : 'none' }}>
        <ShoppingCart size={24} />
        {cantidadTotal > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: T.header, color: T.accent,
            borderRadius: '50%', width: 24, height: 24, fontSize: 12, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.bg}` }}>
            {cantidadTotal}
          </span>
        )}
      </button>

      {/* PANEL DE CARRITO — a la derecha */}
      {carritoAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,10,0.5)', zIndex: 50,
          display: 'flex', justifyContent: 'flex-end' }}
          onClick={(e) => { if (e.target === e.currentTarget) setCarritoAbierto(false) }}>
          <div style={{ background: T.card, width: '100%', maxWidth: 420, height: '100vh', overflowY: 'auto',
            borderLeft: `1px solid ${T.border}`, boxShadow: '-8px 0 30px rgba(0,0,0,0.18)',
            animation: 'cabuyal-drawer-in .28s ease' }}>

            {/* Header + stepper */}
            <div style={{ padding: '18px 20px 12px', position: 'sticky', top: 0, background: T.card, zIndex: 5,
              borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ color: T.accent2, fontWeight: 800, letterSpacing: 1, fontSize: 13 }}>
                  {PASOS[paso].toUpperCase()}
                </div>
                <button onClick={() => setCarritoAbierto(false)}
                  style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {PASOS.map((p, i) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', flex: i < PASOS.length - 1 ? 1 : undefined }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
                      background: i <= paso ? T.accent : T.chip, color: i <= paso ? T.header : T.textMuted,
                      transition: 'background .2s' }}>
                      {i < paso ? <Check size={13} /> : i + 1}
                    </div>
                    {i < PASOS.length - 1 && (
                      <div style={{ flex: 1, height: 2, margin: '0 6px', background: i < paso ? T.accent : T.border, transition: 'background .2s' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '14px 20px 20px' }}>
              {/* PASO 1: CARRITO */}
              {paso === 0 && (
                <>
                  {carrito.length === 0 ? (
                    <div style={{ textAlign: 'center', color: T.textMuted, padding: '30px 0' }}>Tu carrito está vacío</div>
                  ) : carrito.map((x) => (
                    <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: x.imagenUrl
                        ? `center/cover no-repeat url(${x.imagenUrl})` : `linear-gradient(135deg, ${T.imgFrom}, ${T.imgTo})` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{x.nombre}</div>
                        <div style={{ color: T.accent2, fontSize: 12, fontWeight: 700 }}>${(x.precio * x.cantidad).toLocaleString('es-CO')}</div>
                      </div>
                      <button onClick={() => cambiarCantidad(x.id, -1)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, cursor: 'pointer' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 800 }}>{x.cantidad}</span>
                      <button onClick={() => cambiarCantidad(x.id, 1)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, cursor: 'pointer' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '18px 0' }}>
                    <span style={{ color: T.textMuted, fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: T.accent2, fontWeight: 800, fontSize: 20 }}>${total.toLocaleString('es-CO')}</span>
                  </div>

                  <BotonSiguiente T={T} disabled={carrito.length === 0} onClick={() => setPaso(1)} texto="CONTINUAR" />
                </>
              )}

              {/* PASO 2: DATOS */}
              {paso === 1 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, marginBottom: 20 }}>
                    {[
                      { icon: <User size={14} color={T.accent2} />, key: 'nombre', ph: 'Nombre completo' },
                      { icon: <Phone size={14} color={T.accent2} />, key: 'telefono', ph: 'Teléfono' },
                      { icon: <MapPin size={14} color={T.accent2} />, key: 'direccion', ph: 'Dirección de entrega' },
                    ].map((f) => (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.bgAlt,
                        border: `1px solid ${T.border}`, borderRadius: 10, padding: '0 12px' }}>
                        {f.icon}
                        <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          placeholder={f.ph}
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, padding: '12px 0' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <BotonAtras T={T} onClick={() => setPaso(0)} />
                    <BotonSiguiente T={T} disabled={!form.nombre || !form.telefono || !form.direccion}
                      onClick={() => setPaso(2)} texto="CONTINUAR" />
                  </div>
                </>
              )}

              {/* PASO 3: CONFIRMAR */}
              {paso === 2 && (
                <>
                  <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginTop: 10, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{form.nombre}</div>
                    <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 3 }}>{form.telefono}</div>
                    <div style={{ color: T.textMuted, fontSize: 12 }}>{form.direccion}</div>
                  </div>

                  {carrito.map((x) => (
                    <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                      <span>x{x.cantidad} {x.nombre}</span>
                      <span style={{ color: T.accent2, fontWeight: 700 }}>${(x.precio * x.cantidad).toLocaleString('es-CO')}</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0' }}>
                    <span style={{ color: T.textMuted, fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: T.accent2, fontWeight: 800, fontSize: 22 }}>${total.toLocaleString('es-CO')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <BotonAtras T={T} onClick={() => setPaso(1)} />
                    <button onClick={enviarPedido} disabled={enviando}
                      style={{ flex: 2, padding: '14px 0', borderRadius: 10, border: 'none',
                        background: T.accent2, color: '#fff', fontWeight: 800, fontSize: 13,
                        cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8 }}>
                      <Bike size={16} /> {enviando ? 'ENVIANDO…' : 'ENVIAR PEDIDO'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BotonSiguiente({ T, onClick, disabled, texto }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
        background: disabled ? T.border : T.accent, color: disabled ? T.textMuted : T.header,
        fontWeight: 800, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {texto} <ArrowRight size={15} />
    </button>
  )
}

function BotonAtras({ T, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, padding: '14px 0', borderRadius: 10, border: `1px solid ${T.border}`,
        background: 'transparent', color: T.textMuted, fontWeight: 700, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <ArrowLeft size={14} /> ATRÁS
    </button>
  )
}
