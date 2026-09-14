const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET
if (!SECRET) throw new Error('Falta JWT_SECRET en las variables de entorno')

const COOKIE_NAME = 'cabuyal_token'
const EXPIRES_IN = '12h'

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, nombre: usuario.nombre, rol: usuario.rol },
    SECRET,
    { expiresIn: EXPIRES_IN }
  )
}

function verificarToken(token) {
  return jwt.verify(token, SECRET)
}

function setCookieSesion(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  })
}

function limpiarCookieSesion(res) {
  res.clearCookie(COOKIE_NAME)
}

module.exports = { COOKIE_NAME, firmarToken, verificarToken, setCookieSesion, limpiarCookieSesion }
