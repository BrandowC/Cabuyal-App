import { useState } from 'react'
import { LayoutGrid, UtensilsCrossed, BarChart2, Bike, LogOut, Save } from 'lucide-react'
import Mesas from './pages/Mesas'
import Menu from './pages/Menu'
import Ventas from './pages/Ventas'
import Domicilios from './pages/Domicilios'



const NAV = [
  { id: 'mesas',      label: 'Mesas',      icon: LayoutGrid },
  { id: 'domicilios', label: 'Domicilios', icon: Bike },
  { id: 'menu',       label: 'Menú',       icon: UtensilsCrossed },
  { id: 'ventas',     label: 'Ventas',     icon: BarChart2 },
]

export default function App() {
  const [pagina, setPagina] = useState('mesas')
  const [guardando, setGuardando] = useState(false)

  const renderPagina = () => {
    if (pagina === 'mesas')      return <Mesas />
    if (pagina === 'domicilios') return <Domicilios />
    if (pagina === 'menu')       return <Menu />
    if (pagina === 'ventas')     return <Ventas />
    return null
  }

  const guardarDatos = async () => {
    setGuardando(true)
    setTimeout(() => {
      setGuardando(false)
      alert('✅ Datos guardados correctamente')
    }, 800)
  }

  const cerrarSesion = () => {
    if (confirm('¿Desea cerrar sesión?')) window.location.reload()
  }

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden',
      fontFamily:"'Segoe UI', sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        background: '#080808',
        borderRight: '1px solid #c9a84c55',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Línea decorativa superior */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}/>

      {/* Logo area */}
      <div style={{
        padding: '28px 16px 22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderBottom: '1px solid #c9a84c22',
        position: 'relative',
      }}>
        {/* Resplandor de fondo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #c9a84c0d 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        {/* Marco del logo con curvas */}
        <div style={{
          width: 110, height: 110,
          borderRadius: '38% 62% 55% 45% / 45% 45% 55% 55%',
          border: '1.5px solid #c9a84c88',
          padding: 4,
          marginBottom: 14,
          boxShadow: '0 0 24px #c9a84c22, inset 0 0 12px #c9a84c11',
          background: 'linear-gradient(145deg, #0d0d0d, #1a1400)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          animation: 'none',
        }}>
          {/* Línea decorativa curva interior */}
          <div style={{
            position: 'absolute', inset: 6,
            borderRadius: '38% 62% 55% 45% / 45% 45% 55% 55%',
            border: '0.5px solid #c9a84c33',
          }}/>
          <img
            src={window.location.protocol === 'file:' ? './assets/logo.png' : '/src/assets/logo.png'}
            alt="El Cabuyal"
            style={{ width: '85%', height: '85%', objectFit: 'contain', borderRadius: '50%' }}
          />
        </div>

        {/* Nombre con tipografía moderna */}
        <div style={{
          color: '#c9a84c',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 4,
          textAlign: 'center',
          textTransform: 'uppercase',
          fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
        }}>
          El Cabuyal
        </div>

        <div style={{
          color: '#c9a84c55',
          fontSize: 9,
          letterSpacing: 3,
          marginTop: 3,
          textTransform: 'uppercase',
          fontFamily: "'Segoe UI', sans-serif",
        }}>
          Restaurante · Palermo
        </div>

        {/* Separador decorativo curvo */}
        <svg width="120" height="12" style={{ marginTop: 14, opacity: 0.4 }}>
          <path d="M0 6 Q30 0 60 6 Q90 12 120 6" stroke="#c9a84c" strokeWidth="1" fill="none"/>
        </svg>
      </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = pagina === id
            return (
              <button key={id} onClick={() => setPagina(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, border: 'none',
                  background: active ? '#c9a84c15' : 'transparent',
                  color: active ? '#c9a84c' : '#555',
                  borderLeft: active ? '3px solid #c9a84c' : '3px solid transparent',
                  cursor: 'pointer', fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: active ? 0.5 : 0,
                  transition: 'all 0.2s', textAlign: 'left', width: '100%',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = '#c9a84c0a'
                    e.currentTarget.style.color = '#c9a84c88'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#555'
                  }
                }}>
                <Icon size={17} strokeWidth={active ? 2 : 1.5}/>
                <span>{label}</span>
                {active && (
                  <div style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#c9a84c',
                    boxShadow: '0 0 8px #c9a84c',
                  }}/>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 10px 16px',
          borderTop: '1px solid #c9a84c22',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <button onClick={guardarDatos}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid #c9a84c44',
              background: guardando ? '#c9a84c22' : 'transparent',
              color: '#c9a84c', cursor: 'pointer', fontSize: 12,
              fontWeight: 600, width: '100%', letterSpacing: 0.5,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='#c9a84c22'}
            onMouseLeave={e => { if(!guardando) e.currentTarget.style.background='transparent' }}>
            <Save size={14} strokeWidth={2}/>
            {guardando ? 'Guardando...' : 'Guardar datos'}
          </button>

          <button onClick={cerrarSesion}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid #ffffff0a',
              background: 'transparent',
              color: '#444', cursor: 'pointer', fontSize: 12,
              width: '100%', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#e5393515'
              e.currentTarget.style.color = '#e53935'
              e.currentTarget.style.borderColor = '#e5393533'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#444'
              e.currentTarget.style.borderColor = '#ffffff0a'
            }}>
            <LogOut size={14} strokeWidth={1.5}/>
            Cerrar sesión
          </button>

          {/* Línea decorativa inferior */}
          <div style={{
            width: '100%', height: 1, marginTop: 6,
            background: 'linear-gradient(90deg, transparent, #c9a84c44, transparent)',
          }}/>
          <div style={{ color: '#2a2a2a', fontSize: 9, textAlign: 'center', letterSpacing: 2 }}>
            EL CABUYAL © 2025
          </div>
        </div>

        {/* Línea decorativa lateral derecha */}
        <div style={{
          position: 'absolute', right: 0, top: '15%', bottom: '15%',
          width: 1,
          background: 'linear-gradient(180deg, transparent, #c9a84c55, transparent)',
        }}/>
      </aside>

      {/* CONTENIDO */}
      <main style={{ flex: 1, overflow: 'auto', background: '#111' }}>
        {renderPagina()}
      </main>
    </div>
  )
}