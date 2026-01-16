import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, MessageCircle } from 'lucide-react'

export default function AdminWaitlistModal({ isOpen, onClose, turno, onSuccess }) {
    const [esperaList, setEsperaList] = useState([])
    const [loading, setLoading] = useState(false)

    // Cargar lista al abrir
    useEffect(() => {
        if (isOpen && turno) {
            setLoading(true)
            const token = localStorage.getItem('token')
            fetch(`/espera/turno/${turno.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Error auth')
                    return res.json()
                })
                .then(data => setEsperaList(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false))
        }
    }, [isOpen, turno])

    if (!isOpen || !turno) return null

    const handlePromover = async (item) => {
        if (!confirm(`¿Asignar cupo a ${item.nombre}?`)) return

        try {
            const res = await fetch(`/espera/${item.id}/asignar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                alert('✅ Jugador asignado al cupo!')
                onSuccess()
                onClose()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) {
            alert('Error de conexión')
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Borrar de la lista de espera?')) return

        try {
            await fetch(`/espera/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            // Recargar local
            setEsperaList(prev => prev.filter(p => p.id !== id))
            onSuccess() // Actualizar contadores afuera
        } catch (e) {
            alert('Error al borrar')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-amber-500">Gestión Lista de Espera</h3>
                    <button onClick={onClose}><X className="text-slate-400" /></button>
                </div>

                {/* Lista */}
                <div className="p-4 overflow-y-auto grow space-y-3">
                    {loading && <p className="text-slate-500 text-center animate-pulse">Cargando...</p>}

                    {!loading && esperaList.length === 0 && (
                        <p className="text-slate-500 text-center py-8">No hay nadie en espera.</p>
                    )}

                    {esperaList.map(item => (
                        <div key={item.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-white">{item.nombre} {item.apellido}</div>
                                <div className="text-xs text-slate-400 flex gap-2">
                                    <span>{item.email}</span>
                                    <span>•</span>
                                    <span>{item.telefono}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    Anotado: {new Date(item.fecha).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {/* WhatsApp */}
                                <a href={`https://wa.me/${item.telefono.replace(/\+/g, '')}`} target="_blank" rel="noreferrer"
                                    className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                </a>

                                {/* Promover (Asignar) */}
                                <button onClick={() => handlePromover(item)}
                                    className="p-2 bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors" title="Asignar al Cupo Libre">
                                    <UserPlus className="w-4 h-4" />
                                </button>

                                {/* Borrar */}
                                <button onClick={() => handleEliminar(item.id)}
                                    className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
