const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const rateLimit = require('express-rate-limit')

// Anti-Spam: Máximo 5 intentos de reserva cada 15 minutos por IP
const inscriptionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Aumentado para pruebas (antes 5)
    message: { error: '⛔ Demasiados intentos de reserva. Por favor espera 15 minutos.' }
})

/**
 * POST /inscripciones
 * Inscribe a un jugador en un cupo específico.
 * Lógica mejorada: Autogestión de Identidad (Jugador Persistente).
 * Soporta inscripciones en cupos 'LIBRE' o suplencias en 'ClaseSuelta' liberada por hoy.
 */
router.post('/', inscriptionLimiter, async (req, res) => {
    try {
        const {
            cupoId,
            origen = 'web_publica',
            nombre,
            apellido,
            telefono,
            email,
            categoriaDeclarada
        } = req.body

        if (!cupoId) return res.status(400).json({ error: 'Falta cupoId' })
        if (!nombre || !apellido || !email) return res.status(400).json({ error: 'Nombre, Apellido y Email son obligatorios' })

        const inscripcion = await prisma.$transaction(async (tx) => {
            // 1. Verificar Cupo Base
            const cupo = await tx.cupo.findUnique({
                where: { id: cupoId },
                include: { turno: { select: { categoriaId: true } } }
            })
            if (!cupo) throw new Error('El cupo no existe')

            // DETECCIÓN DE FECHA HOY (UTC para consistencia básica con frontend)
            const todayStr = new Date().toISOString().split('T')[0];

            let esSuplencia = false;
            let claseSuelta = null;

            if (cupo.estado !== 'LIBRE') {
                // El cupo está ocupado mensual, PERO podría ser libre HOY
                claseSuelta = await tx.claseSuelta.findFirst({
                    where: {
                        cupoId: cupoId,
                        fecha: todayStr,
                        estado: 'LIBRE'
                    }
                })

                if (claseSuelta) {
                    esSuplencia = true;
                } else {
                    throw new Error('El cupo no está disponible')
                }
            }

            // 2. Gestión de Jugador (Find or Create)
            // SOLO si es Inscripción Mensual (No Suplencia), garantizamos que exista el jugador.
            let jugador = await tx.jugador.findUnique({ where: { email } })
            let nuevoCodigoJugador = null;

            if (!esSuplencia && !jugador) {
                // Caso: Alta de Alumno Regular (Mensual)
                const generarCodigo = () => Math.random().toString(36).substring(2, 6).toUpperCase();
                let codigo = generarCodigo();

                jugador = await tx.jugador.create({
                    data: {
                        nombre, apellido, email, telefono, codigo, activo: true,
                        categoriaId: cupo.turno.categoriaId
                    }
                })
                nuevoCodigoJugador = codigo;
            }
            // Si es Suplencia y no existe jugador, NO lo creamos. Seguimos como "Invitado puro".

            // 3. Crear Inscripción o Tomar Suplencia
            const codigoCancelacion = Math.floor(1000 + Math.random() * 9000).toString()

            if (esSuplencia) {
                // --- CAMINO SUPLENCIA (Actualizar ClaseSuelta) ---
                // Si existe jugador (era alumno viejo), guardamos su ID referencia, sino solo texto.
                const infoTomado = jugador
                    ? `${nombre} ${apellido} (${email}) - ID:${jugador.id}`
                    : `${nombre} ${apellido} (${email}) - INVITADO`;

                await tx.claseSuelta.update({
                    where: { id: claseSuelta.id },
                    data: {
                        estado: 'TOMADO',
                        tomadoPor: infoTomado
                    }
                })

                // Retornar objeto "fake" compatible
                return {
                    id: 0,
                    cupoId,
                    origen: 'suplencia_diaria',
                    codigoCancelacion: 'TEMP-' + codigoCancelacion,
                    fecha: new Date(),
                    jugadorId: jugador ? jugador.id : null,
                    jugadorCodigo: jugador ? jugador.codigo : null, // Null si es invitado
                    esNuevoJugador: false, // Nunca es alta de socio en suplencia
                    esSuplencia: true, // Flag para el front
                    mensajeExtra: 'Has tomado el turno SÓLO POR HOY.'
                }

            } else {
                // --- CAMINO INSCRIPCIÓN MENSUAL NORMAL ---
                if (!jugador) throw new Error('Error interno: No se pudo procesar el alta del alumno.')

                const yaInscrito = await tx.inscripcion.findFirst({
                    where: { jugadorId: jugador.id, cupo: { turnoId: cupo.turnoId } }
                })
                if (yaInscrito) throw new Error('Ya estás inscrito en este turno (con tu email registrado).')

                const nuevaInscripcion = await tx.inscripcion.create({
                    data: {
                        jugadorId: jugador.id,
                        cupoId,
                        origen,
                        nombreInvitado: nombre,
                        apellidoInvitado: apellido,
                        telefono,
                        email,
                        codigoCancelacion
                    }
                })

                await tx.cupo.update({
                    where: { id: cupoId },
                    data: { estado: 'OCUPADO' }
                })

                return {
                    ...nuevaInscripcion,
                    jugadorCodigo: jugador.codigo,
                    esNuevoJugador: !!nuevoCodigoJugador,
                    esSuplencia: false
                }
            }
        })

        res.status(201).json(inscripcion)

    } catch (error) {
        console.error(error)

        // Manejo de Race Condition (Concurrencia)
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: '🚫 ¡Te ganaron de mano!',
                instruction: 'El cupo fue ocupado por otra persona milisegundos antes que confirmaras. Por favor, elige otro lugar.'
            })
        }

        res.status(500).json({ error: error.message || 'Error al inscribir' })
    }
})

