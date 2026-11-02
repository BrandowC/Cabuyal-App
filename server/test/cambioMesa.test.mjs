import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { validarCambioMesa } = require('../src/services/cambioMesa')

const mesa = (id, estado = 'libre') => ({ id, numero: id, estado })

describe('validarCambioMesa', () => {
  const ok = { origen: mesa(5, 'ocupada'), destino: mesa(6, 'libre'), productosOrigen: 3, productosDestino: 0 }

  it('permite mover una mesa ocupada con productos a una mesa libre y vacía', () => {
    expect(validarCambioMesa(ok)).toBeNull()
  })

  it('rechaza la misma mesa', () => {
    expect(validarCambioMesa({ ...ok, destino: mesa(5, 'libre') })).toMatch(/distinta/)
  })

  it('rechaza una mesa de origen sin productos', () => {
    expect(validarCambioMesa({ ...ok, productosOrigen: 0 })).toMatch(/no tiene productos/)
  })

  it('rechaza una mesa que ya pidió la cuenta', () => {
    expect(validarCambioMesa({ ...ok, origen: mesa(5, 'cuenta') })).toMatch(/pidió la cuenta/)
  })

  it('rechaza un origen que no está ocupada', () => {
    expect(validarCambioMesa({ ...ok, origen: mesa(5, 'libre') })).toMatch(/no está ocupada/)
  })

  it('no permite unir cuentas: el destino ocupado se rechaza', () => {
    expect(validarCambioMesa({ ...ok, destino: mesa(6, 'ocupada'), productosDestino: 2 })).toMatch(/ya está ocupada/)
  })

  it('rechaza un destino libre pero con productos sin cobrar', () => {
    expect(validarCambioMesa({ ...ok, productosDestino: 1 })).toMatch(/ya está ocupada/)
  })

  it('rechaza mesas que no existen', () => {
    expect(validarCambioMesa({ ...ok, destino: null })).toMatch(/no existe/)
  })
})
