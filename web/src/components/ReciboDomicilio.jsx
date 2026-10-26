import ReciboTermico from './ReciboTermico'

const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }

export default function ReciboDomicilio({ domicilio, onClose, copia = false }) {
  if (!domicilio) return null
  const esRecoger = domicilio.tipoEntrega === 'recoger'

  return (
    <ReciboTermico
      onClose={onClose}
      copia={copia}
      subtitulo={esRecoger ? 'Pedido para recoger' : 'Pedido a domicilio'}
      titulo="RECIBO"
      numero={domicilio.id}
      fecha={domicilio.fecha}
      filas={[
        ['Cliente', domicilio.nombre],
        ['Teléfono', domicilio.telefono],
        [esRecoger ? 'Recoge en' : 'Dirección', esRecoger ? 'El Cabuyal · Palermo' : domicilio.direccion],
        ['Referencia', domicilio.referencia],
        ['Tomado por', domicilio.creadoPor],
        ['Pago', METODOS[domicilio.metodoPago] || domicilio.metodoPago],
      ]}
      items={(domicilio.items || []).map((p) => ({
        cantidad: p.cantidad, nombre: p.nombre, valor: p.precio * p.cantidad, notas: p.notas,
      }))}
      subtotales={[
        ['Subtotal', domicilio.subtotal],
        ...(domicilio.costoEnvio > 0 ? [['Domicilio', domicilio.costoEnvio]] : []),
      ]}
      total={domicilio.total}
      pie="¡Gracias por su pedido!"
    />
  )
}
