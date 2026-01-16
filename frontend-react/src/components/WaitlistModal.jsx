import { useState } from 'react'
import { X, Clock, AlertTriangle, Hourglass, User, Phone, Mail } from 'lucide-react'

export default function WaitlistModal({ isOpen, onClose, turno, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        email: ''
    })

    if (!isOpen || !turno) return null

    const checkEmailTypos = (email) => {
        const typos = ['gnail.com', 'gmil.com', 'hotmal.com', 'outlok.com']
        const domain = email.split('@')[1]
        if (domain && typos.includes(domain.toLowerCase())) return true
        return false
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        // Validacion simple
        if (formData.email && checkEmailTypos(formData.email)) {
            if (!confirm(`⚠️ Tu email parece tener un error: "${formData.email}".\n¿Es correcto?`)) return
        }

        setLoading(true)

        try {
            const res = await fetch('/espera', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    turnoId: turno.id,
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    telefono: formData.telefono,
                    email: formData.email
                })
            })

            const data = await res.json()

            if (res.ok) {
                alert('⏳ ¡Listo! Estás en la Lista de Espera.\n\nTe avisaremos si se libera un lugar.')
                onSuccess()
                onClose()
            } else {
                setError(data.error || 'Error al anotarse')
            }

        } catch (err) {
            setError('Error de conexión con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            {/* Backdrop Dark & Blur */}
            <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-brand-dark/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
                {/* Decorative Top Line (Amber for Waitlist) */}
                <div className="h-1.5 w-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] shrink-0"></div>

                <div className="relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:rotate-90 transition-all z-10 bg-brand-dark/50 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="p-6 sm:p-8 pb-2">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold tracking-widest uppercase mb-2">
                                    TURNO COMPLETO
                                </span>
                                <h3 className="text-2xl font-heading font-black italic text-white flex items-center gap-2">
                                    LISTA DE ESPERA
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Si alguien cancela, te avisaremos.
                                </p>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 mt-8 sm:mt-0">
                                <Hourglass className="w-6 h-6 text-amber-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 pt-0 overflow-y-auto custom-scrollbar">
                    {/* Turno Info Card */}
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Turno solicitado</span>
                            <div className="text-white font-heading font-bold text-lg italic">
                                {turno.dia}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Horario</span>
                            <div className="text-brand-lime font-mono font-bold text-lg">
                                {turno.horaInicio} hs
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Nombre</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                    <input required type="text" placeholder="Nombre"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                        value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Apellido</label>
                                <input required type="text" placeholder="Apellido"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                    value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                <input required type="tel" placeholder="Para avisarte rápido"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                    value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                <input required type="email" placeholder="Para confirmaciones"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex gap-3 items-center">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-xs text-red-300 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="pt-2 sticky bottom-0 bg-brand-dark/95 backdrop-blur-md pb-2 -mx-4 px-4 sm:static sm:bg-transparent sm:pb-0 sm:px-0 sm:mx-0">
                            <button
                                disabled={loading}
                                type="submit"
                                className="group w-full bg-amber-500 hover:bg-amber-400 text-brand-dark font-heading font-black italic tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.01]"
                            >
                                {loading ? 'ANOTANDO...' : 'ANOTARME EN ESPERA'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
