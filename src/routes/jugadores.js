const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const authMiddleware = require('../middleware/authMiddleware')

/**
 * GET /jugadores
 * Lista todos los jugadores registrados (Solo Admin)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const jugadores = await prisma.jugador.findMany({
            include: {
                categoria: true,
                _count: {
                    select: { inscripciones: true }
                }
            },
            orderBy: { apellido: 'asc' }
        })

        res.json(jugadores)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error obteniendo jugadores' })
    }
})

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
 * GET /jugadores/config/precios
 * Obtener precios actuales
 */
router.get('/config/precios', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const config = await prisma.configuracion.findUnique({
            where: { key: 'PRECIOS_2025' }
        })

        // Default values
        const defaultPrecios = {
            INDIVIDUAL: 10000,
            PAREJA: 8000,
            GRUPAL: 6000
        }

        res.json(config ? JSON.parse(config.value) : defaultPrecios)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error obteniendo precios' })
    }
})

/**
 * POST /jugadores/config/precios
 * Guardar precios
 */
router.post('/config/precios', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const precios = req.body // { INDIVIDUAL: x, PAREJA: y, GRUPAL: z }

        await prisma.configuracion.upsert({
            where: { key: 'PRECIOS_2025' },
            create: { key: 'PRECIOS_2025', value: JSON.stringify(precios) },
            update: { value: JSON.stringify(precios) }
        })

        res.json({ message: 'Precios actualizados' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error guardando precios' })
    }
})

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
 * GET /jugadores/deudas
 * Reporte de estado de pagos por mes
 */
router.get('/deudas', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
        const anio = parseInt(req.query.anio) || new Date().getFullYear()


        // 1. Obtener todos los jugadores activos CON sus inscripciones
        const jugadores = await prisma.jugador.findMany({
            where: { activo: true },
            include: {
                categoria: true,
                inscripciones: {
                    include: {
                        cupo: { include: { turno: true, cancha: { include: { cupos: true } } } }
                    }
                }
            },
            orderBy: { apellido: 'asc' }
        })

        // 2. Obtener pagos del mes/anio
        const pagos = await prisma.pago.findMany({
            where: {
                mes: mes,
                anio: anio
            }
        })

        // 2b. Obtener Configuración de Precios
        const configPrecio = await prisma.configuracion.findUnique({
            where: { key: 'PRECIOS_2025' }
        })
        const precios = configPrecio ? JSON.parse(configPrecio.value) : null

        // 3. Cruzar info
        const reporte = jugadores.map(j => {
            const pago = pagos.find(p => p.jugadorId === j.id)

            // Calculo de Deuda Sugerida
            let deudaSugerida = 0
            let detalleDeuda = []

            if (precios) {
                // Agrupar por modalidad (Ahora basada en turno.modalidad)
                const clases = j.inscripciones.map(i => {
                    return i.cupo.turno.modalidad || 'GRUPAL'
                })

                const counts = {}
                clases.forEach(m => counts[m] = (counts[m] || 0) + 1)

                // Calcular
                Object.keys(counts).forEach(mod => {
                    const count = counts[mod]
                    const precioBase = precios[mod] || 0
                    let total = count * precioBase
                    let descuento = 0

                    // Reglas de Descuento
                    if (count === 2) descuento = 0.10 // 10%
                    if (count >= 3) descuento = 0.15 // 15%

                    const totalConDescuento = total * (1 - descuento)
                    deudaSugerida += totalConDescuento

                    if (count > 0) {
                        detalleDeuda.push(`${count}x ${mod} ($${precioBase})${descuento > 0 ? ` -${descuento * 100}%` : ''}`)
                    }
                })
            }

            return {
                id: j.id,
                nombre: j.nombre,
                apellido: j.apellido,
                categoria: j.categoria ? `${j.categoria.nivel} ${j.categoria.tipo}` : 'Sin Categoría',
                email: j.email,
                pagado: !!pago,
                pagoInfo: pago || null,
                deudaSugerida: Math.round(deudaSugerida),
                detalleDeuda: detalleDeuda.join(', ')
            }
        })

        // 4. Ordenar: Primero los deudores
        reporte.sort((a, b) => (a.pagado === b.pagado) ? 0 : a.pagado ? 1 : -1)

        res.json({
            periodo: { mes, anio },
            totalDeudores: reporte.filter(x => !x.pagado).length,
            totalRecaudado: pagos.reduce((acc, curr) => acc + curr.monto, 0),
            jugadores: reporte
        })

    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error generando reporte' })
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

/**
 * GET /jugadores/:id/pagos
 * Obtener historial de pagos del jugador
 */
router.get('/:id/pagos', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const pagos = await prisma.pago.findMany({
            where: { jugadorId: id },
            orderBy: { fecha: 'desc' },
            include: { jugador: { select: { nombre: true, apellido: true } } }
        })

        res.json(pagos)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error obteniendo pagos' })
    }
})

/**
 * POST /jugadores/:id/pagos
 * Registrar nuevo pago
 */
router.post('/:id/pagos', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' })

        const { monto, mes, anio, metodo, nota } = req.body

        if (!monto || !mes || !anio) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (monto, mes, anio)' })
        }

        const nuevoPago = await prisma.pago.create({
            data: {
                jugadorId: id,
                monto: parseInt(monto),
                mes: parseInt(mes),
                anio: parseInt(anio),
                metodo,
                nota
            }
        })

        res.json(nuevoPago)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error registrando pago' })
    }
})

module.exports = router
