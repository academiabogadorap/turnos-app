import { useState, useEffect } from 'react'
import {
    Users, Search, Banknote, Calendar, ChevronLeft, ChevronRight,
    Filter, Download, CheckCircle, XCircle, Settings, Save, AlertTriangle
} from 'lucide-react'
import AdminPlayerModal from './AdminPlayerModal'

export default function AdminDebtors() {
    const [mes, setMes] = useState(new Date().getMonth() + 1)
    const [anio, setAnio] = useState(new Date().getFullYear())

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modals
    const [selectedPlayer, setSelectedPlayer] = useState(null)
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

    // Config State
    const [precios, setPrecios] = useState({
        INDIVIDUAL: 10000,
        PAREJA: 8000,
        GRUPAL: 6000
    })

    const fetchReporte = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/jugadores/deudas?mes=${mes}&anio=${anio}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchPrecios = async () => {
        try {
            const res = await fetch('/jugadores/config/precios', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) setPrecios(await res.json())
        } catch (error) { console.error(error) }
    }

    useEffect(() => {
        fetchReporte()
        fetchPrecios()
    }, [mes, anio])

    const handleSavePrecios = async () => {
        try {
            const res = await fetch('/jugadores/config/precios', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(precios)
            })
            if (res.ok) {
                alert('Precios actualizados. Recalculando deudas...')
                setIsConfigModalOpen(false)
                fetchReporte()
            }
        } catch (error) { alert('Error guardando precios') }
    }

    const handlePrevMonth = () => {
        if (mes === 1) {
            setMes(12)
            setAnio(a => a - 1)
        } else {
            setMes(m => m - 1)
        }
    }

    const handleNextMonth = () => {
        if (mes === 12) {
            setMes(1)
            setAnio(a => a + 1)
        } else {
            setMes(m => m + 1)
        }
    }

    const handleCobrar = (jugador) => {
        setSelectedPlayer(jugador)
        setIsPlayerModalOpen(true)
    }

    const filteredPlayers = data?.jugadores.filter(p => {
        const full = `${p.nombre} ${p.apellido}`.toLowerCase()
        return full.includes(searchTerm.toLowerCase())
    }) || []

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Header y Control de Fecha */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Banknote className="w-6 h-6 text-emerald-500" />
                        Control de Pagos
                    </h1>
                    <p className="text-slate-400 text-sm">Gestiona cuotas y deudas mensuales</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Boton Configurar Precios */}
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                        <Settings className="w-4 h-4" /> Configurar Precios
                    </button>

                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-center min-w-[120px]">
                            <div className="text-white font-bold uppercase tracking-wide text-sm">
                                {new Date(0, mes - 1).toLocaleString('es-ES', { month: 'long' })}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{anio}</div>
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-emerald-900/50 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote className="w-16 h-16 text-emerald-500" /></div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Recaudado</h3>
                        <p className="text-3xl font-bold text-emerald-400 mt-1">
                            ${data.totalRecaudado.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-red-900/50 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-16 h-16 text-red-500" /></div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Deudores</h3>
                        <p className="text-3xl font-bold text-red-400 mt-1">
                            {data.totalDeudores} <span className="text-sm font-normal text-slate-500">/ {data.jugadores.length}</span>
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-blue-900/50 p-4 rounded-xl relative overflow-hidden flex flex-col justify-center">
                        <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full"
                                style={{ width: `${(1 - (data.totalDeudores / data.jugadores.length)) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-slate-400 font-bold">
                            <span>Progreso Cobranza</span>
                            <span>{Math.round((1 - (data.totalDeudores / data.jugadores.length)) * 100)}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra de Búsqueda */}
            <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar jugador..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                                <th className="p-4 font-bold">Jugador</th>
                                <th className="p-4 font-bold">Categoría</th>
                                <th className="p-4 font-bold">Sugerido</th>
                                <th className="p-4 font-bold text-center">Estado</th>
                                <th className="p-4 font-bold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 animate-pulse">Cargando reporte...</td>
                                </tr>
                            ) : filteredPlayers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 italic">No se encontraron jugadores</td>
                                </tr>
                            ) : (
                                filteredPlayers.map(player => (
                                    <tr key={player.id} className="group hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white max-w-[200px] truncate">{player.apellido}, {player.nombre}</div>
                                            <div className="text-xs text-slate-500">{player.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                                {player.categoria}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {player.deudaSugerida > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-blue-400">${player.deudaSugerida.toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-500 max-w-[150px] leading-tight mt-0.5">{player.detalleDeuda}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {player.pagado ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 text-xs font-bold">
                                                    <CheckCircle className="w-3.5 h-3.5" /> PAGADO
                                                    <span className="font-normal opacity-75 ml-1">${player.pagoInfo.monto.toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-900/50 text-xs font-bold">
                                                    <XCircle className="w-3.5 h-3.5" /> PENDIENTE
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {player.pagado ? (
                                                <button
                                                    onClick={() => handleCobrar(player)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                                >
                                                    Ver Detalle
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCobrar(player)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                                                >
                                                    <Banknote className="w-4 h-4" /> Cobrar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Precios */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsConfigModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-500" /> Configurar Precios
                        </h3>
                        <p className="text-xs text-slate-400">
                            Precios base por tipo de clase. Los descuentos (10% x 2, 15% x 3+) se aplican automáticamente sobre clases del <b>mismo tipo</b>.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Clase Individual (1 alumno)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-6 text-white"
                                        value={precios.INDIVIDUAL || ''} onChange={e => setPrecios({ ...precios, INDIVIDUAL: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Clase Pareja (2 alumnos)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-6 text-white"
                                        value={precios.PAREJA || ''} onChange={e => setPrecios({ ...precios, PAREJA: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Clase Grupal (3+ alumnos)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-6 text-white"
                                        value={precios.GRUPAL || ''} onChange={e => setPrecios({ ...precios, GRUPAL: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsConfigModalOpen(false)} className="flex-1 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-sm font-bold">Cancelar</button>
                            <button onClick={handleSavePrecios} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2">
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Player */}
            {selectedPlayer && (
                <AdminPlayerModal
                    isOpen={isPlayerModalOpen}
                    onClose={() => { setIsPlayerModalOpen(false); setSelectedPlayer(null); }}
                    player={selectedPlayer}
                    initialTab="pagos"
                    onSuccess={() => {
                        fetchReporte()
                    }}
                />
            )}
        </div>
    )
}
