const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

const api = {
  // Auth
  login: (usuario, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Mesas
  getMesas: () => request('/mesas'),
  updateMesa: ({ id, estado, mesero }) => request(`/mesas/${id}`, { method: 'PATCH', body: JSON.stringify({ estado, mesero }) }),
  updateMesaLayout: (id, data) => request(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Pedidos
  getPedidosByMesa: (mesaId) => request(`/pedidos/mesa/${mesaId}`),
  addPedido: (data) => request('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  updatePedido: ({ id, estado }) => request(`/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  cerrarMesa: (mesaId, { metodo_pago, propina } = {}) =>
    request(`/pedidos/cerrar/${mesaId}`, { method: 'POST', body: JSON.stringify({ metodo_pago, propina }) }),

  // Menú
  getMenu: () => request('/menu'),
  addPlato: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updatePlato: (data) => request(`/menu/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlato: (id) => request(`/menu/${id}`, { method: 'DELETE' }),

  // Ventas
  getVentas: (filtro = 'hoy', extra = {}) => {
    const params = new URLSearchParams({ filtro, ...extra })
    return request(`/ventas?${params.toString()}`)
  },
  getVentasStats: () => request('/ventas/stats'),
  getRecibo: (ventaId) => request(`/ventas/${ventaId}/recibo`),

  // Domicilios
  getDomicilios: (params = {}) => request(`/domicilios?${new URLSearchParams(params)}`),
  addDomicilio: (data) => request('/domicilios', { method: 'POST', body: JSON.stringify(data) }),
  updateDomicilio: ({ id, estado }) => request(`/domicilios/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  // Menú del día
  getMenuDia: () => request('/menu-dia'),
  addMenuDia: (data) => request('/menu-dia', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuDia: ({ id, ...data }) => request(`/menu-dia/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuDia: (id) => request(`/menu-dia/${id}`, { method: 'DELETE' }),

  // Usuarios (solo admin)
  getUsuarios: () => request('/usuarios'),
  addUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  updateUsuario: ({ id, ...data }) => request(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Catálogo público (sin login)
  getMenuPublico: () => request('/publico/menu'),
  addDomicilioPublico: (data) => request('/publico/domicilios', { method: 'POST', body: JSON.stringify(data) }),

  // Reportes (descarga de archivo, no pasa por request())
  descargarReporteGanancias: (params) => descargarArchivo(`/reportes/ganancias?${new URLSearchParams(params)}`),
  descargarReporteStock: () => descargarArchivo('/reportes/stock'),
}

async function descargarArchivo(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const nombre = match ? match[1] : 'reporte.xlsx'

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default api
