 const { ipcMain } = require('electron')
const { getDB, saveDB } = require('./database.js')

ipcMain.handle('domicilios:get', () => {
  const db = getDB()
  const result = db.exec(`
    SELECT * FROM domicilios 
    WHERE estado != 'cancelado' AND estado != 'despachado'
    ORDER BY fecha DESC
  `)
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map(row =>
    Object.fromEntries(columns.map((c, i) => [c, row[i]]))
  )
})

ipcMain.handle('domicilios:add', (_, { nombre, telefono, direccion, pedido, total }) => {
  const db = getDB()
  db.run(
    'INSERT INTO domicilios (nombre, telefono, direccion, pedido, total) VALUES (?,?,?,?,?)',
    [nombre, telefono, direccion, pedido, total]
  )
  saveDB()
  return { ok: true }
})

ipcMain.handle('domicilios:update', (_, { id, estado }) => {
  const db = getDB()
  db.run('UPDATE domicilios SET estado=? WHERE id=?', [estado, id])
  saveDB()
  return { ok: true }
})
