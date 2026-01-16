import { useState, useEffect } from 'react'
import { X, Save, Shield } from 'lucide-react'

export default function AdminPlayerModal({ isOpen, onClose, turno, cupo, onSuccess }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        categoriaId: ''
    })
    const [loading, setLoading] = useState(false)
    const [jugadorId, setJugadorId] = useState(null)
    const [categorias, setCategorias] = useState([])

    useEffect(() => {
        // Cargar Categorías
        fetch('/turnos/categorias').then(r => r.json()).then(setCategorias).catch(console.error)

        if (isOpen && cupo) {
            // Extraer datos del jugador desde el cupo (estructura variable)
            const jugador = cupo.inscripcion?.jugador || cupo.inscripcion
            if (jugador) {
                setJugadorId(jugador.id)
                setFormData({
                    nombre: jugador.nombre || cupo.inscripcion.nombreInvitado || '',
                    apellido: jugador.apellido || cupo.inscripcion.apellidoInvitado || '',
                    email: jugador.email || '',
                    categoriaId: jugador.categoriaId || ''
                })
            }
        }
    }, [isOpen, cupo])

    if (!isOpen) return null

    const handleSave = async (e) => {
        e.preventDefault()
        if (!jugadorId) {
            alert('Edición de invitados temporales no soportada aún (solo usuarios registrados).')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/jugadores/${jugadorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                alert('✅ Datos actualizados')
                onSuccess()
                onClose()
            } else {
                alert('Error al guardar')
            }
        } catch (e) {
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Editar Jugador
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400" /></button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400">Nombre</label>
                            <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Apellido</label>
                            <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Email</label>
                        <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    {/* Selector Categoría */}
                    <div>
                        <label className="text-xs text-slate-400 font-bold mb-1 block">Categoría</label>
                        <div className="relative">
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white appearance-none outline-none"
                                value={formData.categoriaId}
                                onChange={e => setFormData({ ...formData, categoriaId: e.target.value })}
                            >
                                <option value="">-- Sin Categoría --</option>
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
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2">
                        <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    )
}
