// Reglas para quitarle el acceso a un usuario (eliminarlo, desactivarlo o quitarle el rol de administrador).
// Función pura: recibe lo ya consultado para poder probarla sin base de datos.
// Devuelve el mensaje del problema, o null si se puede hacer.
function validarQuitarAcceso({ accion, objetivo, solicitanteId, adminsActivosRestantes }) {
  if (!objetivo) return 'El usuario no existe'
  if (objetivo.id === solicitanteId) {
    if (accion === 'eliminar') return 'No puedes eliminar tu propio usuario'
    if (accion === 'desactivar') return 'No puedes desactivar tu propio usuario'
    if (accion === 'quitar_admin') return 'No puedes quitarte a ti mismo el rol de administrador'
  }
  // Siempre debe quedar alguien que pueda administrar el sistema
  if (objetivo.rol === 'admin' && objetivo.activo && adminsActivosRestantes === 0) {
    return 'Debe quedar al menos un administrador activo'
  }
  return null
}

module.exports = { validarQuitarAcceso }
