import { useState, useEffect } from 'react'
import { LayoutGrid, RefreshCw, AlertCircle } from 'lucide-react'

export default function AdminOccupancyMatrix({ onClose }) {
    const [matrix, setMatrix] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchMatrix = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/turnos/matrix', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Error al cargar la matriz')

            const data = await res.json()
            setMatrix(data)
        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMatrix()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-10 h-64">
            <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-xs uppercase tracking-widest animate-pulse">Calculando Ocupación...</p>
        </div>
    )

    if (error) return (
        <div className="p-8 text-center">
            <div className="inline-flex p-3 bg-red-900/30 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button onClick={fetchMatrix} className="text-sm bg-slate-800 px-4 py-2 rounded hover:bg-slate-700 transition">
                Reintentar
            </button>
        </div>
    )

    // Ordenar Días
    const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    // Obtener todos los horarios únicos para las columnas
    const allTimes = new Set()
    Object.values(matrix).forEach(diaMap => {
        Object.keys(diaMap).forEach(timeKey => {
            // timeKey es "Dia Hora" (ej: "Lunes 18:00")
            // Extraer solo la hora para columnas globales? No, mejor agrupado por Categoría.
        })
    })

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6 px-2">
                <div>
                    <h2 className="text-2xl font-heading font-black italic text-white flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-brand-lime" />
                        MAPA DE OCUPACIÓN
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md mt-1">
                        Estado en tiempo real de todos los grupos. Los números indican <span className="text-brand-lime font-bold">lugares libres</span>.
                    </p>
                </div>
                <button
                    onClick={fetchMatrix}
                    className="p-2 bg-slate-800 hover:bg-brand-lime hover:text-brand-dark rounded-lg transition-all"
                    title="Actualizar datos"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {Object.keys(matrix).sort().map(categoria => (
                    <div key={categoria} className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                        {/* Header Categoría */}
                        <div className="bg-brand-blue/20 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-heading font-bold text-lg text-brand-highlight tracking-wide">
                                {categoria}
                            </h3>
                        </div>

                        {/* Grilla de Días */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {Object.entries(matrix[categoria])
                                .sort((a, b) => {
                                    // Ordenar por Día primero, luego hora
                                    const [diaA, horaA] = a[0].split(' ')
                                    const [diaB, horaB] = b[0].split(' ')
                                    const idxA = diasOrden.indexOf(diaA)
                                    const idxB = diasOrden.indexOf(diaB)
                                    if (idxA !== idxB) return idxA - idxB
                                    return horaA.localeCompare(horaB)
                                })
                                .map(([timeKey, data]) => {
                                    const [dia, hora] = timeKey.split(' ')
                                    const porcentajeOcupacion = (data.ocupados / data.total) * 100

                                    // Determinar Color Semáforo
                                    let statusColor = 'bg-brand-lime text-brand-dark' // Mucho lugar
                                    if (data.libres === 0) statusColor = 'bg-red-500/20 text-red-500 border-red-500/30' // Lleno
                                    else if (data.libres === 1) statusColor = 'bg-amber-500 text-brand-dark animate-pulse' // Casi lleno

                                    return (
                                        <div key={timeKey} className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center relative group hover:border-brand-lime/30 transition-all">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{dia}</span>
                                            <span className="text-xl font-heading font-black italic text-white mb-2">{hora}</span>

                                            <div className={`px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider border ${statusColor === 'bg-brand-lime text-brand-dark' ? 'border-brand-lime' : ''} ${statusColor}`}>
                                                {data.libres === 0 ? 'LLENO' : `${data.libres} LIBRES`}
                                            </div>

                                            {/* Info Oculta (Hover) */}
                                            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                <span className="text-xs text-slate-400">Total: {data.total}</span>
                                                <span className="text-xs text-slate-400">Ocupados: {data.ocupados}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
