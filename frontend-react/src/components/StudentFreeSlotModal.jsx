import { useState, useEffect } from 'react'
import { X, UserMinus, KeyRound, AlertTriangle, Calendar, Clock, MapPin, ChevronRight, CheckCircle2, LogOut, User } from 'lucide-react'

export default function StudentFreeSlotModal({ isOpen, onClose, onSuccess }) {
    const [codigo, setCodigo] = useState('')
    const [step, setStep] = useState(1) // 1: Login, 2: Dashboard
    const [mySlots, setMySlots] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Auto-Login
    useEffect(() => {
        if (isOpen) {
            const savedCode = localStorage.getItem('studentCode')
            if (savedCode) {
                setCodigo(savedCode)
                // Auto-fetch
                fetchClases(savedCode)
            }
        } else {
            // Reset al cerrar (opcional, o mantener estado)
            if (!localStorage.getItem('studentCode')) {
                setStep(1)
                setCodigo('')
                setMySlots([])
                setError(null)
            }
        }
    }, [isOpen])

    const fetchClases = async (codeToUse) => {
        setError(null)
        setLoading(true)
        try {
            const res = await fetch('/inscripciones/mis-clases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: codeToUse.trim() })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error buscando clases')

            // Si funciona, persistir sesión
            localStorage.setItem('studentCode', codeToUse.trim())

            // Aunque no tenga clases, permitir entrar al dashboard vacio (opcional, o mostrar empty state)
            setMySlots(data)
            setStep(2)
        } catch (err) {
            setError(err.message)
            // Si falla auth, borrar token invalido
            if (res && res.status === 404) {
                localStorage.removeItem('studentCode')
                setStep(1)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLoginSubmit = (e) => {
        e.preventDefault()
        fetchClases(codigo)
    }

    const handleLogout = () => {
        localStorage.removeItem('studentCode')
        setCodigo('')
        setMySlots([])
        setStep(1)
        setError(null)
    }

    const handleFreeSlot = async (slot) => {
        if (slot.estadoHoy === 'LIBRE') return

        if (!confirm(`¿Confirmas que NO asistirás hoy a la clase de las ${slot.horaInicio}?\n\nEl cupo quedará LIBRE para otro alumno.`)) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/inscripciones/liberar-diario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cupoId: slot.cupoId,
                    codigo: codigo.trim()
                })
            })

            const data = await res.json()

            if (res.ok) {
                alert('✅ ¡Gracias por avisar! Tu cupo ha sido liberado por hoy.')
                onSuccess() // Recargar datos globales
                fetchClases(codigo) // Recargar mis datos
            } else {
                throw new Error(data.error || 'Error al liberar cupo')
            }
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            {/* Backdrop con Blur fuerte */}
            <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-brand-dark/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Decorative Top Line (Lime Accent) */}
                <div className="h-1.5 w-full bg-brand-lime shadow-[0_0_15px_rgba(212,233,24,0.5)]"></div>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-brand-blue/50 border border-brand-highlight/30 text-brand-highlight text-[10px] font-bold tracking-widest uppercase mb-2">
                                MI PORTAL
                            </span>
                            <h2 className="text-2xl font-heading font-black italic text-white flex items-center gap-2">
                                {step === 1 ? 'ACCESO ALUMNOS' : 'HOLA, CAMPEÓN'}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {step === 1 ? 'Ingresá tu código para gestionar tus clases.' : 'Aquí están tus horarios fijos.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {step === 2 && (
                                <button onClick={handleLogout} className="p-2 bg-red-900/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Cerrar sesión">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:rotate-90 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div className="relative group">
                                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Tu Código</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-4 w-5 h-5 text-brand-lime group-focus-within:text-white transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: A1B2"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-lg font-mono tracking-[0.3em] uppercase placeholder:text-slate-700 focus:ring-2 focus:ring-brand-lime/50 focus:border-brand-lime/50 outline-none transition-all shadow-inner"
                                        value={codigo}
                                        onChange={e => setCodigo(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg flex gap-3 items-center animate-in shake">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                    <p className="text-red-300 text-xs font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full bg-brand-lime text-brand-dark font-heading font-black italic tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,233,24,0.3)] hover:shadow-[0_0_30px_rgba(212,233,24,0.5)] hover:bg-white hover:scale-[1.02] flex items-center justify-center gap-2 relative overflow-hidden"
                            >
                                <span className="relative z-10">{loading ? 'VERIFICANDO...' : 'INGRESAR'}</span>
                                {!loading && <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Empty State */}
                            {mySlots.length === 0 && (
                                <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
                                    <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-300 font-bold mb-1">No tenés clases asignadas</p>
                                    <p className="text-xs text-slate-500 px-4">Si te anotaste recién, pedile al profe que te asigne tus horarios fijos.</p>
                                </div>
                            )}

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                                {mySlots.map((slot) => {
                                    const isLibreHoy = slot.estadoHoy === 'LIBRE'
                                    return (
                                        <div
                                            key={slot.inscripcionId}
                                            className={`
                                                relative p-4 rounded-2xl transition-all duration-300 border
                                                ${isLibreHoy
                                                    ? 'bg-black/20 border-white/5 opacity-60 grayscale'
                                                    : 'bg-brand-blue/30 border-white/10 hover:border-brand-lime/50 hover:bg-brand-blue/50'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-xl font-heading font-black italic text-white flex items-center gap-2">
                                                        {slot.dia}
                                                    </h4>
                                                    <div className="text-brand-lime font-mono text-sm flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {slot.horaInicio} - {slot.horaFin}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded-md text-slate-300 flex items-center gap-1 border border-white/5">
                                                    <MapPin className="w-3 h-3" /> CANCHA {slot.cancha}
                                                </div>
                                            </div>

                                            {isLibreHoy ? (
                                                <div className="w-full bg-green-500/10 text-green-400 py-3 rounded-xl text-xs font-bold text-center border border-green-500/20 flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    YA AVISASTE QUE FALTAS
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleFreeSlot(slot)}
                                                    disabled={loading}
                                                    className="group/btn w-full bg-black/40 hover:bg-red-500/20 hover:border-red-500/50 text-slate-300 hover:text-red-200 py-3 rounded-xl text-xs font-bold font-heading tracking-wide transition-all border border-white/10 flex items-center justify-center gap-2"
                                                >
                                                    {loading ? 'PROCESANDO...' : 'LIBERAR MI LUGAR POR HOY'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="pt-2 text-center">
                                <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                                    CÓDIGO ACTIVO: {codigo}
                                </span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
