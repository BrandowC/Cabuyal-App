const { describe, it, expect, vi } = require('vitest')
const { requireRole } = require('../src/auth/middleware')

function mockRes() {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('requireRole', () => {
  it('rechaza si no hay usuario autenticado', () => {
    const req = {}
    const res = mockRes()
    const next = vi.fn()

    requireRole('admin')(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza si el rol del usuario no está permitido', () => {
    const req = { user: { rol: 'empleado' } }
    const res = mockRes()
    const next = vi.fn()

    requireRole('admin', 'caja')(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('deja pasar si el rol está permitido', () => {
    const req = { user: { rol: 'caja' } }
    const res = mockRes()
    const next = vi.fn()

    requireRole('admin', 'caja')(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
