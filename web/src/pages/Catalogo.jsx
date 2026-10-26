import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Minus, ShoppingCart, X, User, Phone, MapPin, Bike, Sun, Moon, Check, ChevronLeft, ChevronRight, Home, StickyNote, Banknote, CreditCard, Landmark } from 'lucide-react'
import api from '../lib/api'
import logo from '../assets/logo.png'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

const DIA = {
  bg: '#F6F4EF', bgAlt: '#EFEBE1', card: '#FFFFFF', border: '#E7E2D6',
  text: '#20262B', textMuted: '#6B7280', header: '#0B2436', headerAlt: '#12707A',
  headerText: '#F4EFE4', accent: '#C9A84C', accentDark: '#A9863A',
  accent2: '#B03A2E', accent2Dark: '#8F2E24', accent3: '#12707A', accent3Dark: '#0D565E',
  chip: '#EFEBE1', chipText: '#5B6470',
  btnDark: '#0F4C75', btnLight: '#D6EAF8', btnLightText: '#0F4C75',
  imgFrom: '#EFC9A0', imgTo: '#C9A84C',
}
const NOCHE = {
  bg: '#0a0f14', bgAlt: '#111a21', card: '#101820', border: '#1c6b7333',
  text: '#eef3f5', textMuted: '#8fa3ac', header: '#000000', headerAlt: '#0d3138',
  headerText: '#e8d9ab', accent: '#c9a84c', accentDark: '#dcb85c',
  accent2: '#e2645a', accent2Dark: '#e2645a', accent3: '#2ba7b3', accent3Dark: '#2ba7b3',
  chip: '#111c22', chipText: '#a9c1c8',
  btnDark: '#1C6FA8', btnLight: '#123044', btnLightText: '#BFE0F5',
  imgFrom: '#0d3138', imgTo: '#12707A',
}

const EMOJI_CATEGORIA = {
  Parrilla: '🥩', Pollo: '🍗', Lasagna: '🍝', 'Rápidos': '🌭', Hamburguesas: '🍔', Adiciones: '🍟',
  Salsas: '🥫', Bebidas: '🥤', Limonadas: '🍋', Malteadas: '🥛', Jarras: '🍹', Gaseosas: '🥤', Cervezas: '🍺',
}
const emojiCategoria = (c) => EMOJI_CATEGORIA[c] || '🍽️'

// Categorías que se muestran agrupadas: arriba solo aparece "Bebidas"; al tocarla salen sus subcategorías
const GRUPOS = {
  Bebidas: {
    emoji: '🥤',
    subs: [
      { cat: 'Gaseosas', etiqueta: 'Gaseosas' },
      { cat: 'Jarras', etiqueta: 'Jarras' },
      { cat: 'Limonadas', etiqueta: 'Limonadas' },
      { cat: 'Malteadas', etiqueta: 'Malteadas' },
      { cat: 'Cervezas', etiqueta: 'Cervezas' },
      { cat: 'Bebidas', etiqueta: 'Sodas y agua' },
    ],
  },
}
const GRUPO_DE = Object.fromEntries(
  Object.entries(GRUPOS).flatMap(([grupo, g]) => g.subs.map((s) => [s.cat, grupo])),
)

const PASOS = ['Carrito', 'Datos', 'Confirmar']
const PASO_COLOR = (T) => [T.accent, T.accent3, T.accent2]

const METODOS_PAGO = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: Landmark },
]

