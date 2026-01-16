import { User, Copy, LogOut, ShieldCheck } from 'lucide-react'

export default function ProfileView({ studentCode, onLogout, onAdminLogin }) {

    const copyCode = () => {
        navigator.clipboard.writeText(studentCode)
        alert('Código copiado al portapapeles')
    }

    return (
        <div className="p-4 space-y-6 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-heading font-black italic text-white">MI PERFIL</h2>
            </div>

            {/* Profile Card */}
            <div className="bg-brand-blue/30 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-gradient-to-br from-brand-lime to-green-600 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-brand-dark relative z-10">
                    <User className="w-10 h-10 text-brand-dark" />
                </div>

                <h3 className="text-xl font-heading font-black italic text-white">JUGADOR</h3>

                <div className="mt-6 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                        TU CÓDIGO DE ACCESO
                    </label>
                    <button
                        onClick={copyCode}
                        className="w-full bg-black/40 border border-brand-lime/30 rounded-xl py-4 flex items-center justify-center gap-3 group hover:bg-brand-lime/10 transition-colors"
                    >
                        <span className="font-mono text-2xl text-brand-lime tracking-[0.2em]">{studentCode}</span>
                        <Copy className="w-4 h-4 text-slate-500 group-hover:text-brand-lime" />
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                        Usá este código para validar tus asistencias.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button className="w-full p-4 bg-brand-blue/20 border border-white/5 rounded-xl flex items-center gap-4 hover:bg-brand-blue/40 transition-colors text-left group">
                    <div className="p-2 bg-brand-lime/10 rounded-lg text-brand-lime group-hover:bg-brand-lime group-hover:text-brand-dark transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-200 text-sm">Reglamento del Club</div>
                        <div className="text-xs text-slate-500">Normas de convivencia y uso</div>
                    </div>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full p-4 bg-red-900/10 border border-red-500/10 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/20 transition-colors mt-8"
                >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm font-bold uppercase tracking-wide">Cerrar Sesión</span>
                </button>
            </div>

            <div className="text-center mt-8 pb-4 flex flex-col items-center gap-3">
                <p className="text-[10px] font-mono text-slate-600">
                    ACADEMIA BOGADO APP v1.0
                </p>
                <button
                    onClick={onAdminLogin}
                    className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-brand-lime pb-0.5"
                >
                    Acceso Staff
                </button>
            </div>
        </div>
    )
}
