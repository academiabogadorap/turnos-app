import { useState, useRef, useEffect } from 'react'
import { X, UserX, Ban, ArrowRightLeft, Edit, Save, Trash2, Unlock } from 'lucide-react'

export default function AdminSlotModal({ isOpen, onClose, turno, cupo, onSuccess, onEdit, movingPlayer, onStartMove, onCompleteMove }) {
    const [loading, setLoading] = useState(false)
    const isOccupied = cupo?.estado === 'OCUPADO'
    // Detectar si está bloqueado por estado permanente O por excepción de HOY
    const todayStr = new Date().toISOString().split('T')[0]
    const excepcionHoy = cupo?.clasesSueltas?.find(cs => cs.fecha.startsWith(todayStr))

    // Es bloqueado si:
    // 1. Estado base es BLOQUEADO Y no hay excepcion que lo libere
    // 2. Estado base es LIBRE/OCUPADO pero hay excepcion BLOQUEADO
    const isBlocked = (cupo?.estado === 'BLOQUEADO' && (!excepcionHoy || excepcionHoy.estado === 'BLOQUEADO')) || (excepcionHoy && excepcionHoy.estado === 'BLOQUEADO')

    // Datos del jugador si existe
    const jugador = cupo?.inscripcion?.jugador || cupo?.inscripcion
    const nombreJugador = jugador ? `${jugador.nombre} ${jugador.apellido || ''}` : 'Desconocido'

    if (!isOpen || !cupo) return null

    // --- ACCIONES ---

    // 1. Dar de Baja (Liberar Cupo)
    const handleBaja = async () => {
        if (!confirm(`¿Dar de baja a ${nombreJugador} y liberar el cupo?`)) return

        setLoading(true)
        try {
            // Usamos el endpoint de inscripciones con DELETE si existe, o update del cupo
            // Como no tengo claro si existe DELETE /inscripciones/:id, usaré la lógica de "liberar cupo"
            // Si el backend no tiene endpoint de baja directa, esto puede fallar.
            // Asumo que existe DELETE /inscripciones/:id basado en lógica común REST
            // Si no existe, tendremos que crearlo o usar un truco.

            // INTENTO A: DELETE Inscripción
            const inscripcionId = cupo.inscripcion?.id
            if (!inscripcionId) throw new Error("No hay inscripción ID")

            const res = await fetch(`/inscripciones/${inscripcionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (res.ok) {
                alert('✅ Cupo liberado exitosamente.')
                onSuccess()
                onClose()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) {
            console.error(e)
            alert('Error al procesar la baja. Verifica que el backend soporte DELETE /inscripciones/:id')
        } finally {
            setLoading(false)
        }
    }

    // 2. Bloquear Cupo (Crear Excepción)
    const handleBloquear = async () => {
        // Esto requiere crear una ClaseSuelta SOLO para la próxima fecha o bloquear el cupo permanentemente.
        // Asumiremos bloqueo permanente del cupo por ahora si es "Mantenimiento".
        // O bloqueo por fecha si es "Lluvia".
        if (!confirm('¿Bloquear este cupo indefinidamente?')) return

        setLoading(true)
        try {
            const res = await fetch(`/cupos/${cupo.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ estado: 'BLOQUEADO' })
            })

            if (res.ok) {
                onSuccess()
                onClose()
            }
        } catch (e) { alert('Error al bloquear') }
        setLoading(false)
    }

    // 3. Desbloquear (Habilitar Cupo)
    const handleDesbloquear = async () => {
        if (!confirm('¿Habilitar este cupo nuevamente?')) return

        setLoading(true)
        try {
            let res
            // Si el bloqueo es Permanente (estado del cupo), lo restauramos a LIBRE
            if (cupo.estado === 'BLOQUEADO') {
                res = await fetch(`/cupos/${cupo.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ estado: 'LIBRE' })
                })
            }
            // Si el bloqueo es solo Por Hoy (excepción), sobreescribimos con una liberación diaria
            else if (excepcionHoy && excepcionHoy.estado === 'BLOQUEADO') {
                res = await fetch('/inscripciones/liberar-diario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cupoId: cupo.id,
                        fecha: todayStr // Usamos la fecha calculada arriba
                    })
                })
            }

            if (res && res.ok) {
                onSuccess()
                onClose()
            } else {
                alert('No se pudo desbloquear. Intenta recargar.')
            }
        } catch (e) {
            console.error(e)
            alert('Error al conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-slate-900 sm:rounded-2xl rounded-t-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">

                <div className="p-4 border-b border-slate-700 bg-slate-900/95 backdrop-blur shrink-0 flex justify-between items-center z-10 sticky top-0">
                    <div>
                        <h3 className="text-white font-bold text-lg">Administrar Cupo</h3>
                        <p className="text-slate-400 text-sm">Cancha {cupo.canchaId} • {turno.dia} {turno.horaInicio}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Estado Actual</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isOccupied ? 'bg-blue-500' : isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className="text-white font-medium">
                                {isOccupied ? nombreJugador : isBlocked ? 'BLOQUEADO' : 'LIBRE'}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-2 pb-4">

                        {/* Lógica de Pegado (Mover Destino) */}
                        {!isOccupied && !isBlocked && movingPlayer && (
                            <button
                                onClick={() => onCompleteMove(turno, cupo)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-900/50 mb-2 animate-pulse"
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="w-5 h-5" />
                                    <span>MOVER AQUÍ A:</span>
                                </div>
                                <span className="text-xl uppercase">{movingPlayer.nombre}</span>
                            </button>
                        )}

                        {isOccupied && (
                            <>
                                <button onClick={handleBaja} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                                    <UserX className="w-4 h-4" /> Dar de Baja (Liberar)
                                </button>

                                {/* Botón Mover (Cortar) */}
                                <button
                                    onClick={() => onStartMove(turno, cupo)}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ArrowRightLeft className="w-4 h-4" /> Mover (Cambiar Turno)
                                </button>

                                {/* Botón Editar Activo */}
                                <button onClick={onEdit} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                                    <Edit className="w-4 h-4" /> Editar Datos Jugador
                                </button>
                            </>
                        )}

                        {!isOccupied && !isBlocked && (
                            <button onClick={handleBloquear} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 border border-slate-600">
                                <Ban className="w-4 h-4" /> Bloquear Cupo
                            </button>
                        )}

                        {isBlocked && (
                            <button onClick={handleDesbloquear} className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2 border border-green-500/20">
                                <Unlock className="w-4 h-4" /> Habilitar Cupo
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
