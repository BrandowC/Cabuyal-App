const { describe, it, expect } = require('vitest')
const { fechaLimite } = require('../src/utils/fechas')

describe('fechaLimite', () => {
  it('retrocede la cantidad de meses configurada', () => {
    const ahora = new Date('2026-09-11T12:00:00')
    const limite = fechaLimite(8, ahora)
    expect(limite.getFullYear()).toBe(2026)
    expect(limite.getMonth()).toBe(0) // enero (septiembre - 8 = enero)
    expect(limite.getDate()).toBe(11)
  })

  it('usa 8 meses por defecto', () => {
    const ahora = new Date('2026-09-11T12:00:00')
    const limite = fechaLimite(undefined, ahora)
    const esperado = new Date(ahora)
    esperado.setMonth(esperado.getMonth() - 8)
    expect(limite.getTime()).toBe(esperado.getTime())
  })
})
