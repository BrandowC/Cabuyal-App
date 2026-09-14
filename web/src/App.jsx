import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, UtensilsCrossed, BarChart2, Bike, LogOut, LayoutTemplate, Users, CalendarDays } from 'lucide-react'
import Mesas from './pages/Mesas'
import Menu from './pages/Menu'
import MenuDia from './pages/MenuDia'
import Ventas from './pages/Ventas'
import Domicilios from './pages/Domicilios'
import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import AdminMesas from './pages/AdminMesas'
import Usuarios from './pages/Usuarios'
import ProtectedRoute from './auth/ProtectedRoute'
import { useAuth } from './auth/AuthContext'
import logo from './assets/logo.png'
import { C } from './theme'

const NAV = [
  { id: 'mesas',        label: 'Mesas',        icon: LayoutGrid,      roles: ['admin', 'empleado', 'caja'] },
  { id: 'domicilios',   label: 'Domicilios',   icon: Bike,            roles: ['admin', 'caja'] },
  { id: 'menu',         label: 'Menú',         icon: UtensilsCrossed, roles: ['admin'] },
  { id: 'menu-dia',     label: 'Menú del día', icon: CalendarDays,    roles: ['admin', 'caja'] },
  { id: 'ventas',       label: 'Ventas',       icon: BarChart2,       roles: ['admin', 'caja'] },
  { id: 'editor-mesas', label: 'Editor mesas', icon: LayoutTemplate,  roles: ['admin'] },
  { id: 'usuarios',     label: 'Usuarios',     icon: Users,           roles: ['admin'] },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const nav = NAV.filter((n) => n.roles.includes(user.rol))
  const pagina = location.pathname.replace('/', '') || nav[0]?.id || 'mesas'

  const irA = (id) => navigate(`/${id}`)

  const cerrarSesion = async () => {
    if (!confirm('¿Desea cerrar sesión?')) return
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden',
      fontFamily:"'Segoe UI', sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        background: C.header,
        borderRight: `1px solid ${C.gold}44`,
        position: 'relative',
        overflow: 'hidden',
      }}>

        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}/>

        <div style={{
          padding: '28px 16px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: `1px solid ${C.gold}22`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse at 50% 40%, ${C.gold}0d 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}/>

          <div style={{
            width: 110, height: 110,
            borderRadius: '38% 62% 55% 45% / 45% 45% 55% 55%',
            border: `1.5px solid ${C.gold}88`,
            padding: 4,
            marginBottom: 14,
            boxShadow: `0 0 24px ${C.gold}22, inset 0 0 12px ${C.gold}11`,
            background: `linear-gradient(145deg, ${C.header}, ${C.headerAlt})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 6,
              borderRadius: '38% 62% 55% 45% / 45% 45% 55% 55%',
              border: `0.5px solid ${C.gold}33`,
            }}/>
            <div style={{
              width: '92%', height: '92%', borderRadius: '50%', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={logo}
                alt="El Cabuyal"
                style={{ width: '175%', height: '175%', objectFit: 'cover' }}
              />
            </div>
          </div>

          <div style={{
            color: C.gold,
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
            color: C.headerTextMuted,
            fontSize: 9,
            letterSpacing: 3,
            marginTop: 3,
            textTransform: 'uppercase',
            fontFamily: "'Segoe UI', sans-serif",
          }}>
            Restaurante · Palermo
          </div>

          <svg width="120" height="12" style={{ marginTop: 14, opacity: 0.5 }}>
            <path d="M0 6 Q30 0 60 6 Q90 12 120 6" stroke={C.gold} strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(({ id, label, icon: Icon }) => {
            const active = pagina === id
            return (
              <button key={id} onClick={() => irA(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, border: 'none',
                  background: active ? `${C.gold}22` : 'transparent',
                  color: active ? C.gold : C.headerTextMuted,
                  borderLeft: active ? `3px solid ${C.gold}` : '3px solid transparent',
                  cursor: 'pointer', fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  letterSpacing: active ? 0.5 : 0,
                  transition: 'all 0.2s', textAlign: 'left', width: '100%',
                  position: 'relative', overflow: 'hidden',
                }}>
                <Icon size={17} strokeWidth={active ? 2 : 1.5}/>
                <span>{label}</span>
                {active && (
                  <div style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6, height: 6, borderRadius: '50%',
                    background: C.gold,
                    boxShadow: `0 0 8px ${C.gold}`,
                  }}/>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 10px 16px',
          borderTop: `1px solid ${C.gold}22`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ padding: '0 4px 6px', color: C.headerTextMuted, fontSize: 12 }}>
            <div style={{ color: C.gold, fontWeight: 700 }}>{user.nombre}</div>
            <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{user.rol}</div>
          </div>

          <button onClick={cerrarSesion}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid transparent',
              background: 'transparent',
              color: C.headerTextMuted, cursor: 'pointer', fontSize: 12,
              width: '100%', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.terracotta}22`; e.currentTarget.style.color = '#E88178' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.headerTextMuted }}>
            <LogOut size={14} strokeWidth={1.5}/>
            Cerrar sesión
          </button>

          <div style={{
            width: '100%', height: 1, marginTop: 6,
            background: `linear-gradient(90deg, transparent, ${C.gold}44, transparent)`,
          }}/>
          <div style={{ color: C.headerTextMuted, fontSize: 9, textAlign: 'center', letterSpacing: 2, opacity: 0.6 }}>
            EL CABUYAL © 2025
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main style={{ flex: 1, overflow: 'auto', background: C.bg }}>
        <Routes>
          <Route index element={<Navigate to={nav[0]?.id || 'mesas'} replace />} />
          <Route path="mesas" element={<Mesas rol={user.rol} />} />
          <Route path="domicilios" element={
            <ProtectedRoute roles={['admin', 'caja']}><Domicilios /></ProtectedRoute>
          } />
          <Route path="menu" element={
            <ProtectedRoute roles={['admin']}><Menu /></ProtectedRoute>
          } />
          <Route path="menu-dia" element={
            <ProtectedRoute roles={['admin', 'caja']}><MenuDia /></ProtectedRoute>
          } />
          <Route path="ventas" element={
            <ProtectedRoute roles={['admin', 'caja']}><Ventas /></ProtectedRoute>
          } />
          <Route path="editor-mesas" element={
            <ProtectedRoute roles={['admin']}><AdminMesas /></ProtectedRoute>
          } />
          <Route path="usuarios" element={
            <ProtectedRoute roles={['admin']}><Usuarios /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
