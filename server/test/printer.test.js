const { describe, it, expect } = require('vitest')
const { esComida } = require('../src/services/printer')

describe('esComida', () => {
  it('excluye categorías de bebida de la comanda de cocina', () => {
    expect(esComida({ categoria: 'Gaseosas' })).toBe(false)
    expect(esComida({ categoria: 'Cervezas' })).toBe(false)
    expect(esComida({ categoria: 'Malteadas' })).toBe(false)
  })

  it('incluye categorías de comida', () => {
    expect(esComida({ categoria: 'Parrilla' })).toBe(true)
    expect(esComida({ categoria: 'Hamburguesas' })).toBe(true)
  })
})
