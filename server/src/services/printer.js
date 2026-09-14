// Categorías que NO se imprimen en la comanda de cocina (son de barra, no de cocina)
const CATEGORIAS_BEBIDA = ['Bebidas', 'Limonadas', 'Malteadas', 'Jarras', 'Gaseosas', 'Cervezas']

function esComida(pedido) {
  return !CATEGORIAS_BEBIDA.includes(pedido.categoria)
}

class NullPrinterDriver {
  async imprimir(mesa, items) {
    console.log(`[COCINA] (impresora no configurada) Mesa ${mesa.numero}:`)
    items.forEach((p) => console.log(`  x${p.cantidad} ${p.nombrePlato}${p.notas ? ` — ${p.notas}` : ''}`))
  }
}

class EscPosDriver {
  async imprimir(mesa, items) {
    // Se activa configurando PRINTER_ENABLED=true y las variables PRINTER_TYPE / PRINTER_IP / PRINTER_PATH.
    // Requiere conectar la impresora térmica real antes de usarla — ver README.
    const { printer: ThermalPrinter, types: PrinterTypes } = require('node-thermal-printer')

    const interfaceCfg = process.env.PRINTER_TYPE === 'usb'
      ? process.env.PRINTER_PATH
      : `tcp://${process.env.PRINTER_IP}`

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: interfaceCfg,
    })

    printer.alignCenter()
    printer.bold(true)
    printer.println(`MESA ${mesa.numero}`)
    printer.bold(false)
    printer.drawLine()
    printer.alignLeft()
    items.forEach((p) => {
      printer.println(`x${p.cantidad}  ${p.nombrePlato}`)
      if (p.notas) printer.println(`   Nota: ${p.notas}`)
    })
    printer.cut()

    await printer.execute()
  }
}

const driver = process.env.PRINTER_ENABLED === 'true' ? new EscPosDriver() : new NullPrinterDriver()

async function imprimirComanda(mesa, pedidosNuevos) {
  const items = pedidosNuevos.filter(esComida)
  if (items.length === 0) return
  try {
    await driver.imprimir(mesa, items)
  } catch (err) {
    console.error('No se pudo imprimir la comanda de cocina:', err.message)
  }
}

module.exports = { imprimirComanda, CATEGORIAS_BEBIDA, esComida }