/**
 * POST /inscripciones/cancelar
 * Cancela una inscripción usando el código de seguridad
 */
router.post('/cancelar', async (req, res) => {
    try {
        const { codigo } = req.body

        if (!codigo) {
            return res.status(400).json({ error: 'Falta código de cancelación' })
        }

        await prisma.$transaction(async (tx) => {
            const inscripcion = await tx.inscripcion.findUnique({
                where: { codigoCancelacion: codigo }
            })

            if (!inscripcion) {
                throw new Error('Código inválido o inscripción no encontrada')
            }

            // ==========================================
            // LÓGICA DE VENTANA DE ARREPENTIMIENTO (1H)
            // ==========================================
            const ahora = new Date()
            const fechaInscripcion = new Date(inscripcion.fecha) // campo 'fecha' es DateTime @default(now())
            const diferenciaMs = ahora - fechaInscripcion
            const diferenciaMinutos = Math.floor(diferenciaMs / 1000 / 60)

            // Límite: 60 minutos
            if (diferenciaMinutos > 60) {
                // Error funcional específico
                throw new Error('TIEMPO_EXPIRADO')
            }

            // Eliminar inscripción
            await tx.inscripcion.delete({
                where: { id: inscripcion.id }
            })

            // Liberar cupo
            await tx.cupo.update({
                where: { id: inscripcion.cupoId },
                data: { estado: 'LIBRE' }
            })
        })

        res.json({ message: 'Tu reserva ha sido cancelada exitosamente.' })

    } catch (error) {
        console.error(error)

        if (error.message === 'Código inválido o inscripción no encontrada') {
            return res.status(400).json({ error: error.message })
        }

        if (error.message === 'TIEMPO_EXPIRADO') {
            return res.status(403).json({
                error: 'El periodo de cancelación automática (1 hora) ha expirado.',
                instruction: 'Por favor, contacta a la administración para gestionar tu baja.'
            })
        }

        res.status(500).json({ error: 'Error al cancelar: ' + error.message })
    }
})

/**
 * DELETE /inscripciones/:id
 * Cancela una inscripción y libera el cupo
 */
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)

        await prisma.$transaction(async (tx) => {
            // 1. Buscar la inscripción para saber cuál cupo liberar
            const inscripcion = await tx.inscripcion.findUnique({
                where: { id }
            })

            if (!inscripcion) {
                throw new Error('Inscripción no encontrada')
            }

            // 2. Eliminar inscripción
            await tx.inscripcion.delete({
                where: { id }
            })

            // 3. Liberar el cupo
            await tx.cupo.update({
                where: { id: inscripcion.cupoId },
                data: { estado: 'LIBRE' }
            })
        })

        res.json({ message: 'Inscripción cancelada exitosamente' })

    } catch (error) {
        console.error(error)
        if (error.message === 'Inscripción no encontrada') {
            return res.status(404).json({ error: error.message })
        }
        res.status(500).json({ error: 'Error al cancelar la inscripción' })
    }
})

/**
 * POST /inscripciones/mover
 * Mueve una inscripción existente a un nuevo cupo libre.
 * PROTEGIDO: Solo Admin
 */
router.post('/mover', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const { inscripcionId, nuevoCupoId } = req.body

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado' })
        }

        if (!inscripcionId || !nuevoCupoId) {
            return res.status(400).json({ error: 'Faltan datos (inscripcionId, nuevoCupoId)' })
        }

        await prisma.$transaction(async (tx) => {
            // 1. Verificar inscripción y cupo actual
            const inscripcion = await tx.inscripcion.findUnique({
                where: { id: inscripcionId },
                include: { cupo: true } // Para saber cuál liberar
            })

            if (!inscripcion) throw new Error('Inscripción no encontrada')

            // 2. Verificar nuevo cupo
            const nuevoCupo = await tx.cupo.findUnique({
                where: { id: nuevoCupoId }
            })

            if (!nuevoCupo) throw new Error('Cupo destino no encontrado')
            if (nuevoCupo.estado !== 'LIBRE') throw new Error('El cupo destino no está LIBRE')
            // Validación opcional: Chequear si es el mismo turno o categoría (decidimos ser flexibles)

            // 3. Ejecutar el movimiento (Swap)

            // Liberar cupo anterior
            await tx.cupo.update({
                where: { id: inscripcion.cupoId },
                data: { estado: 'LIBRE' }
            })

            // Ocupar nuevo cupo
            await tx.cupo.update({
                where: { id: nuevoCupoId },
                data: { estado: 'OCUPADO' }
            })

            // Mover inscripción
            await tx.inscripcion.update({
                where: { id: inscripcionId },
                data: { cupoId: nuevoCupoId }
            })
        })

        res.json({ message: 'Alumno movido exitosamente' })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message || 'Error moviendo alumno' })
    }
})

