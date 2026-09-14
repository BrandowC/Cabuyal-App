function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: result.error.flatten() })
    }
    req.body = result.data
    next()
  }
}

module.exports = { validateBody }
