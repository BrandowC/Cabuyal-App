const { ipcMain } = require('electron')
const { getDB, saveDB } = require('./database')

ipcMain.handle('mesas:get', () => {
  const db = getDB()
  const result = db.exec('SELECT * FROM mesas ORDER BY numero')
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  )
})

ipcMain.handle('mesas:update', (_, { id, estado, mesero }) => {
  const db = getDB()
  db.run('UPDATE mesas SET estado=?, mesero=? WHERE id=?', [estado, mesero || '', id])
  saveDB()
  return { ok: true }
})