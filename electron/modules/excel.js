const { ipcMain, dialog } = require('electron')
const { getDB } = require('./database.js')
const ExcelJS = require('exceljs')

ipcMain.handle('excel:exportar', async (_, filtro = 'hoy') => {
  const db = getDB()
  let where = ''
  if (filtro === 'hoy')         where = "WHERE date(v.fecha) = date('now','localtime')"
  else if (filtro === 'semana') where = "WHERE v.fecha >= datetime('now','-7 days','localtime')"
  else if (filtro === 'mes')    where = "WHERE v.fecha >= datetime('now','start of month','localtime')"

  const ventasResult = db.exec(`
    SELECT v.id, m.numero as mesa, v.total, v.mesero, v.fecha
    FROM ventas v JOIN mesas m ON v.mesa_id = m.id
    ${where} ORDER BY v.fecha DESC
  `)

  const ventas = ventasResult.length
    ? ventasResult[0].values.map(row =>
        Object.fromEntries(ventasResult[0].columns.map((c, i) => [c, row[i]]))
      )
    : []

  const { filePath } = await dialog.showSaveDialog({
    title: 'Guardar reporte de ventas',
    defaultPath: `Ventas_ElCabuyal_${new Date().toISOString().slice(0,10)}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })

  if (!filePath) return { ok: false }

  const workbook  = new ExcelJS.Workbook()
  workbook.creator = 'El Cabuyal'
  workbook.created = new Date()

  // ── Hoja 1: Resumen de ventas ──────────────────────────────────
  const sheetVentas = workbook.addWorksheet('Resumen de Ventas')

  // Logo / título
  sheetVentas.mergeCells('A1:F1')
  sheetVentas.getCell('A1').value    = 'EL CABUYAL — RESTAURANTE — PALERMO'
  sheetVentas.getCell('A1').font     = { bold: true, size: 16, color: { argb: 'FFC9A84C' } }
  sheetVentas.getCell('A1').fill     = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF000000' } }
  sheetVentas.getCell('A1').alignment = { horizontal:'center', vertical:'middle' }
  sheetVentas.getRow(1).height = 32

  sheetVentas.mergeCells('A2:F2')
  const labels = { hoy:'HOY', semana:'ESTA SEMANA', mes:'ESTE MES' }
  sheetVentas.getCell('A2').value     = `REPORTE: ${labels[filtro] || filtro.toUpperCase()} — Generado: ${new Date().toLocaleString('es-CO')}`
  sheetVentas.getCell('A2').font      = { size: 11, color: { argb: 'FF888888' } }
  sheetVentas.getCell('A2').fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF1A1A1A' } }
  sheetVentas.getCell('A2').alignment = { horizontal:'center' }

  sheetVentas.addRow([])

  // Encabezados
  const headers = ['#', 'MESA', 'FECHA', 'HORA', 'MESERO', 'TOTAL ($)']
  const headerRow = sheetVentas.addRow(headers)
  headerRow.eachCell(cell => {
    cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFC9A84C' } }
    cell.font      = { bold:true, color:{ argb:'FF111111' }, size:11 }
    cell.alignment = { horizontal:'center', vertical:'middle' }
    cell.border    = { bottom:{ style:'thin', color:{ argb:'FF111111' } } }
  })
  sheetVentas.getRow(4).height = 20

  sheetVentas.columns = [
    { key:'id',     width: 8  },
    { key:'mesa',   width: 10 },
    { key:'fecha',  width: 16 },
    { key:'hora',   width: 12 },
    { key:'mesero', width: 20 },
    { key:'total',  width: 16 },
  ]

  let totalGeneral = 0
  ventas.forEach((v, idx) => {
    const fecha = new Date(v.fecha)
    const row = sheetVentas.addRow([
      idx + 1,
      `Mesa ${v.mesa}`,
      fecha.toLocaleDateString('es-CO'),
      fecha.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }),
      v.mesero || '—',
      v.total,
    ])
    totalGeneral += v.total
    row.eachCell((cell, col) => {
      cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb: idx%2===0 ? 'FF1A1A1A' : 'FF111111' } }
      cell.font      = { color:{ argb: col===6 ? 'FFC9A84C' : 'FFDDDDDD' }, size:11 }
      cell.alignment = { horizontal: col===6 ? 'right' : 'center' }
      if (col === 6) cell.numFmt = '#,##0'
    })
  })

  // Fila total
  sheetVentas.addRow([])
  const totalRow = sheetVentas.addRow(['', '', '', '', 'TOTAL GENERAL', totalGeneral])
  totalRow.getCell(5).font      = { bold:true, color:{ argb:'FFFFFFFF' }, size:12 }
  totalRow.getCell(5).fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF000000' } }
  totalRow.getCell(5).alignment = { horizontal:'right' }
  totalRow.getCell(6).font      = { bold:true, color:{ argb:'FFC9A84C' }, size:13 }
  totalRow.getCell(6).fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF000000' } }
  totalRow.getCell(6).numFmt    = '#,##0'
  totalRow.getCell(6).alignment = { horizontal:'right' }

  // ── Hoja 2: Detalle por platos ─────────────────────────────────
  const sheetDetalle = workbook.addWorksheet('Detalle por Platos')

  sheetDetalle.mergeCells('A1:E1')
  sheetDetalle.getCell('A1').value     = 'EL CABUYAL — DETALLE DE PLATOS VENDIDOS'
  sheetDetalle.getCell('A1').font      = { bold:true, size:14, color:{ argb:'FFC9A84C' } }
  sheetDetalle.getCell('A1').fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF000000' } }
  sheetDetalle.getCell('A1').alignment = { horizontal:'center', vertical:'middle' }
  sheetDetalle.getRow(1).height = 28

  sheetDetalle.addRow([])

  const dHeaders = sheetDetalle.addRow(['PLATO', 'PRECIO UNIT.', 'CANTIDAD', 'SUBTOTAL', 'HORA'])
  dHeaders.eachCell(cell => {
    cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFC9A84C' } }
    cell.font      = { bold:true, color:{ argb:'FF111111' }, size:11 }
    cell.alignment = { horizontal:'center' }
  })

  sheetDetalle.columns = [
    { key:'plato',    width: 32 },
    { key:'precio',   width: 14 },
    { key:'cantidad', width: 12 },
    { key:'subtotal', width: 14 },
    { key:'hora',     width: 12 },
  ]

  // Obtener todos los pedidos del período
  const pedidosResult = db.exec(`
    SELECT p.nombre_plato, p.precio, p.cantidad, (p.precio*p.cantidad) as subtotal, p.fecha
    FROM pedidos p
    JOIN ventas v ON p.mesa_id = v.mesa_id
    ${where.replace('v.fecha', 'v.fecha')}
    AND p.estado = 'cerrado'
    ORDER BY p.fecha DESC
  `)

  const pedidos = pedidosResult.length
    ? pedidosResult[0].values.map(row =>
        Object.fromEntries(pedidosResult[0].columns.map((c, i) => [c, row[i]]))
      )
    : []

  pedidos.forEach((p, idx) => {
    const hora = new Date(p.fecha).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })
    const row = sheetDetalle.addRow([p.nombre_plato, p.precio, p.cantidad, p.subtotal, hora])
    row.eachCell((cell, col) => {
      cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb: idx%2===0 ? 'FF1A1A1A' : 'FF111111' } }
      cell.font      = { color:{ argb: col===4 ? 'FFC9A84C' : 'FFDDDDDD' }, size:11 }
      cell.alignment = { horizontal: col===1 ? 'left' : 'center' }
      if (col===2||col===4) cell.numFmt = '#,##0'
    })
  })

  // ── Hoja 3: Resumen estadístico ────────────────────────────────
  const sheetStats = workbook.addWorksheet('Estadísticas')

  sheetStats.mergeCells('A1:C1')
  sheetStats.getCell('A1').value     = 'EL CABUYAL — ESTADÍSTICAS'
  sheetStats.getCell('A1').font      = { bold:true, size:14, color:{ argb:'FFC9A84C' } }
  sheetStats.getCell('A1').fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF000000' } }
  sheetStats.getCell('A1').alignment = { horizontal:'center' }
  sheetStats.getRow(1).height = 28
  sheetStats.addRow([])

  // Agrupar por plato
  const conteo = {}
  pedidos.forEach(p => {
    if (!conteo[p.nombre_plato]) conteo[p.nombre_plato] = { cantidad:0, total:0 }
    conteo[p.nombre_plato].cantidad += p.cantidad
    conteo[p.nombre_plato].total    += p.subtotal
  })

  const statsH = sheetStats.addRow(['PLATO MÁS VENDIDO', 'CANTIDAD TOTAL', 'INGRESOS'])
  statsH.eachCell(cell => {
    cell.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFC9A84C' } }
    cell.font  = { bold:true, color:{ argb:'FF111111' } }
    cell.alignment = { horizontal:'center' }
  })

  sheetStats.columns = [
    { key:'plato',    width: 34 },
    { key:'cantidad', width: 16 },
    { key:'total',    width: 16 },
  ]

  Object.entries(conteo)
    .sort((a,b) => b[1].cantidad - a[1].cantidad)
    .forEach(([nombre, data], idx) => {
      const row = sheetStats.addRow([nombre, data.cantidad, data.total])
      row.eachCell((cell, col) => {
        cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb: idx%2===0 ? 'FF1A1A1A' : 'FF111111' } }
        cell.font      = { color:{ argb: col===3 ? 'FFC9A84C' : 'FFDDDDDD' } }
        cell.alignment = { horizontal: col===1 ? 'left' : 'center' }
        if (col===3) cell.numFmt = '#,##0'
      })
    })

  await workbook.xlsx.writeFile(filePath)
  return { ok: true, filePath }
})