/**
 * POST /inscripciones/mis-clases
 * Busca las clases (inscripciones) activas de un alumno por su CÓDIGO.
 * Devuelve la data necesaria para que el alumno seleccione cuál liberar.
 */
router.post('/mis-clases', inscriptionLimiter, async (req, res) => {
    try {
        const { codigo } = req.body
        if (!codigo) return res.status(400).json({ error: 'Falta ingresar el código' })

        // Buscar Jugador
        const jugador = await prisma.jugador.findUnique({
            where: { codigo: codigo.trim().toUpperCase() }
        })

        if (!jugador) {
            return res.status(404).json({ error: 'Código de alumno no válido.' })
        }

        const todayStr = new Date().toISOString().split('T')[0]

        // Buscar Inscripciones Activas (Turnos Activos)
        // Solo traemos inscripciones permanentes del jugador
        const inscripciones = await prisma.inscripcion.findMany({
            where: {
                jugadorId: jugador.id,
                cupo: {
                    turno: { activo: true }
                }
            },
            include: {
                cupo: {
                    include: {
                        turno: true,
                        cancha: true,
                        // Verificar si YA liberó hoy
                        clasesSueltas: {
                            where: { fecha: todayStr }
                        }
                    }
                }
            }
        })

        if (inscripciones.length === 0) {
            return res.status(200).json([]) // No tiene clases
        }

        // Formatear respuesta
        const resultado = inscripciones.map(ins => {
            const excepcionHoy = ins.cupo.clasesSueltas[0] // array de 0 o 1 elem por el where
            return {
                inscripcionId: ins.id,
                cupoId: ins.cupoId,
                cancha: ins.cupo.cancha.numero,
                dia: ins.cupo.turno.dia,
                horaInicio: ins.cupo.turno.horaInicio,
                horaFin: ins.cupo.turno.horaFin,
                estadoHoy: excepcionHoy ? excepcionHoy.estado : 'NORMAL' // NORMAL (Ocupado por él), LIBRE, TOMADO
            }
        })

        res.json(resultado)

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error al buscar clases' })
    }
})

/**
 * POST /inscripciones/liberar-diario
 * Permite a un alumno liberar su cupo SOLO POR HOY.
 * Validación por CÓDIGO DE ALUMNO.
 */
router.post('/liberar-diario', inscriptionLimiter, async (req, res) => {
    try {
        const { cupoId, codigo } = req.body

        if (!cupoId || !codigo) return res.status(400).json({ error: 'Faltan datos (cupoId, codigo)' })

        await prisma.$transaction(async (tx) => {
            // 1. Validar Jugador por Código
            const jugador = await tx.jugador.findUnique({
                where: { codigo: codigo.trim().toUpperCase() }
            })
            if (!jugador) throw new Error('Código de alumno inválido.')

            // 2. Validar que la inscripción pertenezca a este jugador
            const inscripcion = await tx.inscripcion.findFirst({
                where: {
                    cupoId: parseInt(cupoId),
                    jugadorId: jugador.id
                }
            })

            if (!inscripcion) {
                throw new Error('Este cupo no te pertenece (o no coincide con el código ingresado).')
            }

            // 3. Fecha HOY
            const todayStr = new Date().toISOString().split('T')[0]

            // 4. Verificar si ya existe excepción
            const yaLibero = await tx.claseSuelta.findFirst({
                where: {
                    cupoId: parseInt(cupoId),
                    fecha: todayStr
                }
            })

            if (yaLibero) throw new Error('Ya existe un estado especial para hoy en este cupo.')

            // 5. Crear excepción (Liberar)
            await tx.claseSuelta.create({
                data: {
                    cupoId: parseInt(cupoId),
                    fecha: todayStr,
                    estado: 'LIBRE',
                    origen: 'alumno_libera_codigo'
                }
            })
        })

        res.json({ message: 'Has liberado tu lugar por hoy. ¡Gracias por avisar!' })

    } catch (e) {
        console.error(e)
        res.status(400).json({ error: e.message })
    }
})

module.exports = router
