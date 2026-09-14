const { Router } = require('express')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const { z } = require('zod')
const { prisma } = require('../db')
const { firmarToken, setCookieSesion, limpiarCookieSesion } = require('../auth/jwt')
const { requireAuth } = require('../auth/middleware')
const { validateBody } = require('../validate')

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
})

const loginSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
})

router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { usuario, password } = req.body
  const user = await prisma.usuario.findUnique({ where: { usuario } })
  if (!user || !user.activo) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }
  const token = firmarToken(user)
  setCookieSesion(res, token)
  res.json({ id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol })
})

router.post('/logout', (req, res) => {
  limpiarCookieSesion(res)
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

module.exports = router
