const logoPath = window.location.protocol === 'file:'
  ? new URL('./assets/logo.png', window.location.href).href
  : '/src/assets/logo.png'

export default logoPath