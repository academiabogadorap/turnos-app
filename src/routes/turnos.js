const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

const authMiddleware = require('../middleware/authMiddleware')

/**
 * GET /turnos
 * Obtiene todos los turnos ACTIVOS
 * Optimización: Filtra excepciones (ClasesSueltas) antiguas para no cargar historial innecesario.
 */
router.get('/', async (req, res) => {
    try {
        // Por defecto, filtrar excepciones anteriores a HOY (UTC simple)
        const today = new Date().toISOString().split('T')[0]

        const turnos = await prisma.turno.findMany({
            where: {
                activo: true // Solo turnos vigentes
            },
            include: {
                categoria: true,
                cupos: {
                    include: {
                        inscripcion: {
                            include: {
                                jugador: {
                                    select: {
                                        id: true,
                                        nombre: true,
                                        apellido: true,
                                        email: true, // Needed for other references, but handle with care
                                        categoria: true
                                        // codigo: false (Implicitly excluded)
                                    }
                                }
                            }
                        },
                        // Optimización: Solo traer excepciones futuras o de hoy
                        clasesSueltas: {
                            where: {
                                fecha: { gte: today }
                            }
                        }
                    },
                    orderBy: { orden: 'asc' }
                },
                _count: {
                    select: {
                        listaEspera: {
                            where: { estado: 'PENDIENTE' }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' }
        })
        res.json(turnos)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al obtener turnos' })
    }
})

/**
 * POST /turnos
 * Crea un turno y genera los cupos físicos por cancha
 * PROTEGIDO: Requiere Auth
 */
/**
 * GET /turnos/canchas
 * Lista todas las canchas disponibles
 */
router.get('/canchas', async (req, res) => {
    const canchas = await prisma.cancha.findMany({ orderBy: { numero: 'asc' } })
    res.json(canchas)
})

/**
 * GET /turnos/categorias
 * Lista todas las categorías estructuradas
 */
router.get('/categorias', async (req, res) => {
    const categorias = await prisma.categoria.findMany({
        where: { activa: true },
        orderBy: [{ genero: 'asc' }, { nivel: 'asc' }]
    })
    res.json(categorias)
})

/**
 * POST /turnos
 * Crea un turno y genera los cupos físicos por cancha seleccionada
 * PROTEGIDO: Requiere Auth
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            dia,
            horaInicio,
            horaFin,
            categoriaId,
            cuposPorCancha,
            canchasIds // Array de IDs de canchas a usar [1, 3, ...]
        } = req.body

        // =========================
        // Validaciones básicas
        // =========================
        if (!dia || !horaInicio || !horaFin || !categoriaId || !cuposPorCancha || !canchasIds) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (incluyendo canchasIds)' })
        }

        const cuposInt = Number(cuposPorCancha)
        if (!Number.isInteger(cuposInt) || cuposInt <= 0) {
            return res.status(400).json({ error: 'cuposPorCancha debe ser un entero mayor a 0' })
        }

        if (!Array.isArray(canchasIds) || canchasIds.length === 0) {
            return res.status(400).json({ error: 'Debe seleccionar al menos una cancha' })
        }

        // =========================
        // Obtener canchas seleccionadas
        // =========================
        const canchas = await prisma.cancha.findMany({
            where: {
                id: { in: canchasIds }
            }
        })

        if (canchas.length !== canchasIds.length) {
            return res.status(400).json({ error: 'Algunas canchas seleccionadas no existen' })
        }

        // =========================
        // Transacción
        // =========================
        const resultado = await prisma.$transaction(async (tx) => {
            // 1️⃣ Crear turno
            const turno = await tx.turno.create({
                data: {
                    dia,
                    horaInicio,
                    horaFin,
                    categoriaId: parseInt(categoriaId)
                }
            })

            // 2️⃣ Preparar cupos SOLO para canchas seleccionadas
            const cuposData = []

            for (const cancha of canchas) {
                for (let orden = 1; orden <= cuposInt; orden++) {
                    cuposData.push({
                        turnoId: turno.id,
                        canchaId: cancha.id,
                        orden,
                        estado: 'LIBRE'
                    })
                }
            }

            // 3️⃣ Crear cupos
            await tx.cupo.createMany({
                data: cuposData
            })

            return {
                turnoId: turno.id,
                cuposCreados: cuposData.length,
                canchasUsadas: canchas.length
            }
        })

        // =========================
        // Respuesta OK
        // =========================
        return res.status(201).json({
            turnoId: resultado.turnoId,
            cuposCreados: resultado.cuposCreados,
            canchasUsadas: resultado.canchasUsadas
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: 'Error al crear el turno: ' + error.message
        })
    }
})

/**
 * DELETE /turnos/:id
 * Elimina un turno y sus cupos. Protegido: Solo Admin.
 * Regla: Si tiene inscritos, rechaza (salvo ?force=true).
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })

        // 1️⃣ Seguridad: Solo ADMIN puede eliminar
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tiene permisos de administrador' })
        }

        // 2️⃣ Verificar existencia del turno
        const turno = await prisma.turno.findUnique({
            where: { id },
            include: { _count: { select: { cupos: true } } }
        })

        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' })
        }

        const forceDelete = req.query.force === 'true'

        if (forceDelete) {
            // === HARD DELETE (Destructivo) ===
            // Solo usar para limpieza de errores de carga inmediatos
            await prisma.turno.delete({ where: { id } })

            return res.json({
                message: 'Turno eliminado FÍSICAMENTE (Irreversible)',
                tipoEliminacion: 'FISICA_DESTRUCTIVA'
            })
        } else {
            // === SOFT DELETE (Seguro / Archivo) ===
            // Marcamos como inactivo para que desaparezca de la lista principal
            // pero mantenemos la historia.
            await prisma.turno.update({
                where: { id },
                data: { activo: false }
            })

            return res.json({
                message: 'Turno archivado correctamente.',
                details: {
                    instruction: 'El turno ya no es visible, pero el historial se conserva en la base de datos.',
                    tipoEliminacion: 'LOGICA_SOFT'
                }
            })
        }

    } catch (e) {
        console.error('Error eliminando turno:', e)
        res.status(500).json({ error: 'Error interno gestionando turno' })
    }
})

// ==========================================
// NUEVAS FUNCIONALIDADES ADMIN (FASE 1)
// ==========================================

/**
 * PATCH /turnos/cupos/:id/estado
 * Permite al ADMIN bloquear (candado) o desbloquear un cupo individualmente.
 */
router.patch('/cupos/:id/estado', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const { estado } = req.body // 'LIBRE' | 'BLOQUEADO'

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado' })
        }

        if (!['LIBRE', 'BLOQUEADO'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido. Use LIBRE o BLOQUEADO.' })
        }

        // Verificar si está ocupado
        const cupo = await prisma.cupo.findUnique({
            where: { id },
            include: { inscripcion: true }
        })

        if (!cupo) return res.status(404).json({ error: 'Cupo no encontrado' })

        if (cupo.inscripcion && estado === 'BLOQUEADO') {
            return res.status(409).json({ error: 'No se puede bloquear un cupo ocupado. Libérelo primero.' })
        }

        await prisma.cupo.update({
            where: { id },
            data: { estado }
        })

        res.json({ message: `Estado actualizado a ${estado}` })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error actualizando cupo' })
    }
})

/**
 * DELETE /turnos/cupos/:id/liberar
 * Permite al ADMIN "echar" a un alumno de un cupo (Kick).
 * No verifica ventana de tiempo. Es inmediato.
 */
router.delete('/cupos/:id/liberar', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id) // ID del CUPO

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado' })
        }

        const cupo = await prisma.cupo.findUnique({
            where: { id },
            include: { inscripcion: true }
        })

        if (!cupo) return res.status(404).json({ error: 'Cupo no encontrado' })
        if (!cupo.inscripcion) return res.status(400).json({ error: 'El cupo ya está libre' })

        // Transacción de "Kick"
        await prisma.$transaction([
            prisma.inscripcion.delete({
                where: { id: cupo.inscripcion.id }
            }),
            prisma.cupo.update({
                where: { id },
                data: { estado: 'LIBRE' }
            })
        ])

        res.json({ message: 'Cupo liberado forzosamente (Alumno dado de baja)' })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error liberando cupo' })
    }
})

module.exports = router

