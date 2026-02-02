import React from 'react';
import { X, Info, Zap, Calendar, Key, RefreshCcw, CreditCard, ChevronRight } from 'lucide-react';

export default function WelcomeModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            {/* Backdrop con Blur fuerte */}
            <div
                className="absolute inset-0 bg-brand-dark/90 backdrop-blur-xl transition-opacity animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-brand-dark/95 border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-[0_0_50px_rgba(212,233,24,0.15)] overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[90vh]">

                {/* Línea Decorativa Superior (Acento Lime) */}
                <div className="h-2 w-full bg-brand-lime shadow-[0_0_20px_rgba(212,233,24,0.4)] shrink-0"></div>

                <div className="p-8 pb-0 shrink-0 bg-brand-dark/95 backdrop-blur-sm z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded bg-brand-lime/20 border border-brand-lime/30 text-brand-lime text-[10px] font-black uppercase tracking-[0.2em]">
                                    Guía Rápida
                                </span>
                            </div>
                            <h2 className="text-3xl font-heading font-black italic text-white leading-tight">
                                ¡BIENVENIDO A LA <br />
                                <span className="text-brand-lime">ACADEMIA BOGADO!</span>
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-white transition-all hover:rotate-90 bg-white/5 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Contenido con Scroll Interno */}
                <div className="p-8 pt-2 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Item 1: El Sistema */}
                    <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 border border-brand-highlight/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6 text-brand-highlight" />
                        </div>
                        <div className="space-y-1 text-left">
                            <h4 className="text-white font-bold text-lg italic uppercase font-heading">Turnos Fijos Mensuales</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Nuestra academia funciona con horarios fijos. Al anotarte, ese lugar es tuyo durante todo el mes para que entrenes con continuidad.
                            </p>
                        </div>
                    </div>

                    {/* Item 2: Los Códigos */}
                    <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-brand-lime/10 border border-brand-lime/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Key className="w-6 h-6 text-brand-lime" />
                        </div>
                        <div className="space-y-1 text-left">
                            <h4 className="text-white font-bold text-lg italic uppercase font-heading">Códigos de Control</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Al inscribirte recibirás un <span className="text-brand-lime font-bold">Código de Alumno</span> para gestionar tus faltas y un código de cancelación (válido solo por 1 hora) por si te arrepientes.
                            </p>
                        </div>
                    </div>

                    {/* Item 3: Liberar Clase */}
                    <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <RefreshCcw className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="space-y-1 text-left">
                            <h4 className="text-white font-bold text-lg italic uppercase font-heading">¿No podés venir?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Podés "Liberar" tu lugar SOLO por ese día. No perdés tu turno fijo y permitís que otro jugador use ese espacio como suplencia.
                            </p>
                        </div>
                    </div>

                    {/* Item 4: Señas */}
                    <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6 text-orange-400" />
                        </div>
                        <div className="space-y-1 text-left">
                            <h4 className="text-white font-bold text-lg italic uppercase font-heading">Reserva con Seña</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Para asegurar el compromiso, algunas reservas requieren una seña obligatoria que se abona al momento de confirmar.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer: Acción Principal */}
                <div className="p-8 pt-4 bg-brand-dark/80 backdrop-blur-md border-t border-white/5 shrink-0">
                    <button
                        onClick={onClose}
                        className="group w-full bg-brand-lime hover:bg-white text-brand-dark font-heading font-black italic tracking-widest py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(212,233,24,0.3)] hover:shadow-[0_15px_40px_rgba(212,233,24,0.5)] flex items-center justify-center gap-3 active:scale-95"
                    >
                        ENTENDIDO, EMPEZAR
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </div>
    );
}
