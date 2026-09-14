const ExcelJS = require('exceljs')

const DORADO = 'FFC9A84C'
const NEGRO = 'FF000000'
const FILA_A = 'FF1A1A1A'
const FILA_B = 'FF111111'

function estiloEncabezado(row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DORADO } }
    cell.font = { bold: true, color: { argb: 'FF111111' }, size: 11 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
}

function estiloFila(row, idx, colDestacada) {
  row.eachCell((cell, col) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? FILA_A : FILA_B } }
    cell.font = { color: { argb: col === colDestacada ? DORADO : 'FFDDDDDD' }, size: 11 }
  })
}

async function generarGanancias({ ventas, domicilios, etiquetaPeriodo }) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'El Cabuyal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Ganancias')

  sheet.mergeCells('A1:F1')
  sheet.getCell('A1').value = 'EL CABUYAL — RESTAURANTE — PALERMO'
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: DORADO } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 32

  sheet.mergeCells('A2:F2')
  sheet.getCell('A2').value = `GANANCIAS — ${etiquetaPeriodo} — Generado: ${new Date().toLocaleString('es-CO')}`
  sheet.getCell('A2').font = { size: 11, color: { argb: 'FF888888' } }
  sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILA_A } }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  sheet.addRow([])

  const headerRow = sheet.addRow(['#', 'ORIGEN', 'DETALLE', 'FECHA', 'HORA', 'TOTAL ($)'])
  estiloEncabezado(headerRow)
  sheet.getRow(4).height = 20

  sheet.columns = [
    { key: 'n', width: 6 },
    { key: 'origen', width: 14 },
    { key: 'detalle', width: 24 },
    { key: 'fecha', width: 16 },
    { key: 'hora', width: 12 },
    { key: 'total', width: 16 },
  ]

  let totalGeneral = 0
  let idx = 0

  ventas.forEach((v) => {
    const fecha = new Date(v.fecha)
    const row = sheet.addRow([idx + 1, 'Mesa', `Mesa ${v.mesa}`, fecha.toLocaleDateString('es-CO'),
      fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), v.total])
    estiloFila(row, idx, 6)
    row.getCell(6).numFmt = '#,##0'
    totalGeneral += v.total
    idx++
  })

  domicilios.forEach((d) => {
    const fecha = new Date(d.fecha)
    const row = sheet.addRow([idx + 1, 'Domicilio', d.nombre, fecha.toLocaleDateString('es-CO'),
      fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), d.total])
    estiloFila(row, idx, 6)
    row.getCell(6).numFmt = '#,##0'
    totalGeneral += d.total
    idx++
  })

  sheet.addRow([])
  const totalRow = sheet.addRow(['', '', '', '', 'TOTAL GENERAL', totalGeneral])
  totalRow.getCell(5).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
  totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
  totalRow.getCell(5).alignment = { horizontal: 'right' }
  totalRow.getCell(6).font = { bold: true, color: { argb: DORADO }, size: 13 }
  totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
  totalRow.getCell(6).numFmt = '#,##0'

  return workbook.xlsx.writeBuffer()
}

async function generarStock(platos) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'El Cabuyal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Stock')

  sheet.mergeCells('A1:E1')
  sheet.getCell('A1').value = 'EL CABUYAL — STOCK DE PRODUCTOS'
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: DORADO } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 32
  sheet.addRow([])

  const headerRow = sheet.addRow(['PLATO', 'CATEGORÍA', 'DISPONIBLE', 'STOCK', 'ALERTA'])
  estiloEncabezado(headerRow)

  sheet.columns = [
    { key: 'nombre', width: 32 },
    { key: 'categoria', width: 18 },
    { key: 'disponible', width: 14 },
    { key: 'stock', width: 12 },
    { key: 'alerta', width: 16 },
  ]

  platos.forEach((p, idx) => {
    const bajoStock = p.stock !== null && p.stock <= 5
    const row = sheet.addRow([
      p.nombre,
      p.categoria,
      p.disponible ? 'Sí' : 'No',
      p.stock === null ? 'Ilimitado' : p.stock,
      bajoStock ? 'BAJO STOCK' : '',
    ])
    estiloFila(row, idx, 4)
    if (bajoStock) {
      row.getCell(5).font = { bold: true, color: { argb: 'FFE53935' } }
    }
  })

  return workbook.xlsx.writeBuffer()
}

module.exports = { generarGanancias, generarStock }
