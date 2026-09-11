const { ipcMain } = require('electron')
const { getDB, saveDB } = require('./database')

ipcMain.handle('menu:get', () => {
  const db = getDB()
  const result = db.exec('SELECT * FROM menu ORDER BY categoria, nombre')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  )
})

ipcMain.handle('menu:add', (_, { nombre, categoria, precio, descripcion }) => {
  const db = getDB()
  db.run(
    'INSERT INTO menu (nombre, categoria, precio, descripcion) VALUES (?, ?, ?, ?)',
    [nombre, categoria, precio, descripcion || '']
  )
  saveDB()
  return { ok: true }
})

ipcMain.handle('menu:update', (_, { id, nombre, categoria, precio, descripcion, disponible }) => {
  const db = getDB()
  db.run(
    'UPDATE menu SET nombre=?, categoria=?, precio=?, descripcion=?, disponible=? WHERE id=?',
    [nombre, categoria, precio, descripcion, disponible, id]
  )
  saveDB()
  return { ok: true }
})

ipcMain.handle('menu:delete', (_, id) => {
  const db = getDB()
  db.run('DELETE FROM menu WHERE id=?', [id])
  saveDB()
  return { ok: true }
})