const { prisma } = require('../db')
const { COOKIE_NAME, verificarToken } = require('./jwt')

// La sesión (JWT) dura 12 horas y por sí sola no sabe si el usuario fue desactivado o eliminado después de
// entrar. Este middleware revisa en cada petición de /api que la cuenta siga existiendo y activa, así que un
// empleado que sale del restaurante pierde el acceso al instante y no hasta que venza su sesión.
// El resultado se guarda unos segundos en memoria para no consultar la base de datos en cada petición.
const TTL_MS = 10 * 1000
const cache = new Map() // id -> { activo, hasta }

async function usuarioActivo(id) {
  const guardado = cache.get(id)
  if (guardado && guardado.hasta > Date.now()) return guardado.activo
  const u = await prisma.usuario.findUnique({ where: { id }, select: { activo: true } })
  const activo = Boolean(u && u.activo)
  cache.set(id, { activo, hasta: Date.now() + TTL_MS })
  return activo
}

// Se llama al desactivar o eliminar a alguien para que el cambio se aplique de inmediato
function olvidarUsuario(id) {
  cache.delete(id)
}

// Rutas que deben funcionar aunque la cookie guardada sea de un usuario que ya no existe (para volver a entrar)
const RUTAS_LIBRES = ['/auth/login', '/auth/logout']

async function exigirUsuarioActivo(req, res, next) {
  if (RUTAS_LIBRES.includes(req.path)) return next()
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return next() // sin sesión: cada ruta decide si la exige (catálogo público, login…)
  let payload
  try {
    payload = verificarToken(token)
  } catch {
    return next() // token inválido o vencido: lo rechaza requireAuth en las rutas protegidas
  }
  try {
    if (await usuarioActivo(payload.id)) return next()
    res.clearCookie(COOKIE_NAME)
    return res.status(401).json({ error: 'Tu usuario ya no tiene acceso' })
  } catch (err) {
    return next(err)
  }
}

module.exports = { exigirUsuarioActivo, olvidarUsuario }
