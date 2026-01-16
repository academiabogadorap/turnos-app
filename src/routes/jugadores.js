const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

/**
 * POST /jugadores/login
 * Autenticación simple por ID de Jugador (Código)
 */
router.post('/login', async (req, res) => {
    try {
        const { codigo } = req.body
        if (!codigo) return res.status(400).json({ error: 'Falta código' })

        const jugador = await prisma.jugador.findUnique({
            where: { codigo: codigo.toUpperCase() },
            include: {
                inscripciones: {
                    include: {
                        cupo: {
                            include: {
                                turno: { include: { categoria: true } },
                                cancha: true
                            }
                        }
                    },
                    where: {
                        cupo: {
                            turno: { activo: true }
                        }
                    }
                }
            }
        })

        if (!jugador) return res.status(404).json({ error: 'ID de Jugador no encontrado' })
        if (!jugador.activo) return res.status(403).json({ error: 'Jugador inactivo' })

        res.json(jugador)

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error al ingresar' })
    }
})

/**
 * GET /jugadores
 * Lista todos los jugadores (Solo Admin - Futuro)
 */
/**
 * POST /jugadores/liberar-clase
 * Permite a un jugador liberar SU cupo para una fecha específica.
 */
router.post('/liberar-clase', async (req, res) => {
    try {
        const { codigoJugador, cupoId, fecha } = req.body

        if (!codigoJugador || !cupoId || !fecha) {
            return res.status(400).json({ error: 'Faltan datos' })
        }

        // 1. Validar Jugador
        const jugador = await prisma.jugador.findUnique({
            where: { codigo: codigoJugador.toUpperCase() }
        })
        if (!jugador) return res.status(403).json({ error: 'Jugador inválido' })

        // 2. Validar que el cupo es suyo
        const inscripcion = await prisma.inscripcion.findFirst({
            where: {
                jugadorId: jugador.id,
                cupoId: parseInt(cupoId)
            }
        })

        if (!inscripcion) return res.status(403).json({ error: 'No eres el titular de este cupo.' })

        // 3. Crear Excepción (Clase Suelta)
        // Verificar si ya existe
        const existe = await prisma.claseSuelta.findFirst({
            where: {
                cupoId: parseInt(cupoId),
                fecha: fecha
            }
        })

        if (existe) return res.status(400).json({ error: 'Ya has liberado este día.' })

        await prisma.claseSuelta.create({
            data: {
                cupoId: parseInt(cupoId),
                fecha,
                estado: 'LIBRE'
            }
        })

        res.json({ message: 'Clase liberada con éxito. ¡Gracias por avisar!' })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error al liberar clase' })
    }
})



/**
 * PATCH /jugadores/:id
 * Actualizar datos del jugador (Solo Admin)
 */
router.patch('/:id', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const { nombre, apellido, email, categoriaId } = req.body

        await prisma.jugador.update({
            where: { id },
            data: {
                nombre,
                apellido,
                email,
                categoriaId: categoriaId ? parseInt(categoriaId) : undefined
            }
        })

        res.json({ message: 'Jugador actualizado correctamente' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error al actualizar jugador' })
    }
})

module.exports = router
