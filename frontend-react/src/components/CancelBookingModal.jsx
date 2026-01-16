import { useState } from 'react'
import { X, Trash2, AlertTriangle, ShieldAlert, KeyRound, ChevronRight } from 'lucide-react'

export default function CancelBookingModal({ isOpen, onClose, onSuccess }) {
    const [codigo, setCodigo] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (!confirm('¿Estás seguro que deseas darte de baja DEFINITIVAMENTE de este turno?')) {
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/inscripciones/cancelar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: codigo.trim() })
            })

            const data = await res.json()

            if (res.ok) {
                alert('✅ Inscripción cancelada correctamente.')
                onSuccess()
                handleClose()
            } else {
                throw new Error(data.error || 'Error al cancelar')
            }

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setCodigo('')
        setError(null)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            {/* Backdrop con Blur fuerte */}
            <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity" onClick={handleClose} />

            <div className="relative w-full max-w-md bg-brand-dark/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
                {/* Decorative Top Line (Red for Danger) */}
                <div className="h-1.5 w-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0"></div>

                <div className="relative shrink-0">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:rotate-90 transition-all z-10 bg-brand-dark/50 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="p-6 sm:p-8 pb-0">
                        <div className="flex items-start gap-4 mb-2">
                            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                <Trash2 className="text-red-500 w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-heading font-black italic text-white leading-none">
                                    CANCELAR RESERVA
                                </h3>
                                <p className="text-slate-400 text-sm mt-2">
                                    Ingresa el código de 4 dígitos para darte de baja.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 pt-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6 flex gap-3 text-red-200 text-xs font-medium">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
                        <p>Esta acción es irreversible. Perderás tu lugar en el turno de forma definitiva.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pb-2">
                        <div className="relative group">
                            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Código de Baja</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-4 w-5 h-5 text-red-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: 1234"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-lg font-mono tracking-[0.3em] placeholder:text-slate-700 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none transition-all shadow-inner"
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
                            className="group w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-heading font-black italic tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <span className="relative z-10">{loading ? 'CANCELANDO...' : 'CONFIRMAR BAJA'}</span>
                            {!loading && <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </div>
        </div >
    )
}
