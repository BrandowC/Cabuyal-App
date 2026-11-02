import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { validarQuitarAcceso } = require('../src/services/accesoUsuarios')

const usuario = (id, rol = 'empleado', activo = true) => ({ id, rol, activo })

describe('validarQuitarAcceso', () => {
  it('permite eliminar a un empleado', () => {
    expect(validarQuitarAcceso({ accion: 'eliminar', objetivo: usuario(2), solicitanteId: 1, adminsActivosRestantes: 1 })).toBeNull()
  })

  it('no deja eliminarse a uno mismo', () => {
    expect(validarQuitarAcceso({ accion: 'eliminar', objetivo: usuario(1, 'admin'), solicitanteId: 1, adminsActivosRestantes: 2 }))
      .toMatch(/tu propio usuario/)
  })

  it('no deja desactivarse a uno mismo', () => {
    expect(validarQuitarAcceso({ accion: 'desactivar', objetivo: usuario(1, 'admin'), solicitanteId: 1, adminsActivosRestantes: 2 }))
      .toMatch(/desactivar tu propio/)
  })

  it('no deja eliminar al último administrador activo', () => {
    expect(validarQuitarAcceso({ accion: 'eliminar', objetivo: usuario(3, 'admin'), solicitanteId: 1, adminsActivosRestantes: 0 }))
      .toMatch(/al menos un administrador/)
  })

  it('permite eliminar a un administrador si queda otro activo', () => {
    expect(validarQuitarAcceso({ accion: 'eliminar', objetivo: usuario(3, 'admin'), solicitanteId: 1, adminsActivosRestantes: 1 })).toBeNull()
  })

  it('permite eliminar a un administrador que ya estaba inactivo', () => {
    expect(validarQuitarAcceso({ accion: 'eliminar', objetivo: usuario(3, 'admin', false), solicitanteId: 1, adminsActivosRestantes: 0 })).toBeNull()
  })

  it('no deja quitar el rol al último administrador', () => {
    expect(validarQuitarAcceso({ accion: 'quitar_admin', objetivo: usuario(3, 'admin'), solicitanteId: 1, adminsActivosRestantes: 0 }))
      .toMatch(/al menos un administrador/)
  })

  it('rechaza un usuario que no existe', () => {
    expect(validarQuitarAcceso({ accion: 'eliminar', objetivo: null, solicitanteId: 1, adminsActivosRestantes: 1 })).toMatch(/no existe/)
  })
})
