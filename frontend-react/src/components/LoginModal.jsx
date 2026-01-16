import { useState } from 'react'
import { X, Lock, KeyRound, ChevronRight, ShieldCheck, User } from 'lucide-react'

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
    const [usuario, setUsuario] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            })

            const data = await res.json()

            if (res.ok) {
                // Guardar token y rol
                localStorage.setItem('token', data.token)
                localStorage.setItem('role', 'ADMIN') // Asumimos admin si entro
                alert('✅ Bienvenido Profe!')
                onLoginSuccess(true)
                onClose()
            } else {
                setError(data.error || 'Credenciales inválidas')
            }
        } catch (err) {
            console.error('Login failed:', err)
            setError(`Error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 perspective-1000">
            {/* Backdrop Dark & Blur */}
            <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-brand-dark/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                {/* Decorative Top Line (Lime for Admin) */}
                <div className="h-1.5 w-full bg-brand-highlight shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-brand-highlight/10 rounded-full flex items-center justify-center border border-brand-highlight/30 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <ShieldCheck className="w-8 h-8 text-brand-highlight" />
                        </div>
                        <h3 className="text-2xl font-heading font-black italic text-white flex items-center gap-2">
                            PANEL DE CONTROL
                        </h3>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">
                            Solo personal autorizado
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:rotate-90 transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-brand-highlight transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-highlight/50 focus:border-brand-highlight/50 outline-none transition-all"
                                        placeholder="Tu usuario"
                                        value={usuario}
                                        onChange={e => setUsuario(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-brand-highlight transition-colors" />
                                    <input
                                        type="password"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-highlight/50 focus:border-brand-highlight/50 outline-none transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r-lg text-red-300 text-xs font-medium text-center animate-in shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full bg-brand-lime text-brand-dark font-heading font-black italic tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,233,24,0.3)] hover:shadow-[0_0_30px_rgba(212,233,24,0.5)] hover:bg-white hover:scale-[1.02] flex items-center justify-center gap-2 relative overflow-hidden"
                        >
                            <span className="relative z-10">{loading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}</span>
                            {!loading && <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
