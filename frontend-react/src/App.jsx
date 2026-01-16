import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronRight, AlertCircle, CheckCircle2, Lock, LogOut, PlusCircle, X, UserMinus, User, FileDown } from 'lucide-react'
import CategoryFilter from './components/CategoryFilter'
import AvailableSlotsFab from './components/AvailableSlotsFab'
import BookingModal from './components/BookingModal'
import WaitlistModal from './components/WaitlistModal'
import TurnoCard from './components/TurnoCard'
import StudentFreeSlotModal from './components/StudentFreeSlotModal'
import CancelBookingModal from './components/CancelBookingModal'
import LoginModal from './components/LoginModal'
import BottomNav from './components/BottomNav'
import AgendaView from './components/AgendaView'
import ProfileView from './components/ProfileView'
import AdminSlotModal from './components/AdminSlotModal'
import AdminPlayerModal from './components/AdminPlayerModal'
import AdminTurnoModal from './components/AdminTurnoModal'
import AdminWaitlistModal from './components/AdminWaitlistModal'
import logo from './assets/Logo Academia Bogado verde.png'

export default function App() {
    const [turnos, setTurnos] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [filterCategory, setFilterCategory] = useState('TODAS')

    // Auth & Navigation States
    const [studentCode, setStudentCode] = useState(null)
    const [activeTab, setActiveTab] = useState('explorar')

    // Modals
    const [bookingModalOpen, setBookingModalOpen] = useState(false)
    const [selectedTurno, setSelectedTurno] = useState(null)
    const [waitlistModalOpen, setWaitlistModalOpen] = useState(false)
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [studentModalOpen, setStudentModalOpen] = useState(false)
    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [adminSlotModalOpen, setAdminSlotModalOpen] = useState(false)
    const [adminPlayerModalOpen, setAdminPlayerModalOpen] = useState(false)
    const [adminTurnoModalOpen, setAdminTurnoModalOpen] = useState(false)
    const [adminWaitlistModalOpen, setAdminWaitlistModalOpen] = useState(false)

    // Initial Load & Auth Check
    useEffect(() => {
        fetchTurnos()

        // Recover Student Session
        const savedCode = localStorage.getItem('studentCode')
        if (savedCode) setStudentCode(savedCode)

        // Recover Admin Session
        const token = localStorage.getItem('token')
        const role = localStorage.getItem('role')
        if (token && role === 'ADMIN') {
            setIsAdmin(true)
            setActiveTab('explorar')
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('studentCode')
        setStudentCode(null)
        setActiveTab('explorar')
    }

    const fetchTurnos = async () => {
        try {
            const res = await fetch('/turnos')
            const data = await res.json()
            setTurnos(data)
        } catch (error) {
            console.error('Error fetching turnos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReservar = (turno, cupo) => {
        setSelectedTurno({ ...turno, cupoSeleccionado: cupo })
        setBookingModalOpen(true)
    }

    const handleReservarDirecto = (turno, cupo) => {
        setSelectedTurno({ ...turno, cupoSeleccionado: cupo })
        setBookingModalOpen(true)
    }

    const handleVerTurno = (turno) => {
        // Lógica isAdmin: Abrir gestión de espera o turno
        if (isAdmin) {
            setSelectedTurno(turno)
            setAdminWaitlistModalOpen(true)
            return
        }

        // Lógica de visualización: si hay lugar (Real, inc. Paracaidistas), abrir reserva.
        const todayStr = new Date().toISOString().split('T')[0]

        const primerLibre = turno.cupos.find(c => {
            const excepcionHoy = c.clasesSueltas?.find(cs => cs.fecha.startsWith(todayStr))
            // Si hay excepción LIBRE, es libre (Paracaidista)
            if (excepcionHoy?.estado === 'LIBRE') return true
            // Si hay excepción OCUPADA/BLOQUEADA, NO es libre aunque estado base sea LIBRE
            if (excepcionHoy) return false
            // Si no hay excepción, vale el estado base
            return c.estado === 'LIBRE'
        })

        if (primerLibre) {
            // Determinar si es paracaidista para pasar el flag
            const excepcionHoy = primerLibre.clasesSueltas?.find(cs => cs.fecha.startsWith(todayStr))
            const esParacaidista = excepcionHoy?.estado === 'LIBRE'

            setSelectedTurno({ ...turno, cupoSeleccionado: { ...primerLibre, esParacaidista } })
            setBookingModalOpen(true)
        } else {
            setSelectedTurno(turno)
            setWaitlistModalOpen(true)
        }
    }

    const handleAdminLogin = (status) => {
        setIsAdmin(status)
        setLoginModalOpen(false)
        if (status) setActiveTab('explorar')
    }

    const handleAdminJugador = (turno, cupo) => {
        setSelectedTurno({ ...turno, cupoSeleccionado: cupo })
        setAdminSlotModalOpen(true)
    }

    const handleAdminEditPlayer = () => {
        setAdminSlotModalOpen(false)
        setAdminPlayerModalOpen(true)
    }

    const handleAdminDelete = async (turno) => {
        if (!confirm('¿Eliminar turno?')) return
        const token = localStorage.getItem('token')

        try {
            const res = await fetch(`/turnos/${turno.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.status === 401 || res.status === 403) {
                alert('Sesión expirada o no autorizada.')
                setIsAdmin(false)
                return
            }

            if (!res.ok) throw new Error('Error al eliminar turno')

            fetchTurnos()
        } catch (e) { alert(e.message) }
    }

    const handleExportExcel = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('/export/excel', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.status === 401 || res.status === 403) {
                alert('Sesión expirada')
                setIsAdmin(false)
                return
            }

            if (!res.ok) throw new Error('Error al generar reporte')

            const data = await res.json()
            if (!data.ok || !data.fileBase64) throw new Error('Formato de respuesta inválido')

            // Convertir Base64 a Blob
            const binaryString = window.atob(data.fileBase64)
            const len = binaryString.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            const newBlob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(newBlob)

            const a = document.createElement('a')
            a.href = url
            a.download = data.fileName || `Reporte_Academia_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (e) {
            console.error(e)
            alert('Error descargando el Excel. Intente nuevamente.')
        }
    }

    // Filtrado
    const filteredTurnos = filterCategory === 'TODAS'
        ? turnos
        : turnos.filter(t =>
            t.categoria.nivel === filterCategory || t.categoria.genero === filterCategory
            || (t.categoria.nivel + ' ' + t.categoria.genero).includes(filterCategory)
        )

    // Helper para extraer categorias unicos
    const categories = ['TODAS', ...new Set(turnos.map(t => t.categoria.nivel))]

    return (
        <div className={`min-h-screen bg-brand-dark text-slate-200 font-sans selection:bg-brand-lime selection:text-brand-dark pb-20`}>

            {/* --- HEADER --- */}
            {/* Mostrar Header completo SOLO en modo Explorar, Visitante O ADMIN */}
            {(activeTab === 'explorar' || !studentCode || isAdmin) && (
                <header className="sticky top-0 z-30 bg-brand-dark/90 backdrop-blur-md border-b border-white/5 shadow-2xl transition-all">
                    <div className="p-4 flex justify-between items-center max-w-2xl mx-auto w-full">
                        <div className="flex flex-col select-none cursor-default" onDoubleClick={() => setLoginModalOpen(true)}>
                            {isAdmin ? (
                                <h1 className="text-xl font-heading font-black italic text-brand-lime tracking-tighter drop-shadow-lg">
                                    PANEL ADMIN
                                </h1>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <img
                                        src={logo}
                                        alt="Logo Academia Bogado"
                                        className="h-12 w-auto drop-shadow-[0_0_15px_rgba(212,233,24,0.15)] transition-transform hover:scale-105 duration-500"
                                    />
                                    <div className="flex flex-col items-start justify-center">
                                        <span className="text-[10px] font-heading font-bold text-brand-lime tracking-[0.35em] uppercase opacity-90 leading-tight ml-0.5">
                                            ACADEMIA
                                        </span>
                                        <h1 className="text-3xl font-heading font-black italic text-white tracking-tighter leading-none drop-shadow-2xl">
                                            BOGADO
                                        </h1>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {!isAdmin && !studentCode && (
                                <button
                                    onClick={() => setStudentModalOpen(true)}
                                    className="bg-brand-blue/30 hover:bg-brand-blue/50 text-brand-highlight border border-brand-highlight/30 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                                >
                                    <User className="w-3 h-3" />
                                    Soy Alumno
                                </button>
                            )}

                            {!isAdmin && (
                                <button
                                    onClick={() => setCancelModalOpen(true)}
                                    className="bg-black/20 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                                >
                                    Cancelar
                                </button>
                            )}

                            {!isAdmin && (
                                <button
                                    onClick={() => setLoginModalOpen(true)}
                                    className="p-2 text-slate-600 hover:text-brand-lime transition-colors"
                                    title="Acceso Admin"
                                >
                                    <Lock className="w-4 h-4" />
                                </button>
                            )}

                            {isAdmin && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setAdminTurnoModalOpen(true)}
                                        className="bg-brand-highlight hover:bg-blue-400 text-white font-heading font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span className="hidden sm:inline">Crear Turno</span>
                                    </button>

                                    <button
                                        onClick={handleExportExcel}
                                        className="bg-brand-lime hover:bg-white text-brand-dark font-heading font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded shadow-[0_0_15px_rgba(212,233,24,0.3)] hover:shadow-[0_0_20px_rgba(212,233,24,0.5)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                                        title="Descargar Reporte Completo"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        <span className="hidden sm:inline">Exportar</span>
                                    </button>

                                    <button
                                        onClick={() => setIsAdmin(false)}
                                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                                    >
                                        Salir
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filters (Solo en Explorar) */}
                    <div className="pb-2">
                        <CategoryFilter
                            categories={categories}
                            selected={filterCategory}
                            onSelect={setFilterCategory}
                            mode={isAdmin ? "admin" : "user"}
                        />
                    </div>
                </header>
            )}

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-2xl mx-auto w-full min-h-[80vh]">

                {/* VISTA 1: EXPLORAR (GRID) */}
                {(activeTab === 'explorar' || isAdmin) && (
                    <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="w-10 h-10 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-500 font-heading animate-pulse">CARGANDO TURNOS...</p>
                            </div>
                        ) : (
                            <>
                                {filteredTurnos.map(turno => (
                                    <TurnoCard
                                        key={turno.id}
                                        turno={turno}
                                        isAdmin={isAdmin}
                                        onReservar={handleReservar}
                                        onVer={handleVerTurno}
                                        onAdminJugador={handleAdminJugador}
                                        onDelete={handleAdminDelete}
                                    />
                                ))}

                                {filteredTurnos.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <p className="font-heading italic text-xl">NO HAY TURNOS</p>
                                        <p className="text-sm">Probá cambiando los filtros.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* VISTA 2: AGENDA */}
                {activeTab === 'agenda' && studentCode && (
                    <AgendaView studentCode={studentCode} />
                )}

                {/* VISTA 3: PERFIL */}
                {activeTab === 'perfil' && studentCode && (
                    <ProfileView
                        studentCode={studentCode}
                        onLogout={handleLogout}
                        onAdminLogin={() => setLoginModalOpen(true)}
                    />
                )}

            </main>

            {/* --- BOTTOM NAV (Solo Si Logueado y NO es Admin) --- */}
            {studentCode && !isAdmin && (
                <BottomNav activeTab={activeTab} onChange={setActiveTab} />
            )}

            {/* --- MODALS --- */}
            <BookingModal
                isOpen={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
                turno={selectedTurno}
                cupo={selectedTurno?.cupoSeleccionado}
                onSuccess={() => {
                    fetchTurnos()
                    setActiveTab('explorar')
                }}
            />

            <WaitlistModal
                isOpen={waitlistModalOpen}
                onClose={() => setWaitlistModalOpen(false)}
                turno={selectedTurno}
            />

            <CancelBookingModal
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onSuccess={fetchTurnos}
            />

            <LoginModal
                isOpen={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                onLoginSuccess={handleAdminLogin}
            />

            <StudentFreeSlotModal
                isOpen={studentModalOpen}
                onClose={() => setStudentModalOpen(false)}
                turnos={turnos}
                onSuccess={() => {
                    fetchTurnos()
                    // Si login exitoso, setear local y redirect
                    const code = localStorage.getItem('studentCode')
                    if (code) {
                        setStudentCode(code)
                        setActiveTab('agenda')
                    }
                }}
            />

            <AdminSlotModal
                isOpen={adminSlotModalOpen}
                onClose={() => setAdminSlotModalOpen(false)}
                turno={selectedTurno}
                cupo={selectedTurno?.cupoSeleccionado}
                onSuccess={fetchTurnos}
                onEdit={handleAdminEditPlayer}
            />

            <AdminPlayerModal
                isOpen={adminPlayerModalOpen}
                onClose={() => setAdminPlayerModalOpen(false)}
                turno={selectedTurno}
                cupo={selectedTurno?.cupoSeleccionado}
                onSuccess={fetchTurnos}
            />

            <AdminTurnoModal
                isOpen={adminTurnoModalOpen}
                onClose={() => setAdminTurnoModalOpen(false)}
                onSuccess={fetchTurnos}
            />

            <AdminWaitlistModal
                isOpen={adminWaitlistModalOpen}
                onClose={() => setAdminWaitlistModalOpen(false)}
                turno={selectedTurno}
                onSuccess={fetchTurnos}
            />

            {/* Quick Access Fab (Solo Usuarios en Explorar) */}
            {!loading && !isAdmin && activeTab === 'explorar' && (
                <AvailableSlotsFab
                    turnos={turnos}
                    onVer={handleVerTurno}
                    onReservar={handleReservarDirecto}
                />
            )}
        </div>
    )
}
