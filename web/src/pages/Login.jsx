import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { C } from '../theme'

export default function Login() {
  const { user, login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(usuario, password)
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 50% 20%, ${C.goldBg} 0%, ${C.bg} 60%)`,
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <form onSubmit={submit} style={{
        width: '100%', maxWidth: 360, background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 16, padding: '36px 32px',
        boxShadow: '0 20px 50px rgba(43,36,32,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            color: C.goldDark, fontSize: 20, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase',
          }}>El Cabuyal</div>
          <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 3, marginTop: 4, textTransform: 'uppercase' }}>
            Restaurante · Palermo
          </div>
        </div>

        {error && (
          <div style={{
            background: C.dangerBg, border: `1px solid ${C.danger}55`, borderRadius: 8,
            padding: '10px 14px', color: C.danger, fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 14px' }}>
            <User size={15} color={C.goldDark} />
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Usuario"
              autoFocus
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 14, padding: '12px 0' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 14px' }}>
            <Lock size={15} color={C.goldDark} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 14, padding: '12px 0' }}
            />
          </div>
        </div>

        <button type="submit" disabled={cargando}
          style={{
            width: '100%', marginTop: 22, padding: '13px 0', borderRadius: 10, border: 'none',
            background: cargando ? C.border : C.gold, color: C.header, fontWeight: 800,
            fontSize: 13, letterSpacing: 1, cursor: cargando ? 'not-allowed' : 'pointer',
          }}>
          {cargando ? 'INGRESANDO…' : 'INGRESAR'}
        </button>
      </form>
    </div>
  )
}
