
import { useState, useMemo } from 'react'
import { CheckCircle2, ChevronRight, X, Clock, Calendar } from 'lucide-react'

export default function AvailableSlotsFab({ turnos, onReservar, onVer }) {
    const [isOpen, setIsOpen] = useState(false)

    // Filtrar cupos realmente libres
    const slotsLibres = useMemo(() => {
        const libres = []
        turnos.forEach(t => {
            // Solo si el turno está activo
            if (!t.activo) return

            t.cupos.forEach(c => {
                // Chequear excepciones hoy
                const todayStr = new Date().toISOString().split('T')[0]
                const excepcionHoy = c.clasesSueltas?.find(cs => cs.fecha === todayStr)

                let estadoReal = c.estado
                if (excepcionHoy) estadoReal = excepcionHoy.estado

                if (estadoReal === 'LIBRE') {
                    libres.push({
                        turno: t,
                        cupo: c
                    })
                }
            })
        })
        return libres
    }, [turnos])

    if (slotsLibres.length === 0) return null

    return (
        <>
            {/* FAB Button */}
            <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom duration-500">
                <button
                    onClick={() => setIsOpen(true)}
                    className="
                        group flex items-center gap-3 pr-6 pl-4 py-4 rounded-full
                        bg-brand-lime text-brand-dark
                        shadow-[0_4px_20px_rgba(212,233,24,0.4)]
                        hover:bg-white hover:scale-105 hover:shadow-[0_6px_30px_rgba(212,233,24,0.6)]
                        transition-all duration-300
                    "
                >
                    <div className="relative">
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black font-heading uppercase tracking-widest opacity-80">
                            HOY
                        </span>
                        <span className="text-sm font-black font-heading italic">
                            {slotsLibres.length} LIBRES
                        </span>
                    </div>
                </button>
            </div>

            {/* Bottom Sheet / Panel */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
                    <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity" onClick={() => setIsOpen(false)} />

                    <div className="relative w-full max-w-md bg-brand-dark/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <div>
                                <h3 className="text-xl font-heading font-black italic text-brand-lime">
                                    ¡ENTRENÁ HOY!
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    Tocá para ver detalles y reservar
                                </p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List - Scrollable */}
                        <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                            {slotsLibres.map((slot, idx) => (
                                <div
                                    key={`${slot.turno.id} -${slot.cupo.id} -${idx} `}
                                    onClick={() => {
                                        setIsOpen(false)
                                        // Acción Principal: VER DETALLES (Más seguro)
                                        onVer(slot.turno)
                                    }}
                                    className="
                                        group bg-brand-blue/30 border border-white/5 p-4 rounded-xl
                                        hover:border-brand-lime/50 hover:bg-brand-blue/50 cursor-pointer
                                        transition-all duration-200 flex justify-between items-center
                                    "
                                >
                                    <div>
                                        {/* Primera Línea: Etiquetas */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="bg-brand-lime/10 text-brand-lime border border-brand-lime/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                                {slot.turno.categoria.nivel}
                                            </span>
                                            {/* GÉNERO: Info Clave */}
                                            <span className="bg-slate-700/50 text-slate-300 border border-white/10 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                                {slot.turno.categoria.genero}
                                            </span>
                                            <span className="text-slate-500 text-xs font-bold uppercase ml-1">
                                                C.{slot.cupo.canchaId}
                                            </span>
                                        </div>

                                        {/* Segunda Línea: Hora y Día */}
                                        <div className="flex items-center gap-3 text-white">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span className="font-heading font-bold italic">{slot.turno.dia}</span>
                                            <div className="h-4 w-px bg-white/10"></div>
                                            <Clock className="w-4 h-4 text-brand-lime" />
                                            <span className="font-mono text-xl tracking-tighter leading-none">{slot.turno.horaInicio}</span>
                                        </div>
                                    </div>

                                    {/* Icono de Acción */}
                                    <div className="bg-white/5 text-slate-300 group-hover:bg-brand-lime group-hover:text-brand-dark p-2 rounded-full transition-all group-hover:shadow-[0_0_15px_rgba(212,233,24,0.3)]">
                                        <ChevronRight className="w-5 h-5 stroke-[3]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
