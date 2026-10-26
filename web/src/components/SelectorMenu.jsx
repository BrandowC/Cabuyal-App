import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { C } from '../theme'

// Catálogo para tomar pedidos desde el panel (mesas y domicilios): buscador, categorías y productos con
// foto, precio y disponibilidad. Los agotados se ven en gris con "NO HAY" y no se pueden elegir.
const estaAgotado = (p) => !p.disponible || (p.stock !== null && p.stock !== undefined && p.stock <= 0)

export default function SelectorMenu({ menu, elegido, onElegir }) {
  const [texto, setTexto] = useState('')
  const [catFiltro, setCatFiltro] = useState('')

  const categorias = [...new Set(menu.map((p) => p.categoria))]
  const catActiva = categorias.includes(catFiltro) ? catFiltro : categorias[0] || ''
  const q = texto.trim().toLowerCase()
  const platos = q
    ? menu.filter((p) => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q))
    : menu.filter((p) => p.categoria === catActiva)

  // Tocar el producto elegido otra vez lo quita; tocar otro lo cambia
  const tocar = (p) => {
    if (estaAgotado(p)) return
    setTexto('')
    onElegir(elegido?.id === p.id ? null : p)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: '0 14px' }}>
        <Search size={14} color={C.goldDark} />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar plato o bebida..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13, padding: '11px 10px' }} />
        {texto && (
          <button onClick={() => setTexto('')} aria-label="Limpiar búsqueda"
            style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 0 }}>
            <X size={13} />
          </button>
        )}
      </div>

      {!q && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 4 }}>
          {categorias.map((c) => (
            <button key={c} onClick={() => setCatFiltro(c)}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
                flexShrink: 0, background: catActiva === c ? C.header : 'transparent', color: catActiva === c ? '#fff' : C.textMuted,
                border: `1px solid ${catActiva === c ? C.header : C.border}` }}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 8, marginTop: 10,
        maxHeight: 330, overflowY: 'auto', paddingRight: 2 }}>
        {platos.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: C.textFaint, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            No hay productos con ese nombre
          </div>
        )}
        {platos.map((p) => {
          const agotado = estaAgotado(p)
          const pocas = !agotado && p.stock !== null && p.stock !== undefined && p.stock <= 5
          const activo = elegido?.id === p.id
          return (
            <button key={p.id} onClick={() => tocar(p)} disabled={agotado}
              style={{ textAlign: 'left', padding: 0, borderRadius: 10, overflow: 'hidden', position: 'relative',
                cursor: agotado ? 'not-allowed' : 'pointer', background: activo ? C.goldBg : C.surface,
                border: `1px solid ${activo ? C.gold : C.border}`, opacity: agotado ? 0.55 : 1, fontFamily: 'inherit' }}>
              <div style={{ height: 64, filter: agotado ? 'grayscale(1)' : 'none',
                background: p.imagenUrl ? `center/cover no-repeat url(${p.imagenUrl})` : C.goldBg }} />
              {agotado && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: C.danger, color: '#fff', fontSize: 9,
                  fontWeight: 800, letterSpacing: 1, padding: '2px 6px', borderRadius: 5 }}>NO HAY</div>
              )}
              {pocas && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: C.terracotta, color: '#fff', fontSize: 9,
                  fontWeight: 800, padding: '2px 6px', borderRadius: 5 }}>Quedan {p.stock}</div>
              )}
              <div style={{ padding: '7px 9px 9px' }}>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{p.nombre}</div>
                <div style={{ color: C.goldDark, fontSize: 12, fontWeight: 800, marginTop: 3 }}>
                  ${p.precio.toLocaleString('es-CO')}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
