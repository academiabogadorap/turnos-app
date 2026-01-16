const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const authMiddleware = require('../middleware/authMiddleware')
const rateLimit = require('express-rate-limit')

const waitlistLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: '⛔ Demasiados intentos. Espera unos minutos.' }
})

/**
 * POST /espera
 * Agrega un alumno a la lista de espera de un turno
 */
router.post('/', waitlistLimiter, async (req, res) => {
    try {
        const { turnoId, nombre, apellido, email, telefono } = req.body

        if (!turnoId || !nombre || !apellido || !email) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' })
        }

        // 1. Verificar existencia del turno
        const turno = await prisma.turno.findUnique({ where: { id: parseInt(turnoId) } })
        if (!turno) return res.status(404).json({ error: 'Turno no encontrado' })

        // 2. Crear registro en espera
        const espera = await prisma.listaEspera.create({
            data: {
                turnoId: parseInt(turnoId),
                nombre,
                apellido,
                email,
                telefono,
                estado: 'PENDIENTE'
            }
        })

        res.status(201).json(espera)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al anotarse en espera' })
    }
})

/**
 * GET /espera/turno/:id
 * Obtiene la lista de espera de un turno específico (Solo Admin)
 */
router.get('/turno/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const lista = await prisma.listaEspera.findMany({
            where: {
                turnoId: id,
                estado: 'PENDIENTE'
            },
            orderBy: { fechaAlta: 'asc' }
        })

        res.json(lista)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error obteniendo lista de espera' })
    }
})

/**
 * POST /espera/:id/asignar
 * Mueve un alumno de la lista de espera a un cupo libre de ese turno.
 * Solo Admin.
 */
router.post('/:id/asignar', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id) // ID de la ListaEspera

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado' })
        }

        await prisma.$transaction(async (tx) => {
            // 1. Buscar la entrada en espera
            const espera = await tx.listaEspera.findUnique({
                where: { id }
            })

            if (!espera) throw new Error('Registro de espera no encontrado')
            if (espera.estado !== 'PENDIENTE') throw new Error('Este alumno ya no está pendiente')

            // 2. Buscar un cupo LIBRE en el mismo turno
            // Priorizamos cupos que NO tengan clases sueltas (estado base LIBRE)
            // Ojo: Si hay clases sueltas 'LIBRE' hoy, eso es para un día. Acá estamos asignando el cupo MENSUALMENTE.
            // Por lo tanto, buscamos un cupo cuyo estado base sea LIBRE.
            const cupoLibre = await tx.cupo.findFirst({
                where: {
                    turnoId: espera.turnoId,
                    estado: 'LIBRE'
                },
                orderBy: { orden: 'asc' }
            })

            if (!cupoLibre) throw new Error('No hay cupos disponibles en este turno para asignar.')

            // 3. Gestionar Jugador (Find or Create)
            // Al pasar de espera a cupo fijo, asumimos que se convierte en alumno regular.
            let jugador = await tx.jugador.findUnique({ where: { email: espera.email } })

            if (!jugador) {
                // Crear Jugador
                const generarCodigo = () => Math.random().toString(36).substring(2, 6).toUpperCase();

                // Necesitamos el turno para saber la categoria inicial
                const turno = await tx.turno.findUnique({ where: { id: espera.turnoId } })

                jugador = await tx.jugador.create({
                    data: {
                        nombre: espera.nombre,
                        apellido: espera.apellido,
                        email: espera.email,
                        telefono: espera.telefono,
                        codigo: generarCodigo(),
                        categoriaId: turno.categoriaId,
                        activo: true
                    }
                })
            }

            // 4. Crear Inscripción
            const codigoCancelacion = Math.floor(1000 + Math.random() * 9000).toString()

            await tx.inscripcion.create({
                data: {
                    jugadorId: jugador.id,
                    cupoId: cupoLibre.id,
                    origen: 'admin_espera',
                    // Copiamos datos de contacto por redundancia/histórico
                    email: espera.email,
                    telefono: espera.telefono,
                    codigoCancelacion: codigoCancelacion
                }
            })

            // 5. Actualizar estados
            await tx.cupo.update({
                where: { id: cupoLibre.id },
                data: { estado: 'OCUPADO' }
            })

            await tx.listaEspera.update({
                where: { id },
                data: { estado: 'ASIGNADO' }
            })
        })

        res.json({ message: 'Alumno asignado al cupo exitosamente.' })

    } catch (e) {
        console.error(e)
        // Manejo manual de errores conocidos
        if (e.message.includes('No hay cupos') || e.message.includes('pendiente')) {
            return res.status(409).json({ error: e.message })
        }
        res.status(500).json({ error: 'Error interno: ' + e.message })
    }
})

/**
 * DELETE /espera/:id
 * Elimina alguien de la lista (por ID)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        await prisma.listaEspera.delete({ where: { id } })
        res.json({ message: 'Eliminado de la lista de espera' })
    } catch (e) {
        res.status(500).json({ error: 'Error al eliminar' })
    }
})

module.exports = router
