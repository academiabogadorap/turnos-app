import { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Calendar, Clock, Lock, ShieldAlert, Info, ChevronRight, User, Mail, Phone } from 'lucide-react'

export default function BookingModal({ isOpen, onClose, turno, cupo, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successData, setSuccessData] = useState(null)

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        email: ''
    })

    if (!isOpen || !cupo) return null

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const checkEmailTypos = (email) => {
        const typos = ['gnail.com', 'gmil.com', 'hotmal.com', 'outlok.com']
        const domain = email.split('@')[1]
        if (domain && typos.includes(domain.toLowerCase())) return true
        return false
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        // Validacion simple
        if (formData.email && checkEmailTypos(formData.email)) {
            // Usamos window.confirm por simplicidad, o podríamos usar un estado de UI
            if (!confirm(`⚠️ Tu email parece tener un error: "${formData.email}".\n¿Es correcto?`)) {
                setLoading(false)
                return
            }
        }

        try {
            const res = await fetch('/inscripciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cupoId: cupo.id,
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    telefono: formData.telefono,
                    email: formData.email,
                    origen: 'web_react'
                })
            })

            const data = await res.json()

            if (res.ok) {
                onSuccess()
                setSuccessData(data)
            } else {
                setError(data.error || 'Error al reservar')
            }

        } catch (err) {
            setError('Error de conexión con el servidor')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setSuccessData(null)
        setFormData({
            nombre: '',
            apellido: '',
            telefono: '',
            email: ''
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            {/* Backdrop con Blur fuerte para enfocar atención */}
            <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity" onClick={handleClose} />

            <div className="relative w-full max-w-md bg-brand-dark/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Decorative Top Line (Lime Accent) */}
                <div className="h-1.5 w-full bg-brand-lime shadow-[0_0_15px_rgba(212,233,24,0.5)]"></div>

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:rotate-90 transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 sm:p-8">
                    {/* ENCABEZADO: Limpio y Directo */}
                    <div className="mb-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-brand-blue/50 border border-brand-highlight/30 text-brand-highlight text-[10px] font-bold tracking-widest uppercase mb-3">
                            {turno?.categoria?.nivel} {turno?.categoria?.genero}
                        </span>
                        <h2 className="text-2xl font-heading font-black italic text-white flex items-center gap-2">
                            {cupo ? 'CONFIRMAR RESERVA' : 'TURNO COMPLETO'}
                        </h2>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1 font-medium">
                            <Calendar className="w-4 h-4 text-brand-lime" />
                            {turno?.dia}
                            <span className="w-1 h-1 bg-slate-600 rounded-full mx-1"></span>
                            <Clock className="w-4 h-4 text-brand-lime" />
                            {turno?.horaInicio} hs
                        </div>
                    </div>

                    {/* ALERT: PARACAIDISTAS */}
                    {cupo?.esParacaidista && !successData && (
                        <div className="mb-6 p-4 bg-purple-900/20 border-l-4 border-purple-500 rounded-r-lg flex gap-3 animate-pulse">
                            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-purple-300 font-bold text-sm uppercase tracking-wide">Cupo Especial: Solo Por Hoy</h4>
                                <p className="text-purple-200/70 text-xs mt-1">
                                    Estás tomando un lugar que se liberó excepcionalmente para esta fecha. No es una inscripción mensual fija.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ERROR FEEDBACK */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-400 font-bold text-sm">Error en la reserva</h4>
                                <p className="text-red-300 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* VISTA 1: ÉXITO (Reserva Confirmada) */}
                    {successData ? (
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-brand-lime/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-lime/20 shadow-[0_0_30px_rgba(212,233,24,0.2)]">
                                <CheckCircle2 className="w-10 h-10 text-brand-lime" />
                            </div>

                            <h3 className="text-2xl font-heading font-black italic text-white mb-2">¡YA ESTÁS DENTRO!</h3>
                            <p className="text-slate-400 mb-8 text-sm max-w-[80%] mx-auto">
                                Te esperamos el <span className="text-white font-bold">{turno?.dia}</span> a las <span className="text-white font-bold">{turno?.horaInicio}hs</span>.
                            </p>

                            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8 text-left relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ShieldAlert className="w-24 h-24 text-white" />
                                </div>

                                {/* 1. CODIGO DE ALUMNO (Highlight) */}
                                {successData.jugadorCodigo && (
                                    <div className="mb-6 border-b border-white/10 pb-6">
                                        <p className="text-[10px] uppercase tracking-widest text-brand-lime font-bold mb-3 flex items-center gap-2">
                                            <Info className="w-3 h-3" /> Tu Código de Alumno
                                        </p>
                                        <div className="flex items-center justify-between bg-brand-dark p-4 rounded-xl border border-brand-lime/30 shadow-[0_0_15px_rgba(212,233,24,0.1)]">
                                            <span className="text-3xl font-mono font-bold text-white tracking-widest select-all">
                                                {successData.jugadorCodigo}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-[10px] block text-brand-lime font-bold uppercase">Guardalo bien</span>
                                                <span className="text-[10px] text-slate-500">Para liberar ("Soy Alumno")</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. CODIGO DE CANCELACIÓN */}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-3 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Para Cancelar
                                    </p>
                                    <div className="flex items-center justify-between bg-brand-dark p-3 rounded-xl border border-white/5">
                                        <span className="text-xl font-mono font-bold text-slate-300 tracking-widest select-all">
                                            {successData.codigoCancelacion || "----"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 text-right max-w-[100px] leading-tight">
                                            Solo si decidís darte de baja
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full bg-brand-lime hover:bg-white hover:scale-[1.02] text-brand-dark font-heading font-black italic tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,233,24,0.3)]"
                            >
                                ENTENDIDO, ¡VAMOS!
                            </button>
                        </div>
                    ) : (
                        /* VISTA 2: FORMULARIO */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            name="nombre"
                                            required
                                            placeholder="Tu nombre"
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-lime/50 focus:border-transparent outline-none transition-all"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        required
                                        placeholder="Tu apellido"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-lime/50 focus:border-transparent outline-none transition-all"
                                        value={formData.apellido}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Email <span className="text-slate-600 font-normal">(Opcional, para recordatorios)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="ejemplo@correo.com"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-lime/50 focus:border-transparent outline-none transition-all"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">WhatsApp <span className="text-slate-600 font-normal">(Opcional)</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        name="telefono"
                                        placeholder="Para contacto rápido"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-lime/50 focus:border-transparent outline-none transition-all"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group w-full bg-brand-lime disabled:opacity-50 disabled:cursor-not-allowed text-brand-dark font-heading font-black italic tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,233,24,0.25)] hover:shadow-[0_0_30px_rgba(212,233,24,0.5)] hover:bg-white hover:scale-[1.01] flex items-center justify-center gap-2 relative overflow-hidden"
                                >
                                    <span className="relative z-10">{loading ? 'RESERVANDO...' : 'CONFIRMAR LUGAR'}</span>
                                    {!loading && <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}

                                    {/* Shine effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                                </button>
                                <p className="text-center text-[10px] text-slate-500 mt-3">
                                    Al confirmar, aceptas las normas y condiciones de la academia.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
