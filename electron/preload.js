const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getMesas:         () => ipcRenderer.invoke('mesas:get'),
  updateMesa:       (data) => ipcRenderer.invoke('mesas:update', data),
  getPedidosByMesa: (mesaId) => ipcRenderer.invoke('pedidos:getByMesa', mesaId),
  addPedido:        (data) => ipcRenderer.invoke('pedidos:add', data),
  updatePedido:     (data) => ipcRenderer.invoke('pedidos:update', data),
  cerrarMesa:       (mesaId) => ipcRenderer.invoke('pedidos:cerrar', mesaId),
  getMenu:          () => ipcRenderer.invoke('menu:get'),
  addPlato:         (data) => ipcRenderer.invoke('menu:add', data),
  updatePlato:      (data) => ipcRenderer.invoke('menu:update', data),
  deletePlato:      (id) => ipcRenderer.invoke('menu:delete', id),
  getVentas:        (filtro) => ipcRenderer.invoke('ventas:get', filtro),
  getVentasStats:   () => ipcRenderer.invoke('ventas:stats'),
  exportarExcel:    (filtro) => ipcRenderer.invoke('excel:exportar', filtro),
  getDomicilios:    () => ipcRenderer.invoke('domicilios:get'),
  addDomicilio:     (data) => ipcRenderer.invoke('domicilios:add', data),
  updateDomicilio:  (data) => ipcRenderer.invoke('domicilios:update', data),
})