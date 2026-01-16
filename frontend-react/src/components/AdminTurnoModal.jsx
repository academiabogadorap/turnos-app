import { useState, useEffect } from 'react'
import { X, Save, Calendar, Clock, Layers } from 'lucide-react'

export default function AdminTurnoModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        dia: 'Lunes',
        horaInicio: '18:00',
        horaFin: '19:30',
        categoriaId: '',
        cuposPorCancha: 4,
        canchasIds: [] // [1, 2]
    })

    const [categorias, setCategorias] = useState([])
    const [canchas, setCanchas] = useState([])
    const [loading, setLoading] = useState(false)

    // Cargar datos referencia
    useEffect(() => {
        if (isOpen) {
            Promise.all([
                fetch('/turnos/categorias').then(r => r.json()),
                fetch('/turnos/canchas').then(r => r.json())
            ]).then(([cats, cans]) => {
                setCategorias(cats)
                setCanchas(cans)
                // Pre-seleccionar todas las canchas por defecto o ninguna
                // setFormData(prev => ({ ...prev, canchasIds: cans.map(c => c.id) }))
            }).catch(err => console.error(err))
        }
    }, [isOpen])

    const handleCanchaToggle = (id) => {
        setFormData(prev => {
            const ids = prev.canchasIds.includes(id)
                ? prev.canchasIds.filter(c => c !== id)
                : [...prev.canchasIds, id]
            return { ...prev, canchasIds: ids }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.categoriaId || formData.canchasIds.length === 0) {
            alert('Selecciona una categoría y al menos una cancha')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/turnos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                alert('✅ Turno creado con éxito')
                onSuccess()
                onClose()
            } else {
                const err = await res.json()
                alert('Error: ' + (err.error || 'Falló la creación'))
            }
        } catch (e) {
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        Nuevo Turno
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {/* Día y Hora */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-bold mb-1 block">Día</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                value={formData.dia} onChange={e => setFormData({ ...formData, dia: e.target.value })}>
                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold mb-1 block">Inicio</label>
                            <input type="time" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                value={formData.horaInicio} onChange={e => setFormData({ ...formData, horaInicio: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold mb-1 block">Fin</label>
                            <input type="time" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                value={formData.horaFin} onChange={e => setFormData({ ...formData, horaFin: e.target.value })} />
                        </div>
                    </div>

                    {/* Categoría (Optimizado Dropdown) */}
                    <div>
                        <label className="text-xs text-slate-400 font-bold mb-1 block">Categoría / Nivel</label>
                        <div className="relative">
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.categoriaId}
                                onChange={e => setFormData({ ...formData, categoriaId: e.target.value })}
                            >
                                <option value="">-- Seleccionar Categoría --</option>

                                {/* Agrupar por Género para orden visual */}
                                {[...new Set(categorias.map(c => c.genero))].sort().map(genero => (
                                    <optgroup key={genero} label={genero.toUpperCase()}>
                                        {categorias
                                            .filter(c => c.genero === genero)
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.nivel} ({cat.tipo})
                                                </option>
                                            ))
                                        }
                                    </optgroup>
                                ))}
                            </select>
                            {/* Icono flecha custom para que se vea moderno */}
                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Canchas */}
                    <div>
                        <label className="text-xs text-slate-400 font-bold mb-1 block flex justify-between">
                            Canchas Habilitadas
                            <span className="font-normal opacity-70">Selecciona las que usará el turno</span>
                        </label>
                        <div className="flex gap-3">
                            {canchas.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleCanchaToggle(c.id)}
                                    className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-lg transition-all ${formData.canchasIds.includes(c.id)
                                        ? 'bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                                        }`}
                                >
                                    {c.numero}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Creando...' : 'Crear Turno'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
