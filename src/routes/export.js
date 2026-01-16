const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const authMiddleware = require('../middleware/authMiddleware')
const xlsx = require('xlsx')

/**
 * GET /export/excel
 * Descarga un archivo Excel con el reporte completo de turnos y asistencias.
 * PROTEGIDO: Solo ADMIN.
 */
router.get('/excel', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado' })
        }

        // 1. Obtener datos crudos
        const turnos = await prisma.turno.findMany({
            where: {
                activo: true
            },
            include: {
                categoria: true,
                cupos: {
                    include: {
                        cancha: true,
                        inscripcion: {
                            include: {
                                jugador: true
                            }
                        },
                        clasesSueltas: {
                            where: {
                                fecha: {
                                    gte: new Date().toISOString().split('T')[0]
                                }
                            }
                        }
                    },
                    orderBy: { cancha: { numero: 'asc' } }
                }
            },
            orderBy: [
                { dia: 'asc' }, // Ordenar días si fueran Date, pero son Strings (Lunes, Martes...). Idealmente tener un orden lógico.
                { horaInicio: 'asc' }
            ]
        })

        // 2. Aplanar datos para Excel
        const rows = []

        turnos.forEach(turno => {
            turno.cupos.forEach(cupo => {
                let jugadorNombre = '-'
                let jugadorEmail = '-'
                let tipoInscripcion = '-'
                let estado = cupo.estado

                // Prioridad 1: Inscripción Fija
                if (cupo.inscripcion) {
                    if (cupo.inscripcion.jugador) {
                        jugadorNombre = `${cupo.inscripcion.jugador.apellido}, ${cupo.inscripcion.jugador.nombre}`
                        jugadorEmail = cupo.inscripcion.jugador.email
                        tipoInscripcion = 'FIJO'
                    } else if (cupo.inscripcion.nombreInvitado) {
                        jugadorNombre = `${cupo.inscripcion.apellidoInvitado || ''}, ${cupo.inscripcion.nombreInvitado} (INVITADO)`
                        jugadorEmail = cupo.inscripcion.email || '-'
                        tipoInscripcion = 'INVITADO'
                    }
                    estado = 'OCUPADO'
                }

                // Prioridad 2: Clases Sueltas (Sobreescriben visualmente si existen para HOY, pero en Excel reportamos el fijo generalmente. 
                // Sin embargo, el pedido es "Reporte mensual/gestión".
                // Para simplificar, mostraremos el titular del cupo base, que es lo que paga la cuota.)

                rows.push({
                    Dia: turno.dia,
                    Horario: `${turno.horaInicio} - ${turno.horaFin}`,
                    Categoria: `${turno.categoria.genero} ${turno.categoria.nivel}`,
                    Cancha: `Cancha ${cupo.cancha.numero}`,
                    Estado: estado,
                    Jugador: jugadorNombre,
                    Email: jugadorEmail,
                    Tipo: tipoInscripcion
                })
            })
        })

        // 3. Generar Excel
        const wb = xlsx.utils.book_new()
        const ws = xlsx.utils.json_to_sheet(rows)

        // Ajustar ancho de columnas autocalculado (básico)
        const colWidths = [10, 15, 20, 10, 10, 30, 30, 10]
        ws['!cols'] = colWidths.map(w => ({ wch: w }))

        xlsx.utils.book_append_sheet(wb, ws, 'Inscripciones')

        // 4. Generar BUFFER y luego Base64
        // Usamos base64 para evitar problemas de corrupción de binarios en el transporte HTTP/Proxies
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
        const base64 = buffer.toString('base64')
        const fileName = `Reporte_Academia_${new Date().toISOString().split('T')[0]}.xlsx`

        res.json({
            ok: true,
            fileName: fileName,
            fileBase64: base64
        })

    } catch (error) {
        console.error('Error generando Excel:', error)
        res.status(500).json({ error: 'Error generando el reporte' })
    }
})

module.exports = router
