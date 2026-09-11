const { ipcMain } = require('electron')
const { getDB } = require('./database.js')

ipcMain.handle('ventas:get', (_, filtro = 'hoy') => {
  const db = getDB()
  let where = ''
  if (filtro === 'hoy')   where = "WHERE date(v.fecha) = date('now','localtime')"
  else if (filtro === 'semana') where = "WHERE v.fecha >= datetime('now','-7 days','localtime')"
  else if (filtro === 'mes')    where = "WHERE v.fecha >= datetime('now','start of month','localtime')"

  const result = db.exec(`
    SELECT v.id, m.numero as mesa, v.total, v.mesero, v.fecha
    FROM ventas v
    JOIN mesas m ON v.mesa_id = m.id
    ${where}
    ORDER BY v.fecha DESC
  `)
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map(row =>
    Object.fromEntries(columns.map((c, i) => [c, row[i]]))
  )
})

ipcMain.handle('ventas:getDetalle', (_, ventaId) => {
  const db = getDB()
  const result = db.exec(`
    SELECT nombre_plato, precio, cantidad, (precio * cantidad) as subtotal, fecha
    FROM pedidos
    WHERE mesa_id = (SELECT mesa_id FROM ventas WHERE id = ?)
    AND estado = 'cerrado'
    ORDER BY fecha
  `, [ventaId])
  if (!result.length) return []
  const [{ columns, values }] = result
  return values.map(row =>
    Object.fromEntries(columns.map((c, i) => [c, row[i]]))
  )
})

ipcMain.handle('ventas:stats', () => {
  const db = getDB()
  const hoy = db.exec(`
    SELECT COUNT(*) as cierres, SUM(total) as total
    FROM ventas WHERE date(fecha) = date('now','localtime')
  `)
  const semana = db.exec(`
    SELECT SUM(total) as total FROM ventas
    WHERE fecha >= datetime('now','-7 days','localtime')
  `)
  const mes = db.exec(`
    SELECT SUM(total) as total FROM ventas
    WHERE fecha >= datetime('now','start of month','localtime')
  `)
  return {
    hoy_cierres: hoy[0]?.values[0][0] || 0,
    hoy_total:   hoy[0]?.values[0][1] || 0,
    semana:      semana[0]?.values[0][0] || 0,
    mes:         mes[0]?.values[0][0] || 0,
  }
})