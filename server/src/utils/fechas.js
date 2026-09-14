function rangoFecha({ filtro, desde, hasta }, ahora = new Date()) {
  if (desde || hasta) {
    const gte = desde ? new Date(`${desde}T00:00:00`) : undefined
    const lte = hasta ? new Date(`${hasta}T23:59:59.999`) : undefined
    return { ...(gte && { gte }), ...(lte && { lte }) }
  }
  if (filtro === 'semana') {
    return { gte: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000) }
  }
  if (filtro === 'mes') {
    return { gte: new Date(ahora.getFullYear(), ahora.getMonth(), 1) }
  }
  // hoy (default)
  return { gte: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()) }
}

const ETIQUETAS_PERIODO = { hoy: 'HOY', semana: 'ESTA SEMANA', mes: 'ESTE MES' }

function etiquetaPeriodo({ filtro, desde, hasta }) {
  if (desde || hasta) return `DEL ${desde || '...'} AL ${hasta || '...'}`
  return ETIQUETAS_PERIODO[filtro] || (filtro || 'HOY').toUpperCase()
}

function fechaLimite(meses = Number(process.env.RETENTION_MONTHS) || 8, ahora = new Date()) {
  const limite = new Date(ahora)
  limite.setMonth(limite.getMonth() - meses)
  return limite
}

module.exports = { rangoFecha, etiquetaPeriodo, fechaLimite }
