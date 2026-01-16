import { Search, CalendarDays, User } from 'lucide-react'

export default function BottomNav({ activeTab, onChange }) {
    const tabs = [
        { id: 'explorar', label: 'Explorar', icon: Search },
        { id: 'agenda', label: 'Mis Turnos', icon: CalendarDays },
        { id: 'perfil', label: 'Perfil', icon: User },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-t border-white/10 z-50 safe-area-bottom">
            <div className="flex justify-around items-center p-2">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`
                                flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-full
                                ${isActive ? 'text-brand-lime' : 'text-slate-500 hover:text-slate-300'}
                            `}
                        >
                            <div className={`
                                p-1.5 rounded-full transition-all
                                ${isActive ? 'bg-brand-lime/10 translate-y-[-2px]' : 'bg-transparent'}
                            `}>
                                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            </div>
                            <span className={`text-[10px] font-bold font-heading uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
