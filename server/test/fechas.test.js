const { describe, it, expect } = require('vitest')
const { rangoFecha, etiquetaPeriodo } = require('../src/utils/fechas')

describe('rangoFecha', () => {
  const ahora = new Date('2026-03-15T18:30:00')

  it('usa el inicio del día para el filtro "hoy" por defecto', () => {
    const { gte } = rangoFecha({}, ahora)
    expect(gte.toISOString().slice(0, 10)).toBe('2026-03-15')
    expect(gte.getHours()).toBe(0)
  })

  it('retrocede 7 días para "semana"', () => {
    const { gte } = rangoFecha({ filtro: 'semana' }, ahora)
    expect(gte.getTime()).toBe(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
  })

  it('usa el primer día del mes para "mes"', () => {
    const { gte } = rangoFecha({ filtro: 'mes' }, ahora)
    expect(gte.getDate()).toBe(1)
    expect(gte.getMonth()).toBe(ahora.getMonth())
  })

  it('prioriza el rango personalizado sobre el filtro', () => {
    const { gte, lte } = rangoFecha({ filtro: 'hoy', desde: '2026-01-01', hasta: '2026-01-31' }, ahora)
    expect(gte.toISOString().slice(0, 10)).toBe('2026-01-01')
    expect(lte.toISOString().slice(0, 10)).toBe('2026-01-31')
  })

  it('acepta solo "desde" sin "hasta"', () => {
    const rango = rangoFecha({ desde: '2026-01-01' }, ahora)
    expect(rango.gte).toBeDefined()
    expect(rango.lte).toBeUndefined()
  })
})

describe('etiquetaPeriodo', () => {
  it('etiqueta los filtros conocidos', () => {
    expect(etiquetaPeriodo({ filtro: 'mes' })).toBe('ESTE MES')
  })

  it('arma un rango legible cuando hay fechas personalizadas', () => {
    expect(etiquetaPeriodo({ desde: '2026-01-01', hasta: '2026-01-31' })).toBe('DEL 2026-01-01 AL 2026-01-31')
  })
})
