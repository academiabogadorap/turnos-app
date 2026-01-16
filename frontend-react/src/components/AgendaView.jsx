import { useState, useEffect } from 'react'
import { Clock, MapPin, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react'

export default function AgendaView({ studentCode }) {
    const [mySlots, setMySlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchClases = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/inscripciones/mis-clases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: studentCode })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al cargar agenda')
            setMySlots(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (studentCode) fetchClases()
    }, [studentCode])

    const handleFreeSlot = async (slot) => {
        if (!confirm(`¿Liberar clase de las ${slot.horaInicio}?`)) return
        // ... Lógica de liberar (podemos pasarla como prop o duplicar fetch simple aqui)
        try {
            const res = await fetch('/inscripciones/liberar-diario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cupoId: slot.cupoId, codigo: studentCode })
            })
            if (res.ok) {
                alert('Cupo liberado')
                fetchClases()
            }
        } catch (e) { alert(e.message) }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando tu agenda...</div>

    if (error) return (
        <div className="p-4 m-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-300 flex gap-3 items-center">
            <AlertTriangle className="w-5 h-5" /> {error}
        </div>
    )

    if (mySlots.length === 0) return (
        <div className="flex flex-col items-center justify-center p-8 mt-10 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-2">
                <Calendar className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-heading font-black italic text-white">ESTÁS LIBRE</h3>
            <p className="text-slate-400 text-sm max-w-xs">
                No tenés clases agendadas próximamente. Hacé click en "Explorar" para buscar un lugar.
            </p>
        </div>
    )

    // Separar próximo turno del resto
    const [nextTurn, ...otherTurns] = mySlots

    return (
        <div className="p-4 space-y-6 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-heading font-black italic text-brand-lime">MI AGENDA</h2>
                <p className="text-slate-400 text-xs">Tus próximas clases confirmadas</p>
            </div>

            {/* Featured Next Turn */}
            <div className="bg-gradient-to-br from-brand-lime/20 to-brand-blue/40 border border-brand-lime/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(212,233,24,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Calendar className="w-32 h-32 text-brand-lime rotate-12" />
                </div>

                <span className="inline-block bg-brand-lime text-brand-dark text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-3">
                    PRÓXIMAMENTE
                </span>

                <h3 className="text-3xl font-heading font-black italic text-white mb-1">
                    {nextTurn.dia}
                </h3>
                <div className="flex items-center gap-2 text-brand-lime font-mono text-xl mb-4">
                    <Clock className="w-5 h-5" />
                    {nextTurn.horaInicio} hs
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        Cancha {nextTurn.cancha}
                    </div>
                    {nextTurn.estadoHoy === 'LIBRE' ? (
                        <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> AVISASTE
                        </span>
                    ) : (
                        <button
                            onClick={() => handleFreeSlot(nextTurn)}
                            className="bg-black/30 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/10 transition-colors"
                        >
                            Liberar Cupo
                        </button>
                    )}
                </div>
            </div>

            {/* List of Others */}
            {otherTurns.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Más adelante</h4>
                    {otherTurns.map((slot, idx) => (
                        <div key={idx} className="bg-brand-blue/20 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="text-white font-heading font-bold italic text-lg">{slot.dia}</div>
                                <div className="text-brand-lime/80 text-sm font-mono">{slot.horaInicio} hs</div>
                            </div>
                            <div className="text-slate-500 text-xs font-bold bg-black/20 px-2 py-1 rounded">
                                CANCHA {slot.cancha}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