const SLIDES = [
  { url: 'https://images.unsplash.com/photo-1558030137-d464dd688b00?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Sabor a la parrilla', texto: 'Carnes y pollo asados al momento.' },
  { url: 'https://images.unsplash.com/photo-1598679253544-2c97992403ea?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Papas a la francesa', texto: 'Doradas y crocantes, recién hechas.' },
  { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Hamburguesas de la casa', texto: 'Receta propia, ingredientes frescos.' },
  { url: 'https://images.unsplash.com/photo-1586793783658-261cddf883ef?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Alitas crocantes', texto: 'Bañadas en salsa, para compartir.' },
  { url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Para acompañar', texto: 'Cerveza y bebidas bien frías.' },
  { url: 'https://images.unsplash.com/photo-1586058584825-c1e87ed735b4?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Costillas BBQ', texto: 'Cocinadas lento, sabor ahumado.' },
  { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Pollo a la brasa', texto: 'Marinado con la receta de la casa.' },
  { url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=700&h=700&q=75&auto=format&fit=crop', titulo: 'Jugos naturales', texto: 'Frescos, hechos al momento.' },
]

function Coverflow({ T }) {
  const [i, setI] = useState(0)
  const [pausa, setPausa] = useState(false)
  const drag = useRef({ x: 0, activo: false })
  const n = SLIDES.length

  // Avanza solo; se reinicia tras cada cambio (también tras deslizar) y se pausa mientras el dedo está encima
  useEffect(() => {
    if (pausa) return undefined
    const t = setTimeout(() => setI((v) => (v + 1) % n), 3500)
    return () => clearTimeout(t)
  }, [n, i, pausa])

  const soltar = (e) => {
    if (!drag.current.activo) return
    drag.current.activo = false
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 35) setI((v) => (dx < 0 ? (v + 1) % n : (v - 1 + n) % n))
    setPausa(false)
  }

  return (
    <div style={{ padding: '18px 0 6px' }}>
      <div
        onPointerDown={(e) => { drag.current = { x: e.clientX, activo: true }; setPausa(true) }}
        onPointerUp={soltar} onPointerCancel={soltar} onPointerLeave={soltar}
        style={{ position: 'relative', height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center',
          perspective: '900px', overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none', cursor: 'grab' }}>
        {SLIDES.map((s, idx) => {
          let offset = idx - i
          if (offset > n / 2) offset -= n
          if (offset < -n / 2) offset += n
          const dist = Math.abs(offset)
          if (dist > 2) return null
          const scale = 1 - dist * 0.22
          const tilt = offset * 38
          const x = offset * 108
          return (
            <div key={s.url}
              style={{ position: 'absolute', width: 160, height: 160, borderRadius: 18, overflow: 'hidden', pointerEvents: 'none',
                boxShadow: dist === 0 ? '0 14px 30px rgba(0,0,0,0.28)' : '0 6px 16px rgba(0,0,0,0.18)',
                border: `2px solid ${dist === 0 ? T.accent : T.border}`,
                transform: `translateX(${x}px) scale(${scale}) rotateY(${-tilt}deg)`,
                zIndex: 10 - dist, transition: 'transform .5s cubic-bezier(.25,.85,.3,1), border-color .3s',
                backgroundImage: `url(${s.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {dist === 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.72), transparent 60%)',
                  display: 'flex', alignItems: 'flex-end', padding: 10 }}>
                  <div style={{ color: '#fff', fontSize: 11, fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                    {s.titulo}
                  </div>
                </div>
              )}
            </div>
          )
        })}

      </div>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <div style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{SLIDES[i].titulo}</div>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{SLIDES[i].texto}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
        {SLIDES.map((_, idx) => (
          <div key={idx}
            style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 4,
              background: i === idx ? T.accent : T.border, transition: 'all .25s ease' }} />
        ))}
      </div>
    </div>
  )
}

// Brasas que suben por la pantalla de bienvenida: posición, tamaño y ritmo fijos para que no cambien al renderizar
const BRASAS = [
  { x: 6, s: 5, d: 0, t: 9 }, { x: 14, s: 3, d: 2.5, t: 11 }, { x: 22, s: 6, d: 5, t: 10 }, { x: 31, s: 4, d: 1, t: 12 },
  { x: 40, s: 3, d: 6.5, t: 9 }, { x: 49, s: 5, d: 3, t: 11 }, { x: 58, s: 4, d: 7.5, t: 10 }, { x: 66, s: 6, d: 0.5, t: 13 },
  { x: 74, s: 3, d: 4, t: 9 }, { x: 82, s: 5, d: 8, t: 11 }, { x: 90, s: 4, d: 2, t: 10 }, { x: 96, s: 3, d: 5.5, t: 12 },
]

// Pantalla de entrada del catálogo: poco texto, fondo en movimiento y un solo botón
function Bienvenida({ onEntrar }) {
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previo }
  }, [])

  const entrar = () => {
    setSaliendo(true)
    setTimeout(onEntrar, 650)
  }

  return (
    <div className={`cab-bienvenida${saliendo ? ' saliendo' : ''}`} role="dialog" aria-label="Bienvenida a El Cabuyal">
      <style>{`
        .cab-bienvenida { position: fixed; inset: 0; z-index: 500; overflow: hidden; display: flex; align-items: center;
          justify-content: center; text-align: center; color: #F4EFE4; font-family: 'Segoe UI', sans-serif;
          background: radial-gradient(ellipse at 50% 30%, #12707A 0%, #0B2436 55%, #050f17 100%);
          transition: transform .65s cubic-bezier(.7,0,.3,1), opacity .65s ease; }
        .cab-bienvenida.saliendo { transform: translateY(-100%); opacity: 0.6; }
        .cab-fotos, .cab-foto, .cab-velo { position: absolute; inset: 0; }
        .cab-foto { background-size: cover; background-position: center; opacity: 0;
          animation: cab-foto 24s infinite; filter: saturate(1.15); }
        .cab-velo { background: linear-gradient(180deg, rgba(5,15,23,.55) 0%, rgba(8,28,42,.78) 55%, rgba(5,15,23,.92) 100%); }
        @keyframes cab-foto {
          0% { opacity: 0; transform: scale(1.05); } 6% { opacity: 1; } 25% { opacity: 1; }
          31% { opacity: 0; transform: scale(1.2); } 100% { opacity: 0; transform: scale(1.2); }
        }
        .cab-brasa { position: absolute; bottom: -12px; border-radius: 50%; opacity: 0;
          background: radial-gradient(circle, #FFD98A 0%, #C9A84C 55%, rgba(201,168,76,0) 100%);
          animation: cab-brasa linear infinite; }
        @keyframes cab-brasa {
          0% { transform: translateY(0) translateX(0); opacity: 0; } 12% { opacity: .9; }
          100% { transform: translateY(-105vh) translateX(26px); opacity: 0; }
        }
        .cab-centro { position: relative; display: flex; flex-direction: column; align-items: center; padding: 24px; }
        .cab-logo { width: 150px; height: 150px; border-radius: 50%; overflow: hidden; border: 3px solid #C9A84C;
          background: #12707A; display: flex; align-items: center; justify-content: center;
          animation: cab-pop .9s cubic-bezier(.2,1.3,.4,1) both, cab-brillo 3.2s ease-in-out 1s infinite; }
        .cab-logo img { width: 180%; height: 180%; object-fit: cover; }
        @keyframes cab-pop { from { opacity: 0; transform: scale(.4) rotate(-12deg); } to { opacity: 1; transform: none; } }
        @keyframes cab-brillo { 0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,.45), 0 18px 40px rgba(0,0,0,.5); }
          50% { box-shadow: 0 0 0 16px rgba(201,168,76,0), 0 18px 40px rgba(0,0,0,.5); } }
        .cab-titulo { margin: 26px 0 0; font-size: 34px; font-weight: 800; letter-spacing: 9px; padding-left: 9px;
          animation: cab-sube .8s ease .35s both; }
        .cab-linea { width: 70px; height: 2px; margin: 14px 0 12px; background: linear-gradient(90deg, transparent, #C9A84C, transparent);
          animation: cab-ancho .8s ease .6s both; }
        .cab-frase { font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #E8D9AB; animation: cab-sube .8s ease .7s both; }
        .cab-boton { position: relative; overflow: hidden; margin-top: 42px; border: none; cursor: pointer; font-family: inherit;
          background: linear-gradient(135deg, #FF7A59, #E8553E 55%, #C23B2A); color: #fff; font-weight: 800; font-size: 15px;
          letter-spacing: 5px; padding: 16px 44px 16px 49px; border-radius: 999px; display: flex; align-items: center; gap: 10px;
          box-shadow: 0 12px 30px rgba(232,85,62,.4); animation: cab-sube .8s ease 1s both, cab-latido 2.4s ease-in-out 2s infinite;
          transition: transform .2s ease; }
        .cab-boton:hover { transform: translateY(-3px) scale(1.04); }
        .cab-boton:active { transform: scale(.96); }
        .cab-boton::after { content: ''; position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent); transform: skewX(-20deg);
          animation: cab-brilla 3.4s ease-in-out 2.4s infinite; }
        @keyframes cab-sube { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        @keyframes cab-ancho { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: none; } }
        @keyframes cab-latido { 0%,100% { box-shadow: 0 12px 30px rgba(232,85,62,.4); } 50% { box-shadow: 0 12px 44px rgba(232,85,62,.75); } }
        @keyframes cab-brilla { 0% { left: -80%; } 35%,100% { left: 150%; } }
        @media (max-width: 480px) { .cab-logo { width: 124px; height: 124px; } .cab-titulo { font-size: 27px; letter-spacing: 7px; } }
        @media (prefers-reduced-motion: reduce) {
          .cab-foto, .cab-brasa, .cab-logo, .cab-boton, .cab-boton::after { animation: none !important; }
          .cab-foto:first-child { opacity: 1; }
        }
      `}</style>

      <div className="cab-fotos" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="cab-foto" style={{ backgroundImage: `url(${SLIDES[i].url})`, animationDelay: `${i * 6}s` }} />
        ))}
        <div className="cab-velo" />
        {BRASAS.map((b, i) => (
          <span key={i} className="cab-brasa"
            style={{ left: `${b.x}%`, width: b.s * 2, height: b.s * 2, animationDuration: `${b.t}s`, animationDelay: `${b.d}s` }} />
        ))}
      </div>

      <div className="cab-centro">
        <div className="cab-logo"><img src={logo} alt="El Cabuyal" /></div>
        <h1 className="cab-titulo">EL CABUYAL</h1>
        <div className="cab-linea" />
        <div className="cab-frase">Sabor a la parrilla</div>
        <button className="cab-boton" onClick={entrar} autoFocus>
          ENTRAR <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

export default function Catalogo() {
  const [bienvenida, setBienvenida] = useState(true)
  const [modo, setModo] = useState('dia')
  const T = modo === 'dia' ? DIA : NOCHE

  const [menu, setMenu] = useState([])
  const [carrito, setCarrito] = useState([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', referencia: '' })
  const [tipoEntrega, setTipoEntrega] = useState('domicilio')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [voladores, setVoladores] = useState([])
  const [pulso, setPulso] = useState(false)

  const carritoBtnRef = useRef(null)
  const voladorIdRef = useRef(0)
  const productosRef = useRef(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [subFiltro, setSubFiltro] = useState('')
  const [verProducto, setVerProducto] = useState(null)

  useEffect(() => { api.getMenuPublico().then(setMenu) }, [])

  const categorias = useMemo(() => [...new Set(menu.map((p) => p.categoria))], [menu])
  const porCategoria = useMemo(() => {
    const mapa = new Map()
    categorias.forEach((c) => mapa.set(c, menu.filter((p) => p.categoria === c)))
    return mapa
  }, [menu, categorias])

  // Tarjetas de arriba: las categorías sueltas más los grupos (Bebidas), sin repetir y en el orden del menú
  const tarjetas = useMemo(() => [...new Set(categorias.map((c) => GRUPO_DE[c] || c))], [categorias])
  const subsDe = (t) => (GRUPOS[t] ? GRUPOS[t].subs.filter((s) => porCategoria.get(s.cat)?.length) : [])
  const platosDe = (t) => (GRUPOS[t]
    ? subsDe(t).flatMap((s) => porCategoria.get(s.cat))
    : porCategoria.get(t) || [])

  const categoriaActiva = tarjetas.includes(categoriaFiltro) ? categoriaFiltro : tarjetas[0] || ''
  const subs = subsDe(categoriaActiva)
  const subActiva = subs.some((s) => s.cat === subFiltro) ? subFiltro : ''
  const emojiDe = (t) => GRUPOS[t]?.emoji || emojiCategoria(t)

  const elegirCategoria = (c) => {
    setCategoriaFiltro(c)
    setSubFiltro('')
    // Lleva la vista a los productos para que se vea el cambio al instante (útil en celular)
    requestAnimationFrame(() => productosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const cantidadTotal = carrito.reduce((s, x) => s + x.cantidad, 0)
  const total = carrito.reduce((s, x) => s + x.precio * x.cantidad, 0)

  const productosVista = subActiva ? porCategoria.get(subActiva) || [] : platosDe(categoriaActiva)

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
      return [...prev, { ...plato, cantidad: 1, notas: '' }]
    })
    lanzarVolador(e.currentTarget)
  }

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) => prev
      .map((x) => x.id === id ? { ...x, cantidad: x.cantidad + delta } : x)
      .filter((x) => x.cantidad > 0))
  }

  const cambiarNota = (id, notas) => {
    setCarrito((prev) => prev.map((x) => x.id === id ? { ...x, notas } : x))
  }

  const abrirCarrito = () => { setPaso(0); setErrorEnvio(''); setCarritoAbierto(true) }

  const handleFormChange = (key, value) => {
    let v = value
    if (key === 'nombre') v = v.replace(/[^a-zA-ZÀ-ÿñÑ\s]/g, '')
    if (key === 'telefono') v = v.replace(/[^0-9]/g, '').slice(0, 10)
    setForm((prev) => ({ ...prev, [key]: v }))
  }

  const esRecoger = tipoEntrega === 'recoger'
  const datosCompletos = !!form.nombre && form.telefono.length === 10 && (esRecoger || !!form.direccion)

  const enviarPedido = async () => {
    if (!datosCompletos || carrito.length === 0) return
    setEnviando(true)
    setErrorEnvio('')
    try {
      await api.addDomicilioPublico({
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: esRecoger ? '' : form.direccion,
        referencia: esRecoger ? '' : form.referencia.trim(),
        tipoEntrega,
        metodoPago,
        items: carrito.map((x) => ({ nombre: x.nombre, precio: x.precio, cantidad: x.cantidad, notas: x.notas || '' })),
        total,
      })

      if (WHATSAPP_NUMBER) {
        const lineas = carrito.map((x) => {
          let linea = `• x${x.cantidad} ${x.nombre} — $${(x.precio * x.cantidad).toLocaleString('es-CO')}`
          if (x.notas) linea += `\n   📝 ${x.notas}`
          return linea
        })
        const mensaje = [
          esRecoger ? '🏪 Pedido para recoger — El Cabuyal' : '🛵 Pedido a domicilio — El Cabuyal',
          `Nombre: ${form.nombre}`, `Teléfono: ${form.telefono}`,
          ...(esRecoger ? [] : [`Dirección: ${form.direccion}`]),
          ...(!esRecoger && form.referencia.trim() ? [`Referencia: ${form.referencia.trim()}`] : []),
          '', ...lineas, '',
          `Subtotal: $${total.toLocaleString('es-CO')}`,
          `Método de pago: ${METODOS_PAGO.find((m) => m.key === metodoPago)?.label || metodoPago}`,
        ].join('\n')
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank')
      }

      setConfirmado(true)
      setCarrito([])
      setForm({ nombre: '', telefono: '', direccion: '', referencia: '' })
      setMetodoPago('efectivo')
    } catch (err) {
      setErrorEnvio(err.message || 'No se pudo enviar el pedido. Intenta de nuevo.')
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

  const [c1, c2, c3] = PASO_COLOR(T)
  const colorPaso = [c1, c2, c3][paso]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes cabuyal-pop { 0% { transform: scale(1); } 45% { transform: scale(1.22); } 100% { transform: scale(1); } }
        @keyframes cabuyal-modal-in { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .cabuyal-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; cursor: pointer; }
        .cabuyal-card:hover { transform: translateY(-5px); }
        .cabuyal-pop { width: 124px; height: 124px; transition: transform .3s cubic-bezier(.25,.85,.3,1); }
        .cabuyal-card:hover .cabuyal-pop { transform: scale(1.08) rotate(-4deg); }
        .cabuyal-card:active .cabuyal-pop { transform: scale(1.05); }
        html, body { overflow-x: hidden; }
        .cabuyal-add:active { transform: scale(0.94); }
        .cabuyal-cats { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 10px; }
        .cabuyal-cat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 6px 10px;
          border-radius: 16px; cursor: pointer; font-family: inherit; text-align: center;
          transition: transform .2s cubic-bezier(.25,.85,.3,1), box-shadow .2s ease, background .2s ease; }
        .cabuyal-cat:hover { transform: translateY(-3px); }
        .cabuyal-cat:active { transform: scale(0.96); }
        .cabuyal-cat.activa { transform: translateY(-3px) scale(1.03); }
        .cabuyal-cat-icono { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 24px; transition: transform .25s ease; }
        .cabuyal-cat:hover .cabuyal-cat-icono, .cabuyal-cat.activa .cabuyal-cat-icono { transform: scale(1.15) rotate(-6deg); }
        .cabuyal-cat-nombre { font-size: 12px; font-weight: 800; line-height: 1.2; }
        .cabuyal-cat-cant { font-size: 10px; }
        .cabuyal-subs { display: flex; flex-wrap: wrap; gap: 8px; margin: -2px 0 6px; animation: cabuyal-modal-in .25s ease; }
        .cabuyal-sub { padding: 7px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; cursor: pointer;
          font-family: inherit; transition: transform .15s ease, background .2s ease; }
        .cabuyal-sub:hover { transform: translateY(-2px); }
        .cabuyal-sub:active { transform: scale(0.95); }
        @keyframes cabuyal-card-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .cabuyal-card { animation: cabuyal-card-in .4s ease backwards; }
        .cabuyal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 62px 14px; padding-top: 52px; }
        .cabuyal-header-inner { gap: 14px; }
        .cabuyal-logo { width: 70px; height: 70px; }
        @media (max-width: 480px) {
          .cabuyal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 62px 10px; padding-top: 52px; }
          .cabuyal-pop { width: 104px; height: 104px; }
          .cabuyal-header-inner { gap: 10px; }
          .cabuyal-logo { width: 52px; height: 52px; }
          .cabuyal-titulo { font-size: 15px !important; letter-spacing: 1.5px !important; }
          .cabuyal-sub { font-size: 9px !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ background: T.header, backgroundImage: `linear-gradient(135deg, ${T.header}, ${T.headerAlt})`,
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        position: 'sticky', top: 0, zIndex: 20, borderBottom: `3px solid ${T.accent}` }}>
        <div className="cabuyal-header-inner" style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <div className="cabuyal-logo" style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${T.accent}`, boxShadow: `0 0 0 3px ${T.header}88, 0 0 16px ${T.accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.headerAlt }}>
            <img src={logo} alt="El Cabuyal" style={{ width: '180%', height: '180%', objectFit: 'cover' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cabuyal-titulo" style={{ color: T.headerText, fontWeight: 800, fontSize: 18, letterSpacing: 3, whiteSpace: 'nowrap' }}>EL CABUYAL</div>
            <div className="cabuyal-sub" style={{ color: T.accent, fontSize: 10, letterSpacing: 2, whiteSpace: 'nowrap' }}>PIDE TU DOMICILIO</div>
          </div>
        </div>
        <button onClick={() => setModo((m) => m === 'dia' ? 'noche' : 'dia')}
          aria-label="Cambiar tema"
          style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.accent}66`,
            background: 'rgba(255,255,255,0.08)', color: T.accent, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {modo === 'dia' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      {/* CARRUSEL COVERFLOW + DESCRIPCIÓN */}
      <div style={{ padding: '4px 16px 4px', maxWidth: 980, margin: '0 auto' }}>
        <Coverflow T={T} />
        <div style={{ textAlign: 'center', padding: '6px 8px 6px', color: T.textMuted, fontSize: 13, lineHeight: 1.6 }}>
          Restaurante familiar en Palermo — parrilla, pollo, hamburguesas y mucho más.
          Pide para recoger o a domicilio, ¡directo desde aquí!
        </div>
      </div>

      {/* CATEGORÍAS — todas visibles a la vez, se ajustan al ancho de la pantalla */}
      <div style={{ padding: '10px 16px 0', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: T.textMuted, marginBottom: 10, textAlign: 'center' }}>
          ¿QUÉ TE ANTOJAS HOY?
        </div>
        <div className="cabuyal-cats">
          {tarjetas.map((c) => {
            const activa = categoriaActiva === c
            const cantidad = platosDe(c).length
            return (
              <button key={c} className={`cabuyal-cat${activa ? ' activa' : ''}`} onClick={() => elegirCategoria(c)}
                aria-pressed={activa}
                style={{ background: activa ? T.btnDark : T.card, color: activa ? '#fff' : T.text,
                  border: `1px solid ${activa ? T.btnDark : T.border}`,
                  boxShadow: activa ? '0 8px 18px rgba(15,76,117,0.35)' : '0 1px 4px rgba(11,36,54,0.06)' }}>
                <span className="cabuyal-cat-icono"
                  style={{ background: activa ? 'rgba(255,255,255,0.18)' : T.chip }}>{emojiDe(c)}</span>
                <span className="cabuyal-cat-nombre">{c}</span>
                <span className="cabuyal-cat-cant" style={{ color: activa ? 'rgba(255,255,255,0.8)' : T.textMuted }}>
                  {cantidad} {cantidad === 1 ? 'plato' : 'platos'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* PRODUCTOS DE LA CATEGORÍA SELECCIONADA (sin navegar de página, se filtra aquí mismo) */}
      <div ref={productosRef} style={{ padding: '18px 16px 110px', maxWidth: 980, margin: '0 auto', scrollMarginTop: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.accentDark, marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{emojiDe(categoriaActiva)}</span>
          {categoriaActiva}
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        {/* Subcategorías del grupo (solo aparecen en Bebidas) */}
        {subs.length > 0 && (
          <div className="cabuyal-subs">
            {[{ cat: '', etiqueta: 'Todas', n: platosDe(categoriaActiva).length },
              ...subs.map((s) => ({ ...s, n: porCategoria.get(s.cat).length }))].map((s) => {
              const activa = subActiva === s.cat
              return (
                <button key={s.cat || 'todas'} className={`cabuyal-sub${activa ? ' activa' : ''}`} onClick={() => setSubFiltro(s.cat)}
                  aria-pressed={activa}
                  style={{ background: activa ? T.accent2 : T.card, color: activa ? '#fff' : T.text,
                    border: `1px solid ${activa ? T.accent2 : T.border}` }}>
                  {s.etiqueta} <span style={{ opacity: 0.7, fontWeight: 600 }}>{s.n}</span>
                </button>
              )
            })}
          </div>
        )}
        <div className="cabuyal-grid">
          {productosVista.map((p) => (
            <div key={p.id} className="cabuyal-card" onClick={() => setVerProducto(p)} style={{ background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, boxShadow: '0 2px 8px rgba(11,36,54,0.08)', position: 'relative',
              display: 'flex', flexDirection: 'column' }}>
              {/* La imagen sobresale de la tarjeta por arriba */}
              <div className="cabuyal-pop" style={{ margin: '-52px auto 0', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: `linear-gradient(135deg, ${T.imgFrom}, ${T.imgTo})`,
                border: `4px solid ${T.card}`, boxSizing: 'border-box',
                boxShadow: '0 16px 22px -6px rgba(0,0,0,0.45), 0 4px 8px rgba(0,0,0,0.2)' }}>
                {p.imagenUrl && (
                  <img src={p.imagenUrl} alt={p.nombre} loading="lazy" draggable={false}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
              </div>
              <div style={{ padding: '10px 12px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
                {p.descripcion && (
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.descripcion}
                  </div>
                )}
                <div style={{ color: T.accent2, fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                  ${p.precio.toLocaleString('es-CO')}
                </div>
                <button className="cabuyal-add" onClick={(e) => { e.stopPropagation(); agregar(p, e) }}
                  style={{ width: '100%', marginTop: 'auto', padding: '10px 0', borderRadius: 9, border: 'none',
                    background: T.btnDark, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'transform .12s ease' }}>
                  <Plus size={13} /> AGREGAR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VISTA RÁPIDA DE PRODUCTO */}
      {verProducto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,20,0.6)', zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setVerProducto(null) }}>
          <div style={{ background: T.card, width: '100%', maxWidth: 400, maxHeight: '86vh', overflowY: 'auto',
            borderRadius: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.35)', animation: 'cabuyal-modal-in .22s ease' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ height: 220, background: verProducto.imagenUrl
                ? `center/cover no-repeat url(${verProducto.imagenUrl})`
                : `linear-gradient(135deg, ${T.imgFrom}, ${T.imgTo})`, borderRadius: '18px 18px 0 0' }} />
              <button onClick={() => setVerProducto(null)} aria-label="Cerrar"
                style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%',
                  border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 19, fontWeight: 800 }}>{verProducto.nombre}</div>
              {verProducto.descripcion && (
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 8, lineHeight: 1.6 }}>
                  {verProducto.descripcion}
                </div>
              )}
              <div style={{ color: T.accent2, fontWeight: 800, fontSize: 22, marginTop: 14 }}>
                ${verProducto.precio.toLocaleString('es-CO')}
              </div>
              <button className="cabuyal-add" onClick={(e) => { agregar(verProducto, e); setVerProducto(null) }}
                style={{ width: '100%', marginTop: 16, padding: '13px 0', borderRadius: 10, border: 'none',
                  background: T.btnDark, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={15} /> AGREGAR AL CARRITO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLADORES (animación al carrito) */}
      {voladores.map((f) => (
        <div key={f.id} style={{ position: 'fixed', left: 0, top: 0, zIndex: 300, pointerEvents: 'none',
          width: 14, height: 14, borderRadius: '50%', background: T.accent,
          transform: `translate(${f.tx}px, ${f.ty}px) translate(-50%, -50%) scale(${f.done ? 0.3 : 1})`,
          opacity: f.done ? 0 : 1, transition: 'transform .62s cubic-bezier(.25,.85,.3,1), opacity .5s ease .12s' }} />
      ))}

      {/* BURBUJA DE CARRITO FLOTANTE */}
      <button ref={carritoBtnRef} onClick={abrirCarrito}
        style={{ position: 'fixed', bottom: 22, right: 22, width: 60, height: 60, borderRadius: '50%',
          background: T.accent2, border: `3px solid ${T.bg}`, color: '#fff', cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(176,58,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 40, animation: pulso ? 'cabuyal-pop .26s ease' : 'none' }}>
        <ShoppingCart size={22} />
        {cantidadTotal > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: T.header, color: T.accent,
            borderRadius: '50%', width: 22, height: 22, fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.bg}` }}>
            {cantidadTotal}
          </span>
        )}
      </button>

      {bienvenida && <Bienvenida onEntrar={() => setBienvenida(false)} />}

      {/* WIZARD DE COMPRA — modal centrado */}
      {carritoAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,20,0.55)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setCarritoAbierto(false) }}>
          <div style={{ background: T.card, width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto',
            borderRadius: 18, borderTop: `4px solid ${colorPaso}`, boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            animation: 'cabuyal-modal-in .25s ease' }}>

            {/* Header + stepper de colores */}
            <div style={{ padding: '16px 18px 12px', position: 'sticky', top: 0, background: T.card, zIndex: 5,
              borderBottom: `1px solid ${T.border}`, borderRadius: '14px 14px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ color: colorPaso, fontWeight: 800, letterSpacing: 1, fontSize: 12, transition: 'color .2s' }}>
                  {PASOS[paso].toUpperCase()}
                </div>
                <button onClick={() => setCarritoAbierto(false)}
                  style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {PASOS.map((p, idx) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', flex: idx < PASOS.length - 1 ? 1 : undefined }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0,
                      background: idx <= paso ? [c1, c2, c3][idx] : T.chip, color: idx <= paso ? '#fff' : T.textMuted,
                      transition: 'background .2s' }}>
                      {idx < paso ? <Check size={11} /> : idx + 1}
                    </div>
                    {idx < PASOS.length - 1 && (
                      <div style={{ flex: 1, height: 2, margin: '0 4px',
                        background: idx < paso ? [c1, c2, c3][idx + 1] : T.border, transition: 'background .2s' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 16px 18px' }}>
              {/* PASO 1: CARRITO */}
              {paso === 0 && (
                <>
                  {carrito.length === 0 ? (
                    <div style={{ textAlign: 'center', color: T.textMuted, padding: '26px 0', fontSize: 13 }}>Tu carrito está vacío</div>
                  ) : carrito.map((x) => (
                    <div key={x.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, background: x.imagenUrl
                          ? `center/cover no-repeat url(${x.imagenUrl})` : `linear-gradient(135deg, ${T.imgFrom}, ${T.imgTo})` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.nombre}</div>
                          <div style={{ color: T.accent2, fontSize: 11, fontWeight: 700 }}>${(x.precio * x.cantidad).toLocaleString('es-CO')}</div>
                        </div>
                        <button onClick={() => cambiarCantidad(x.id, -1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, cursor: 'pointer', flexShrink: 0 }}>
                          <Minus size={10} />
                        </button>
                        <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 800, fontSize: 12 }}>{x.cantidad}</span>
                        <button onClick={() => cambiarCantidad(x.id, 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, cursor: 'pointer', flexShrink: 0 }}>
                          <Plus size={10} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 40 }}>
                        <StickyNote size={11} color={T.textMuted} style={{ flexShrink: 0 }} />
                        <input value={x.notas || ''} onChange={(e) => cambiarNota(x.id, e.target.value)}
                          placeholder="Sin tomate, sin cebolla…"
                          style={{ flex: 1, background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 6,
                            color: T.text, fontSize: 11, padding: '5px 8px', outline: 'none' }} />
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', padding: '10px 12px',
                    background: `${c1}18`, borderRadius: 10 }}>
                    <span style={{ color: T.textMuted, fontWeight: 700, fontSize: 12 }}>SUBTOTAL</span>
                    <span style={{ color: c1 === T.accent ? T.accentDark : c1, fontWeight: 800, fontSize: 17 }}>${total.toLocaleString('es-CO')}</span>
                  </div>

                  <BotonPaso T={T} disabled={carrito.length === 0} onClick={() => setPaso(1)} texto="CONTINUAR" />
                </>
              )}

              {/* PASO 2: DATOS */}
              {paso === 1 && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 12 }}>
                    {[
                      { key: 'domicilio', emoji: '🛵', label: 'Domicilio' },
                      { key: 'recoger', emoji: '🏪', label: 'Recoger' },
                    ].map(({ key, emoji, label }) => (
                      <button key={key} onClick={() => setTipoEntrega(key)}
                        style={{ flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          background: tipoEntrega === key ? T.btnDark : T.bgAlt,
                          color: tipoEntrega === key ? '#fff' : T.textMuted,
                          border: `1px solid ${tipoEntrega === key ? T.btnDark : T.border}` }}>
                        <span style={{ fontSize: 17 }}>{emoji}</span> {label}
                      </button>
                    ))}
                  </div>
                  {esRecoger && (
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, lineHeight: 1.4 }}>
                      Pasas por tu pedido al local. Solo necesitamos tu nombre y celular.
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {[
                      { icon: <User size={13} color={c2} />, key: 'nombre', ph: 'Nombre completo (solo letras)' },
                      { icon: <Phone size={13} color={c2} />, key: 'telefono', ph: 'Celular (10 dígitos)', inputMode: 'numeric', maxLength: 10 },
                      ...(esRecoger ? [] : [
                        { icon: <MapPin size={13} color={c2} />, key: 'direccion', ph: 'Dirección de entrega' },
                        { icon: <Home size={13} color={c2} />, key: 'referencia', ph: 'Datos de la casa (torre, apto, color, referencia)' },
                      ]),
                    ].map((f) => (
                      <div key={f.key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bgAlt,
                          border: `1px solid ${T.border}`, borderRadius: 9, padding: '0 10px' }}>
                          {f.icon}
                          <input value={form[f.key]} onChange={(e) => handleFormChange(f.key, e.target.value)}
                            placeholder={f.ph} inputMode={f.inputMode} maxLength={f.maxLength}
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, padding: '10px 0' }} />
                        </div>
                        {f.key === 'telefono' && form.telefono.length > 0 && form.telefono.length < 10 && (
                          <div style={{ color: T.accent2, fontSize: 10, marginTop: 3, marginLeft: 4 }}>
                            {form.telefono.length}/10 dígitos
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <BotonAtras T={T} onClick={() => setPaso(0)} />
                    <BotonPaso T={T} disabled={!datosCompletos}
                      onClick={() => setPaso(2)} texto="CONTINUAR" />
                  </div>
                </>
              )}

              {/* PASO 3: CONFIRMAR */}
              {paso === 2 && (
                <>
                  <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 11, padding: 12, marginTop: 6, marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6, color: T.accent3 }}>
                      {esRecoger ? '🏪 Recoger en el local' : '🛵 Domicilio'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{form.nombre}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 2 }}>{form.telefono}</div>
                    {!esRecoger && <div style={{ color: T.textMuted, fontSize: 11 }}>{form.direccion}</div>}
                    {!esRecoger && form.referencia && (
                      <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{form.referencia}</div>
                    )}
                  </div>

                  {carrito.map((x) => (
                    <div key={x.id} style={{ padding: '4px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>x{x.cantidad} {x.nombre}</span>
                        <span style={{ color: T.accent2, fontWeight: 700 }}>${(x.precio * x.cantidad).toLocaleString('es-CO')}</span>
                      </div>
                      {x.notas && <div style={{ color: T.accent2, fontSize: 10, fontStyle: 'italic' }}>📝 {x.notas}</div>}
                    </div>
                  ))}

                  <div style={{ margin: '12px 0 4px' }}>
                    <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
                      MÉTODO DE PAGO
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {METODOS_PAGO.map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setMetodoPago(key)}
                          style={{ flex: 1, padding: '10px 2px', borderRadius: 9, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                            background: metodoPago === key ? T.btnDark : T.bgAlt,
                            color: metodoPago === key ? '#fff' : T.textMuted,
                            border: `1px solid ${metodoPago === key ? T.btnDark : T.border}` }}>
                          <Icon size={15} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ margin: '14px 0', padding: '10px 12px', background: `${c3}18`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: T.textMuted, fontWeight: 700, fontSize: 12 }}>SUBTOTAL</span>
                      <span style={{ color: c3, fontWeight: 800, fontSize: 19 }}>${total.toLocaleString('es-CO')}</span>
                    </div>
                    {!esRecoger && (
                      <div style={{ color: T.textMuted, fontSize: 10, marginTop: 4 }}>
                        El costo del domicilio se confirma al validar tu pedido.
                      </div>
                    )}
                  </div>

                  {errorEnvio && (
                    <div style={{ background: '#FBE7E5', color: '#B03A2E', borderRadius: 8, padding: '9px 12px',
                      fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                      {errorEnvio}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <BotonAtras T={T} onClick={() => setPaso(1)} />
                    <button onClick={enviarPedido} disabled={enviando}
                      style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none',
                        background: T.btnDark, color: '#fff', fontWeight: 800, fontSize: 12,
                        cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 7 }}>
                      <Bike size={14} /> {enviando ? 'ENVIANDO…' : 'ENVIAR PEDIDO'}
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

function BotonPaso({ T, onClick, disabled, texto }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
        background: disabled ? T.bgAlt : T.btnDark, color: disabled ? T.textMuted : '#fff',
        fontWeight: 800, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {texto} <ChevronRight size={14} />
    </button>
  )
}

function BotonAtras({ T, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${T.border}`,
        background: 'transparent', color: T.textMuted, fontWeight: 700, fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <ChevronLeft size={13} /> ATRÁS
    </button>
  )
}
