import { Calendar, Clock, User, CheckCircle2, AlertCircle, ChevronRight, Trash2, Edit2 } from 'lucide-react'

export default function TurnoCard({ turno, onReservar, onVer, isAdmin, onAdminJugador, onDelete }) {
    // Helpers
    const getCategoriaLabel = (cat) => {
        return `${cat.nivel} ${cat.genero} • ${cat.tipo}`
    }

    // Calcular Disponibilidad Real incluyendo "Paracaidistas" (Libres x Hoy)
    const todayStr = new Date().toISOString().split('T')[0]

    const cuposCalculados = turno.cupos.map(c => {
        const excepcionHoy = c.clasesSueltas?.find(cs => cs.fecha.startsWith(todayStr))
        let isActiveFree = false
        let isParacaidista = false
        let isBloqueado = false

        if (c.estado === 'LIBRE') {
            isActiveFree = true
        }

        // La excepción PISA el estado base
        if (excepcionHoy) {
            if (excepcionHoy.estado === 'LIBRE') {
                isActiveFree = true
                isParacaidista = true // Es libre HOY, pero estaba ocupado
            } else if (excepcionHoy.estado === 'TOMADO' || excepcionHoy.estado === 'BLOQUEADO') {
                isActiveFree = false
                if (excepcionHoy.estado === 'BLOQUEADO') isBloqueado = true
            }
        } else {
            // Si no hay excepción, y base es BLOQUEADO
            if (c.estado === 'BLOQUEADO') isBloqueado = true
        }

        return { ...c, isActiveFree, isParacaidista, isBloqueado, excepcionHoy }
    })

    const slotsLibres = cuposCalculados.filter(c => c.isActiveFree)
    const hayLugar = slotsLibres.length > 0

    return (
        <div className="bg-brand-blue/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden group hover:border-brand-lime/50 transition-all duration-300">

            {/* Header: Info del Turno */}
            <div className="p-4 border-b border-white/5 bg-black/20">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-heading font-black italic text-white flex items-center gap-3 drop-shadow-md">
                            <span className="bg-brand-highlight/20 border border-brand-highlight/50 p-2 rounded-xl text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                <Calendar className="w-5 h-5" />
                            </span>
                            {turno.dia}
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mt-2 ml-1">
                            <Clock className="w-4 h-4 text-brand-lime" />
                            <span className="font-mono tracking-wider">{turno.horaInicio} - {turno.horaFin} hs</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {/* Badges de Disponibilidad */}
                        {!hayLugar ? (
                            <span className="text-[10px] font-black font-heading uppercase tracking-widest text-red-400 bg-red-900/20 border border-red-500/20 px-3 py-1 rounded-full">
                                COMPLETO
                            </span>
                        ) : slotsLibres.length === 1 ? (
                            <span className="text-[10px] font-black font-heading uppercase tracking-widest text-amber-500 bg-amber-900/20 border border-amber-500/30 px-3 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                ¡ÚLTIMO LUGAR!
                            </span>
                        ) : (
                            <span className="text-[10px] font-black font-heading uppercase tracking-widest text-green-400 bg-green-900/20 border border-green-500/30 px-3 py-1 rounded-full">
                                {slotsLibres.length} LIBRES
                            </span>
                        )}

                        {/* Categoría Completa Pill */}
                        <span className="text-[10px] font-bold font-heading uppercase tracking-widest text-brand-lime bg-brand-lime/10 border border-brand-lime/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(212,233,24,0.1)]">
                            {getCategoriaLabel(turno.categoria)}
                        </span>

                        {/* Botón Borrar Turno (Admin) */}
                        {isAdmin && (
                            <button
                                onClick={() => onDelete(turno)}
                                className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                                title="Archivar Turno"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Body: Los Jugadores (Visualización Rica) */}
            <div className="p-4 space-y-3">
                {cuposCalculados.map(cupo => {
                    const { excepcionHoy, isActiveFree, isParacaidista, isBloqueado } = cupo

                    let displayJugador = cupo.inscripcion?.jugador || cupo.inscripcion
                    let displayName = displayJugador?.nombre || cupo.inscripcion?.nombreInvitado || 'Jugador'
                    let displayApellido = displayJugador?.apellido || cupo.inscripcion?.apellidoInvitado || ''

                    // Si está "TOMADO" (Paracaidista ocupando), mostrar quién lo tomó
                    if (excepcionHoy?.estado === 'TOMADO') {
                        displayName = excepcionHoy.tomadoPor?.split('(')[0] || 'Suplente'
                        displayApellido = ''
                    }

                    const iniciales = (displayName && displayName[0]) ? (displayName[0] + (displayApellido[0] || '')).toUpperCase() : '?'

                    return (
                        <div key={cupo.id} className="flex items-center justify-between group/slot">
                            {/* Slot Visual */}
                            <div className="flex items-center gap-3">
                                {isActiveFree ? (
                                    // Estado LIBRE (Regular o Paracaidista)
                                    <button
                                        onClick={() => isAdmin ? onAdminJugador(turno, cupo) : onReservar(turno, { ...cupo, esParacaidista: isParacaidista })}
                                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-lg
                                            ${isAdmin
                                                ? 'bg-slate-800 border-slate-600 text-slate-400 hover:border-blue-400 hover:text-blue-400'
                                                : isParacaidista
                                                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white hover:scale-110 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                    : 'bg-brand-lime/10 border-brand-lime/50 text-brand-lime hover:bg-brand-lime hover:text-brand-dark hover:scale-105 hover:shadow-[0_0_15px_rgba(212,233,24,0.4)]'}
                                        `}
                                        title={isAdmin ? "Administrar Cupo" : isParacaidista ? "Reserva por Hoy" : "Reservar Lugar"}
                                    >
                                        {isAdmin ? <Edit2 className="w-4 h-4" /> : <CheckCircle2 className="w-5 h-5" />}
                                    </button>
                                ) : isBloqueado ? (
                                    // Estado BLOQUEADO
                                    <button
                                        onClick={() => isAdmin && onAdminJugador(turno, cupo)}
                                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all
                                            ${isAdmin
                                                ? 'cursor-pointer bg-red-900/20 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white'
                                                : 'bg-red-900/10 border-red-500/10 text-red-800 cursor-not-allowed'}
                                        `}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                    </button>
                                ) : (
                                    // Estado OCUPADO (Regular o Suplente)
                                    <div
                                        onClick={() => isAdmin && onAdminJugador(turno, cupo)}
                                        className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold font-heading transition-all shadow-inner
                                            ${isAdmin
                                                ? 'cursor-pointer bg-brand-blue border-white/10 text-slate-300 hover:border-brand-highlight hover:text-white hover:bg-brand-highlight/20'
                                                : excepcionHoy?.estado === 'TOMADO'
                                                    ? 'bg-purple-900/40 border-purple-500/40 text-purple-300' // Estilo Suplente
                                                    : 'bg-black/30 border-white/5 text-slate-500'} // Estilo Regular
                                        `}
                                        title={excepcionHoy?.estado === 'TOMADO' ? 'Suplente por hoy' : 'Jugador Regular'}
                                    >
                                        {isAdmin ? <Edit2 className="w-4 h-4" /> : iniciales}
                                    </div>
                                )}

                                {/* Texto descriptivo */}
                                <div className="flex flex-col">
                                    {isActiveFree ? (
                                        <span
                                            onClick={() => isAdmin ? onAdminJugador(turno, cupo) : onReservar(turno, { ...cupo, esParacaidista: isParacaidista })}
                                            className={`text-sm font-bold tracking-wide cursor-pointer transition-colors
                                                ${isAdmin
                                                    ? 'text-slate-400 hover:text-white'
                                                    : isParacaidista
                                                        ? 'text-purple-400 hover:text-white hover:underline decoration-purple-400 decoration-2'
                                                        : 'text-brand-lime hover:text-white hover:underline decoration-brand-lime decoration-2'}
                                            `}
                                        >
                                            {isAdmin ? 'Cupo Libre' : isParacaidista ? 'LIBRE SOLO HOY' : 'DISPONIBLE'}
                                        </span>
                                    ) : isBloqueado ? (
                                        <span className="text-sm font-bold text-red-500/70 italic">
                                            CLAUSURADO
                                        </span>
                                    ) : (
                                        <span
                                            onClick={() => isAdmin && onAdminJugador(turno, cupo)}
                                            className={`text-sm font-medium transition-colors flex items-center gap-2
                                                ${isAdmin ? 'cursor-pointer hover:text-brand-highlight hover:underline' : 'text-slate-300'}
                                                ${excepcionHoy?.estado === 'TOMADO' ? 'text-purple-300' : ''}
                                            `}
                                        >
                                            {displayName} {displayApellido}
                                            {excepcionHoy?.estado === 'TOMADO' && (
                                                <span className="text-[9px] font-black bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wider">
                                                    SUPLENTE
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-0.5">
                                        Cancha {cupo.canchaId}
                                    </div>
                                </div>
                            </div>

                            {/* Botón Acción Individual (si es libre) */}
                            {
                                isActiveFree && (
                                    <button
                                        onClick={() => isAdmin ? onAdminJugador(turno, cupo) : onReservar(turno, { ...cupo, esParacaidista: isParacaidista })}
                                        className={`text-xs px-4 py-1.5 rounded-lg font-bold font-heading tracking-wide transition-all
                                        ${isAdmin
                                                ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300'
                                                : isParacaidista
                                                    ? 'bg-purple-600 text-white hover:bg-white hover:text-purple-600 hover:scale-105 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                                                    : 'bg-brand-lime text-brand-dark hover:bg-white hover:scale-105 shadow-[0_0_10px_rgba(212,233,24,0.2)]'}
                                    `}
                                    >
                                        {isAdmin ? 'Gestionar' : isParacaidista ? 'SOLO HOY' : 'RESERVAR'}
                                    </button>
                                )
                            }
                        </div>
                    )
                })}
            </div>

            {/* Footer: Acciones Generales */}
            <div className="p-3 bg-black/20 border-t border-white/5 flex justify-between items-center group-hover:bg-black/30 transition-colors">
                <div className="text-sm pl-2">
                    {!hayLugar && (
                        <span className="text-amber-500 text-xs font-bold font-heading uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            Lista de Espera{turno._count?.listaEspera > 0 ? `: ${turno._count.listaEspera}` : ''}
                        </span>
                    )}
                </div>

                <button
                    onClick={() => onVer(turno)}
                    className={`flex items-center gap-1 text-xs font-bold font-heading uppercase tracking-wider px-4 py-2 rounded-lg transition-all
                        ${hayLugar
                            ? 'text-brand-highlight hover:bg-brand-highlight/10 hover:text-white'
                            : 'text-amber-500 hover:bg-amber-500/10'
                        }`}
                >
                    {isAdmin
                        ? (turno._count?.listaEspera > 0 ? 'Gestión Espera' : 'Ver Detalle')
                        : (hayLugar ? 'Ver detalle' : 'ANOTARME EN ESPERA')
                    }
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
