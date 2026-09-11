const { ipcMain } = require('electron')
const { getDB, saveDB } = require('./database')

ipcMain.handle('pedidos:getByMesa', (_, mesaId) => {
  const db = getDB()
  const result = db.exec(
    'SELECT * FROM pedidos WHERE mesa_id=? AND estado != "cerrado" ORDER BY fecha',
    [mesaId]
  )
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  )
})

ipcMain.handle('pedidos:add', (_, { mesa_id, menu_id, nombre_plato, categoria, precio, cantidad, notas }) => {
  const db = getDB()
  db.run(
    'INSERT INTO pedidos (mesa_id, menu_id, nombre_plato, categoria, precio, cantidad, notas) VALUES (?,?,?,?,?,?,?)',
    [mesa_id, menu_id, nombre_plato, categoria || '', precio, cantidad || 1, notas || '']
  )
  db.run("UPDATE mesas SET estado='ocupada' WHERE id=?", [mesa_id])
  saveDB()
  return { ok: true }
})

ipcMain.handle('pedidos:update', (_, { id, estado }) => {
  const db = getDB()
  db.run('UPDATE pedidos SET estado=? WHERE id=?', [estado, id])
  saveDB()
  return { ok: true }
})

ipcMain.handle('pedidos:cerrar', (_, mesaId) => {
  const db = getDB()
  const result = db.exec(
    'SELECT SUM(precio * cantidad) as total FROM pedidos WHERE mesa_id=? AND estado != "cerrado"',
    [mesaId]
  )
  const total = result[0]?.values[0][0] || 0

  db.run(
    'INSERT INTO ventas (mesa_id, total) VALUES (?, ?)',
    [mesaId, total]
  )
  db.run(
    'UPDATE pedidos SET estado="cerrado" WHERE mesa_id=? AND estado != "cerrado"',
    [mesaId]
  )
  db.run("UPDATE mesas SET estado='libre', mesero='' WHERE id=?", [mesaId])
  saveDB()
  return { ok: true, total }
})