const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

/**
 * POST /auth/login
 * Autenticación de Administrador
 */
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body

        if (!usuario || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña obligatorios' })
        }

        // 1. Buscar admin
        const admin = await prisma.admin.findUnique({
            where: { usuario }
        })

        if (!admin) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        // 2. Verificar password
        const validPassword = await bcrypt.compare(password, admin.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        if (!admin.activo) {
            return res.status(403).json({ error: 'Usuario inactivo' })
        }

        // 3. Generar Token
        const secret = process.env.JWT_SECRET || 'secret_dev_key'
        const token = jwt.sign(
            { id: admin.id, usuario: admin.usuario, role: 'ADMIN' },
            secret,
            { expiresIn: '8h' }
        )

        res.json({
            token,
            admin: {
                id: admin.id,
                usuario: admin.usuario
            }
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error en el login' })
    }
})

// Endpoint de prueba para verificar token
// GET /auth/me
router.get('/me', require('../middleware/authMiddleware'), (req, res) => {
    res.json({ user: req.user, status: 'Authenticated' })
})

module.exports = router
