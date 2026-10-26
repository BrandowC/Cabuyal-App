// Avisos por WhatsApp al cliente usando el enlace oficial wa.me: abre WhatsApp con el mensaje
// ya escrito y el empleado solo pulsa "enviar". No requiere cuenta de WhatsApp Business API.
const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`

export function urlWhatsapp(telefono, texto) {
  const digitos = String(telefono || '').replace(/\D/g, '')
  const numero = digitos.length === 10 ? `57${digitos}` : digitos
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export function mensajeConfirmacion(d) {
  const recoger = d.tipoEntrega === 'recoger'
  const lineas = d.items.map((i) => `• x${i.cantidad} ${i.nombre} — ${pesos(i.precio * i.cantidad)}`)
  return [
    `¡Hola ${d.nombre}! 👋 Tu pedido en *El Cabuyal* fue confirmado ✅`,
    '',
    ...lineas,
    '',
    `Subtotal: ${pesos(d.subtotal)}`,
    recoger
      ? '🏪 Puedes pasar a recogerlo al local en unos minutos.'
      : '🛵 Ya lo estamos preparando. Te confirmamos el valor del domicilio y el tiempo de entrega por aquí.',
    '',
    '¡Gracias por elegirnos!',
  ].join('\n')
}
