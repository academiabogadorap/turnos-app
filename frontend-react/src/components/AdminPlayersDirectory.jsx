import { useState, useEffect } from 'react'
import { Search, Users, Phone, Copy, RefreshCw, AlertCircle, Edit } from 'lucide-react'

export default function AdminPlayersDirectory({ onEdit }) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchPlayers = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/jugadores', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Error al cargar jugadores')

            const data = await res.json()
            setPlayers(data)
        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlayers()
    }, [])

    const filteredPlayers = players.filter(p => {
        const term = searchTerm.toLowerCase()
        return (
            p.nombre.toLowerCase().includes(term) ||
            p.apellido.toLowerCase().includes(term) ||
            p.codigo.toLowerCase().includes(term) ||
            (p.email && p.email.toLowerCase().includes(term))
        )
    })

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        // Podríamos mostrar un toast aquí
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-10 h-64">
            <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-xs uppercase tracking-widest animate-pulse">Cargando Directorio...</p>
        </div>
    )

    if (error) return (
        <div className="p-8 text-center">
            <div className="inline-flex p-3 bg-red-900/30 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button onClick={fetchPlayers} className="text-sm bg-slate-800 px-4 py-2 rounded hover:bg-slate-700 transition">
                Reintentar
            </button>
        </div>
    )

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-heading font-black italic text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-brand-lime" />
                        DIRECTORIO DE JUGADORES
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Gestión centralizada de alumnos. Total: <span className="text-white font-bold">{players.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:ring-2 focus:ring-brand-lime/50 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchPlayers}
                        className="p-2 bg-slate-800 hover:bg-brand-lime hover:text-brand-dark rounded-lg transition-all"
                        title="Actualizar lista"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List / Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-brand-blue/10 text-brand-highlight text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Jugador / Código</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Nivel</th>
                                <th className="px-6 py-4 text-center">Inscripciones</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredPlayers.length > 0 ? filteredPlayers.map((player) => (
                                <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-base">
                                                {player.apellido}, {player.nombre}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(player.codigo)}
                                                className="flex items-center gap-1.5 text-xs text-brand-lime/70 hover:text-brand-lime w-fit mt-1 transition-colors"
                                                title="Click para copiar código"
                                            >
                                                <code className="bg-black/30 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                                                    {player.codigo}
                                                </code>
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {player.telefono ? (
                                                <a
                                                    href={`https://wa.me/${player.telefono.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 text-white hover:text-green-400 transition-colors"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    {player.telefono}
                                                </a>
                                            ) : <span className="text-slate-600 italic">Sin teléfono</span>}

                                            {player.email && (
                                                <span className="text-xs truncate max-w-[150px]" title={player.email}>
                                                    {player.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {player.categoria ? (
                                            <span className="inline-block px-2 py-1 rounded bg-slate-800 border border-white/10 text-xs font-medium">
                                                {player.categoria.nivel} {player.categoria.genero}
                                            </span>
                                        ) : <span className="text-slate-600">-</span>}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        {player._count?.inscripciones > 0 ? (
                                            <span className="inline-flex items-center bg-brand-lime/20 text-brand-lime px-2 py-0.5 rounded-full text-xs font-bold border border-brand-lime/30">
                                                {player._count.inscripciones} Activas
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-xs">Sin turnos</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onEdit && onEdit(player)}
                                            className="text-slate-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
                                            title="Editar Jugador"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center opacity-50">
                                        <p className="font-heading italic text-lg mb-1">NO SE ENCONTRARON JUGADORES</p>
                                        <p className="text-sm">Intentá con otro término de búsqueda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
