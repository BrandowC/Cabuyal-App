// Reglas para pasar la cuenta de una mesa a otra. Es una función pura (recibe lo ya consultado) para
// poder probarla sin base de datos. Devuelve el mensaje del primer problema, o null si se puede mover.
function validarCambioMesa({ origen, destino, productosOrigen, productosDestino }) {
  if (!origen || !destino) return 'La mesa no existe'
  if (origen.id === destino.id) return 'Elige una mesa distinta a la actual'
  if (productosOrigen === 0) return `La mesa ${origen.numero} no tiene productos. Si ya no la usan, ciérrala sin consumo`
  if (origen.estado === 'cuenta') return `La mesa ${origen.numero} ya pidió la cuenta. Devuélvela a ocupada para poder cambiarla`
  if (origen.estado !== 'ocupada') return `La mesa ${origen.numero} no está ocupada`
  // Solo se mueve a una mesa libre y vacía: unir cuentas de dos mesas no está permitido
  if (destino.estado !== 'libre' || productosDestino > 0) return `La mesa ${destino.numero} ya está ocupada`
  return null
}

class ReglaDeMesa extends Error {}

module.exports = { validarCambioMesa, ReglaDeMesa }
