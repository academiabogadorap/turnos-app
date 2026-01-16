import React, { useRef, useEffect } from 'react'

export default function CategoryFilter({ categories, selected, onSelect, mode = 'user' }) {
    const scrollContainerRef = useRef(null)

    // Auto-scroll al elemento seleccionado solo si es usuario (para UX mobile)
    useEffect(() => {
        if (mode === 'user' && scrollContainerRef.current) {
            const activeBtn = scrollContainerRef.current.querySelector('[data-active="true"]')
            if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
        }
    }, [selected, mode])

    const isUser = mode === 'user'
    const isAdmin = mode === 'admin'

    return (
        <div className={`
            relative w-full border-b border-white/5 
            ${isUser ? 'bg-black/20 backdrop-blur-sm' : 'bg-brand-dark/30 py-4'}
        `}>
            {/* Sombras de indicación de scroll (solo User) */}
            {isUser && (
                <>
                    <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-brand-dark to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-brand-dark to-transparent z-10 pointer-events-none"></div>
                </>
            )}

            <div
                ref={scrollContainerRef}
                className={`
                    flex items-center px-4 gap-2 
                    ${isUser ? 'overflow-x-auto py-3 hide-scrollbar relative z-0' : 'flex-wrap justify-center'}
                `}
            >
                {categories.map(cat => {
                    const isActive = selected === cat
                    return (
                        <button
                            key={cat}
                            draggable="false"
                            onClick={() => onSelect(cat)}
                            data-active={isActive}
                            className={`
                                whitespace-nowrap transition-all duration-200 border select-none
                                ${isUser
                                    ? // ESTILOS MODO USUARIO (Grandes, Táctiles, Neon Bloque)
                                    `px-4 py-2 rounded-xl text-[10px] font-black font-heading uppercase tracking-widest
                                       ${isActive
                                        ? 'bg-brand-lime text-brand-dark border-brand-lime shadow-[0_0_15px_rgba(212,233,24,0.4)] scale-105 z-10'
                                        : 'bg-brand-blue/20 border-white/5 text-slate-400 hover:bg-brand-blue/40 hover:text-white'
                                    }`
                                    : // ESTILOS MODO ADMIN (Compactos, Técnicos, Neon Lineal)
                                    `px-3 py-1.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wide
                                       ${isActive
                                        ? 'bg-brand-lime/10 text-brand-lime border-brand-lime shadow-[0_0_10px_rgba(212,233,24,0.1)]'
                                        : 'bg-transparent border-white/10 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                    }`
                                }
                            `}
                        >
                            {cat}
                        </button>
                    )
                })}

                {/* Espaciador final para scroll mobile */}
                {isUser && <div className="w-4 shrink-0"></div>}
            </div>
        </div>
    )
}
