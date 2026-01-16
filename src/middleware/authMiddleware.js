const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    // 1. Obtener el header Authorization
    const authHeader = req.headers['authorization']

    // Formato esperado: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' })
    }

    try {
        // 2. Verificar el token
        const secret = process.env.JWT_SECRET || 'secret_dev_key'
        const decoded = jwt.verify(token, secret)

        // 3. Adjuntar usuario al request
        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' })
    }
}

module.exports = authMiddleware
