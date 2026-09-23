import { useEffect, useState } from 'react'
import { Plus, X, KeyRound } from 'lucide-react'
import api from '../lib/api'
import { C } from '../theme'

const ROLES = ['admin', 'caja', 'empleado']
const EMPTY = { nombre: '', usuario: '', password: '', rol: 'empleado' }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [claveModal, setClaveModal] = useState(null)
  const [claveNueva, setClaveNueva] = useState('')

  const cargar = async () => setUsuarios(await api.getUsuarios())
  useEffect(() => { cargar() }, [])

  const crear = async () => {
    setError('')
    if (!form.nombre || !form.usuario || form.password.length < 6) {
      setError('Completa nombre, usuario y una contraseña de al menos 6 caracteres')
      return
    }
    try {
      await api.addUsuario(form)
      setModal(false); setForm(EMPTY); cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleActivo = async (u) => {
    await api.updateUsuario({ id: u.id, activo: !u.activo })
    cargar()
  }

  const cambiarClave = async () => {
    if (claveNueva.length < 6) return
    await api.updateUsuario({ id: claveModal.id, password: claveNueva })
    setClaveModal(null); setClaveNueva('')
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text, fontFamily:'Segoe UI,sans-serif', padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ color:C.goldDark, fontSize:20, fontWeight:800, letterSpacing:2 }}>USUARIOS</div>
          <div style={{ color:C.textMuted, fontSize:12 }}>{usuarios.length} cuenta(s)</div>
        </div>
        <button onClick={() => { setForm(EMPTY); setError(''); setModal(true) }}
          style={{ background:C.gold, border:'none', borderRadius:8, padding:'10px 18px',
            color:C.header, fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <Plus size={15}/> NUEVO USUARIO
        </button>
      </div>

      <div style={{ background:C.surface, borderRadius:10, overflowX:'auto', border:`1px solid ${C.border}` }}>
        <table style={{ width:'100%', minWidth:520, borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:C.header, borderBottom:`1px solid ${C.gold}55` }}>
              {['Nombre','Usuario','Rol','Estado','Acciones'].map(h => (
                <th key={h} style={{ padding:'12px 16px', color:C.gold, fontWeight:700,
                  textAlign: h==='Nombre'||h==='Usuario' ? 'left' : 'center', fontSize:11, letterSpacing:1 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                <td style={{ padding:'11px 16px', color:C.text }}>{u.nombre}</td>
                <td style={{ padding:'11px 16px', color:C.textMuted }}>{u.usuario}</td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <span style={{ background:C.goldBg, color:C.goldDark, borderRadius:5,
                    padding:'3px 8px', fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{u.rol}</span>
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <button onClick={() => toggleActivo(u)}
                    style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                      background: u.activo ? C.successBg : C.dangerBg,
                      color: u.activo ? C.success : C.danger }}>
                    {u.activo ? '● Activo' : '○ Inactivo'}
                  </button>
                </td>
                <td style={{ padding:'11px 16px', textAlign:'center' }}>
                  <button onClick={() => { setClaveModal(u); setClaveNueva('') }}
                    style={{ background:C.infoBg, border:'none', borderRadius:6, padding:'5px 10px',
                      color:C.info, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700 }}>
                    <KeyRound size={12}/> Contraseña
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear usuario */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.gold}`, borderRadius:12,
            width:'100%', maxWidth:400, margin:16, overflow:'hidden' }}>
            <div style={{ background:C.header, padding:'14px 18px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:C.gold, fontWeight:800, letterSpacing:1 }}>NUEVO USUARIO</div>
              <button onClick={() => setModal(false)}
                style={{ background:'transparent', border:'none', color:C.gold, cursor:'pointer' }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              {error && (
                <div style={{ background:C.dangerBg, border:`1px solid ${C.danger}55`, borderRadius:8,
                  padding:'8px 12px', color:C.danger, fontSize:12 }}>{error}</div>
              )}
              {[
                { label:'Nombre completo', key:'nombre', type:'text' },
                { label:'Usuario (para iniciar sesión)', key:'usuario', type:'text' },
                { label:'Contraseña (mín. 6 caracteres)', key:'password', type:'password' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                      color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box' }}/>
                </div>
              ))}
              <div>
                <div style={{ color:C.textMuted, fontSize:11, marginBottom:5 }}>Rol</div>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                  style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                    color:C.text, fontSize:13, padding:'9px 12px', outline:'none' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, padding:'0 18px 18px' }}>
              <button onClick={() => setModal(false)}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:`1px solid ${C.border}`,
                  background:'transparent', color:C.textMuted, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={crear}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none',
                  background:C.gold, color:C.header, fontWeight:800, cursor:'pointer' }}>
                CREAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {claveModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(35,29,24,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.gold}`, borderRadius:12,
            width:'100%', maxWidth:360, margin:16, padding:20 }}>
            <div style={{ color:C.goldDark, fontWeight:800, marginBottom:14 }}>
              Nueva contraseña para {claveModal.nombre}
            </div>
            <input type="password" value={claveNueva} onChange={e => setClaveNueva(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ width:'100%', background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7,
                color:C.text, fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box', marginBottom:14 }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setClaveModal(null)}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:`1px solid ${C.border}`,
                  background:'transparent', color:C.textMuted, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={cambiarClave} disabled={claveNueva.length < 6}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none',
                  background: claveNueva.length < 6 ? C.border : C.gold,
                  color: claveNueva.length < 6 ? C.textFaint : C.header, fontWeight:800,
                  cursor: claveNueva.length < 6 ? 'not-allowed' : 'pointer' }}>
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
