import { useState, useEffect } from 'react'
import { X, Save, Shield, CreditCard, User, Banknote, Calendar } from 'lucide-react'

export default function AdminPlayerModal({ isOpen, onClose, turno, cupo, player, onSuccess, initialTab = 'perfil' }) {
    const [activeTab, setActiveTab] = useState(initialTab) // 'perfil' | 'pagos'

    // Perfil State
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        categoriaId: ''
    })
    const [categorias, setCategorias] = useState([])

    // Pagos State
    const [pagos, setPagos] = useState([])
    const [nuevoPago, setNuevoPago] = useState({
        monto: '',
        metodo: 'EFECTIVO',
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        nota: ''
    })

    const [loading, setLoading] = useState(false)
    const [jugadorId, setJugadorId] = useState(null)

    useEffect(() => {
        // Cargar Categorías
        fetch('/turnos/categorias').then(r => r.json()).then(setCategorias).catch(console.error)

        if (isOpen) {
            let targetJugador = null
            setActiveTab(initialTab) // Reset tab to initial

            if (player) {
                targetJugador = player
            } else if (cupo) {
                targetJugador = cupo.inscripcion?.jugador || cupo.inscripcion
            }

            if (targetJugador) {
                setJugadorId(targetJugador.id)
                setFormData({
                    nombre: targetJugador.nombre || targetJugador.nombreInvitado || '',
                    apellido: targetJugador.apellido || targetJugador.apellidoInvitado || '',
                    email: targetJugador.email || '',
                    categoriaId: targetJugador.categoriaId || ''
                })

                // Auto-fill Monto si viene sugerido y estamos en tab pagos
                if (initialTab === 'pagos' && targetJugador.deudaSugerida && !targetJugador.pagado) {
                    setNuevoPago(prev => ({
                        ...prev,
                        monto: targetJugador.deudaSugerida,
                        nota: targetJugador.detalleDeuda ? `Pago Completo (${targetJugador.detalleDeuda})` : ''
                    }))
                }

                // Cargar pagos inicial si ya estamos en modo edición
                fetchPagos(targetJugador.id)
            }
        }
    }, [isOpen, cupo, player, initialTab])

    const fetchPagos = async (id) => {
        if (!id) return
        try {
            const res = await fetch(`/jugadores/${id}/pagos`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                const data = await res.json()
                setPagos(data)
            }
        } catch (e) {
            console.error("Error fetching pagos", e)
        }
    }

    const handleSavePerfil = async (e) => {
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

    const handleRegistrarPago = async (e) => {
        e.preventDefault()
        if (!jugadorId) return
        setLoading(true)
        try {
            const res = await fetch(`/jugadores/${jugadorId}/pagos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(nuevoPago)
            })

            if (res.ok) {
                // Refresh pagos
                await fetchPagos(jugadorId)
                setNuevoPago(prev => ({ ...prev, monto: '', nota: '' })) // Reset parcial
                alert('Pago registrado correctamente')
            } else {
                alert('Error al registrar pago')
            }
        } catch (e) {
            console.error(e)
            alert('Error al registrar pago')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        {formData.nombre} {formData.apellido}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                {/* Tabs */}
                {jugadorId && (
                    <div className="flex border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab('perfil')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'perfil' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <User className="w-4 h-4" /> Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('pagos')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'pagos' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <Banknote className="w-4 h-4" /> Pagos
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* --- TAB PERFIL --- */}
                    {activeTab === 'perfil' && (
                        <form onSubmit={handleSavePerfil} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400">Nombre</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Apellido</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Email</label>
                                <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 font-bold mb-1 block">Categoría</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white appearance-none outline-none focus:border-blue-500"
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

                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20">
                                <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    )}

                    {/* --- TAB PAGOS --- */}
                    {activeTab === 'pagos' && (
                        <div className="space-y-6">

                            {/* Formulario Nuevo Pago */}
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-900/30">
                                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Registrar Nuevo Pago
                                </h4>
                                <form onSubmit={handleRegistrarPago} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold">Monto</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-slate-500">$</span>
                                                <input type="number"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 pl-5 text-white text-sm focus:border-emerald-500 outline-none"
                                                    placeholder="0"
                                                    value={nuevoPago.monto} onChange={e => setNuevoPago({ ...nuevoPago, monto: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold">Método</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-sm focus:border-emerald-500 outline-none"
                                                value={nuevoPago.metodo} onChange={e => setNuevoPago({ ...nuevoPago, metodo: e.target.value })}
                                            >
                                                <option value="EFECTIVO">Efectivo</option>
                                                <option value="TRANSFERENCIA">Transferencia</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold">Mes</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-sm focus:border-emerald-500 outline-none"
                                                value={nuevoPago.mes} onChange={e => setNuevoPago({ ...nuevoPago, mes: e.target.value })}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' })}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold">Año</label>
                                            <input type="number"
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-sm focus:border-emerald-500 outline-none"
                                                value={nuevoPago.anio} onChange={e => setNuevoPago({ ...nuevoPago, anio: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <input type="text"
                                            placeholder="Nota opcional..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:border-emerald-500 outline-none"
                                            value={nuevoPago.nota} onChange={e => setNuevoPago({ ...nuevoPago, nota: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-900/20">
                                        {loading ? 'Registrando...' : 'Confirmar Pago'}
                                    </button>
                                </form>
                            </div>

                            {/* Historial */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Historial de Pagos</h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {pagos.length === 0 ? (
                                        <p className="text-sm text-slate-600 italic text-center py-4">Sin pagos registrados</p>
                                    ) : (
                                        pagos.map(p => (
                                            <div key={p.id} className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 flex justify-between items-center group hover:border-slate-600 transition-colors">
                                                <div>
                                                    <div className="text-sm font-bold text-emerald-400">
                                                        ${p.monto.toLocaleString()} <span className="text-xs text-slate-500 font-normal">({p.metodo})</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 flex gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(0, p.mes - 1).toLocaleString('es-ES', { month: 'short' })} {p.anio}
                                                    </div>
                                                    {p.nota && <div className="text-[10px] text-slate-500 italic mt-0.5">"{p.nota}"</div>}
                                                </div>
                                                <div className="text-xs text-slate-600 text-right">
                                                    <div>{new Date(p.fecha).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
