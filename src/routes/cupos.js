const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const authMiddleware = require('../middleware/authMiddleware')

/**
 * PATCH /cupos/:id
 * Actualiza el estado de un cupo (Ej: BLOQUEADO, LIBRE)
 * Solo Admin.
 */
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const { estado } = req.body

        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        // Validar estados permitidos
        const estadosValidos = ['LIBRE', 'BLOQUEADO', 'OCUPADO']
        if (estado && !estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' })
        }

        const cupoUpdated = await prisma.cupo.update({
            where: { id },
            data: { estado }
        })

        res.json(cupoUpdated)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar cupo' })
    }
})

module.exports = router
