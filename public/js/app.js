const API_URL = 'http://localhost:3000';
let token = localStorage.getItem('token');
let currentPlayer = JSON.parse(localStorage.getItem('player') || 'null'); // Nueva sesión alumno

// ... (existing code)

async function loginPlayer(codigo) {
    try {
        const res = await fetch(`${API_URL}/jugadores/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo })
        });

        if (res.ok) {
            currentPlayer = await res.json();
            localStorage.setItem('player', JSON.stringify(currentPlayer));
            alert(`👋 Hola, ${currentPlayer.nombre}!`);
            updateUI();
            loadTurnos();
        } else {
            const err = await res.json();
            alert(err.error || 'Código incorrecto');
        }
    } catch (e) {
        console.error(e);
        alert('Error conectando');
    }
}

// function updateUI() removed to avoid duplicate declaration. Using the main updateUI definition later in the file.

function logoutPlayer() {
    currentPlayer = null;
    localStorage.removeItem('player');
    updateUI();
    loadTurnos();
}
let inscripcionMoviendoId = null; // ID de la inscripción que se está moviendo ('Cut')


// Matadatos
let categoriasCache = [];
let canchasCache = [];

// DOM Elements
const authSection = document.getElementById('auth-section');
const loginModal = document.getElementById('login-modal');
const publicModal = document.getElementById('public-inscripcion-modal');
const adminPanel = document.getElementById('admin-panel');
const turnosList = document.getElementById('turnos-list');

// Forms
const loginForm = document.getElementById('login-form');
const createTurnoForm = document.getElementById('create-turno-form');
// Borrar Turno Admin
// Borrar Turno Admin (Ahora es Archivar Segura por defecto)
window.borrarTurnoAdmin = async (id) => {
    if (!token) return;

    // 1. Confirmación de Archivo Seguro
    if (!confirm('� ¿Archivar este turno?\n\nDesaparecerá de la vista pública pero se guardará el historial de asistencias.\n(Es la opción recomendada)')) return;

    try {
        const res = await fetch(`${API_URL}/turnos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            alert('✅ Turno Archivado.\n\n' + (data.details?.instruction || ''));
            loadTurnos();
        } else {
            // El backend ya no bloquea por ocupados en Soft Delete, pero si hubiera otro error:
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

const waitlistModal = document.getElementById('waitlist-modal');
const waitlistForm = document.getElementById('waitlist-form');
let turnoEsperaSeleccionadoId = null;

async function closeWaitlistModal() {
    waitlistModal.classList.add('hidden');
    turnoEsperaSeleccionadoId = null;
    waitlistForm.reset();
}

window.closeWaitlistModal = closeWaitlistModal;

window.abrirWaitlist = (turnoId) => {
    turnoEsperaSeleccionadoId = turnoId;
    waitlistModal.classList.remove('hidden');
    loginModal.classList.add('hidden');
    publicModal.classList.add('hidden');
    waitlistModal.scrollIntoView({ behavior: 'smooth' });
};

// Waitlist Submit
waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!turnoEsperaSeleccionadoId) return;

    const email = document.getElementById('w-email').value.trim();
    const emailConfirm = document.getElementById('w-email-confirm').value.trim();

    // Validaciones Email
    if (email !== emailConfirm) {
        alert('❌ Los emails no coinciden. Por favor verifícalos.');
        return;
    }

    if (checkEmailTypos(email)) {
        if (!confirm(`⚠️ Tu email parece tener un error de tipeo ("${email}").\n\n¿Estás seguro que es correcto?`)) {
            return;
        }
    }

    const data = {
        turnoId: turnoEsperaSeleccionadoId,
        nombre: document.getElementById('w-nombre').value,
        apellido: document.getElementById('w-apellido').value,
        telefono: document.getElementById('w-telefono').value,
        email: email
    };

    try {
        const res = await fetch(`${API_URL}/espera`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('✅ ¡Anotado en lista de espera!\nTe contactaremos si se libera un lugar.');
            closeWaitlistModal();
        } else {
            const err = await res.json();
            alert(err.error || 'Error al anotarse');
        }
    } catch (e) {
        console.error(e);
        alert('Error conectando con el servidor');
    }
});

async function borrarTurnoAdminForce(id) {
    try {
        const res = await fetch(`${API_URL}/turnos/${id}?force=true`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Turno eliminado forzosamente.');
            loadTurnos();
        } else {
            const d = await res.json();
            alert(d.error);
        }
    } catch (e) { console.error(e); }
}

// Admin: Bloquear / Desbloquear Cupo
window.toggleBloqueoCupo = async (e, id, nuevoEstado) => {
    e.stopPropagation(); // Evitar abrir modal de inscripción
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/turnos/cupos/${id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (res.ok) {
            loadTurnos();
        } else {
            alert('Error al cambiar estado.');
        }
    } catch (err) { console.error(err); }
};

// Admin: Echar Alumno (Kick)
window.liberarCupoAdmin = async (e, id) => {
    e.stopPropagation();
    if (!token) return;
    if (!confirm('⚠️ ¿Seguro que deseas dar de baja a este alumno? (Acción inmediata)')) return;

    try {
        const res = await fetch(`${API_URL}/turnos/cupos/${id}/liberar`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Alumno dado de baja. Cupo liberado.');
            loadTurnos();
        } else {
            const d = await res.json();
            alert(d.error);
        }
    } catch (err) { console.error(err); }
};
const publicForm = document.getElementById('public-form');

// Init
async function init() {
    updateUI();
    loadTurnos();
    await loadMetadata();
}

async function loadMetadata() {
    try {
        const [resCat, resCan] = await Promise.all([
            fetch(`${API_URL}/turnos/categorias`),
            fetch(`${API_URL}/turnos/canchas`)
        ]);
        categoriasCache = await resCat.json();
        canchasCache = await resCan.json();

        renderAdminForm();
        renderAdminForm();
        // renderPublicFormOptions(); - Removed to simplify UX
    } catch (e) {
        console.error('Error cargando metadatos:', e);
    }
}

function renderAdminForm() {
    // Render Canchas Checkboxes
    const canchasContainer = document.getElementById('canchas-check-container');
    if (canchasContainer && canchasCache.length) {
        canchasContainer.innerHTML = canchasCache.map(c => `
            <label style="display:inline-flex; align-items:center; gap:5px; margin-right:10px; cursor:pointer; background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:5px; font-size:0.9rem">
                <input type="checkbox" name="cancha" value="${c.id}" checked>
                Cancha ${c.numero}
            </label>
        `).join('');
    }

    if (!categoriasCache.length) return;

    // Admin: Select 1 (Genero + Nivel)
    const nivelGeneroSelect = document.getElementById('catNivelGenero');
    if (nivelGeneroSelect) {
        // Extraer únicos: "Caballeros - 6ta"
        const unicos = [];
        const map = new Map();
        categoriasCache.forEach(c => {
            const key = `${c.genero} - ${c.nivel}`;
            if (!map.has(key)) {
                map.set(key, true);
                unicos.push(key);
            }
        });

        nivelGeneroSelect.innerHTML = unicos.map(u => `<option value="${u}">${u}</option>`).join('');
    }

    // Admin: Select 2 (Tipo)
    const tipoSelect = document.getElementById('catTipo');
    if (tipoSelect) {
        // Extraer tipos únicos
        const tipos = [...new Set(categoriasCache.map(c => c.tipo))];
        tipoSelect.innerHTML = tipos.map(t => `<option value="${t}">${t}</option>`).join('');
    }
}

// function renderPublicFormOptions() - Removed (Simplified UX)

function updateUI() {
    // 1. Admin Logueado
    if (token) {
        authSection.innerHTML = `
            <span>👮‍♂️ Admin: ${currentUser?.usuario || 'Root'}</span>
            <button onclick="logout()" class="btn-outline" style="margin-left:10px">Salir</button>
        `;
        loginModal.classList.add('hidden');
        publicModal.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        return;
    }

    // 2. Jugador Logueado
    if (currentPlayer) {
        authSection.innerHTML = `
            <span style="color:#3b82f6; font-weight:bold">🎾 ${currentPlayer.nombre} ${currentPlayer.apellido}</span>
            <button onclick="logoutPlayer()" class="btn-outline" style="margin-left:10px; font-size:0.8rem">Salir</button>
        `;
        adminPanel.classList.add('hidden');
        return;
    }

    // 3. Visitante (Nadie)
    authSection.innerHTML = `
        <button onclick="abrirModalCancelar()" class="btn-outline" style="font-size:0.8rem">Cancelar (Cód)</button>
        <button onclick="toggleLoginPlayer()" class="btn-outline" style="border-color: #3b82f6; color: #3b82f6;">Soy Alumno (ID)</button>
        <button onclick="toggleLogin()" class="btn-outline">Soy Admin</button>
    `;
    adminPanel.classList.add('hidden');
}

function toggleLoginPlayer() {
    const id = prompt("🎟 Ingresa tu ID de Jugador:");
    if (id) loginPlayer(id);
}

function toggleLogin() {
    loginModal.classList.toggle('hidden');
    publicModal.classList.add('hidden');
}

function closePublicModal() {
    publicModal.classList.add('hidden');
    cupoSeleccionado = null;
    publicForm.reset();
}

async function loadTurnos() {
    try {
        // Generar fecha local YYYY-MM-DD
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        console.log("Fecha Frontend:", todayStr);

        // Invalidate cache
        const res = await fetch(`${API_URL}/turnos?t=${Date.now()}`);
        const turnos = await res.json();
        window.lastTurnos = turnos;

        if (turnos.length === 0) {
            turnosList.innerHTML = '<p class="text-muted">No hay turnos disponibles.</p>';
            return;
        }

        turnosList.innerHTML = turnos.map(t => {
            // Render cupos
            const cuposHtml = t.cupos.map(c => {
                // 1. Chequear Excepción Diaria (Cualquier estado para HOY)
                const excepcionHoy = c.clasesSueltas?.find(cs => cs.fecha === todayStr);

                // DEBUG
                if (c.clasesSueltas && c.clasesSueltas.length > 0) {
                    console.log(`Cupo ${c.id} exc:`, c.clasesSueltas.map(x => x.estado));
                }

                let estadoVisual = c.estado;
                let nombreVisual = getNombreOcupante(c);
                let esMiCupo = false;
                let esSuplenciaTomada = false;

                // LOGICA DE EXCEPCIONES
                if (excepcionHoy) {
                    if (excepcionHoy.estado === 'LIBRE') {
                        estadoVisual = 'LIBRE';
                        nombreVisual = '⚡ LIBRE x HOY';
                    } else if (excepcionHoy.estado === 'TOMADO') {
                        // AQUÍ ESTÁ LA MAGIA: Sobreescribimos la info del alumno mensual
                        estadoVisual = 'OCUPADO';
                        esSuplenciaTomada = true;

                        // Parsear nombre: "Juan (mail) - ID" -> "Juan"
                        const rawName = excepcionHoy.tomadoPor || 'Anónimo';
                        // Tomar lo que está antes del primer paréntesis o guión
                        const cleanName = rawName.split(/[(-]/)[0].trim();
                        nombreVisual = `🔄 ${cleanName}`;
                    }
                }

                // Identificar si es mío (Solo si NO está liberado ni tomado por otro suplente)
                if (!excepcionHoy && currentPlayer && c.inscripcion && c.inscripcion.jugadorId === currentPlayer.id) {
                    esMiCupo = true;
                }

                const displayText = estadoVisual === 'LIBRE' ? (excepcionHoy && excepcionHoy.estado === 'LIBRE' ? '⚡ LIBRE x HOY' : 'LIBRE') : (estadoVisual === 'BLOQUEADO' ? 'BLOQUEADO' : nombreVisual);

                // Color especial
                let specialClass = '';
                if (excepcionHoy?.estado === 'LIBRE') specialClass = 'cupo-libre-hoy';
                if (esSuplenciaTomada) specialClass = 'cupo-suplencia-tomada';

                // Admin Actions
                let adminActions = '';
                if (token) {
                    if (estadoVisual === 'LIBRE') {
                        adminActions = `<button onclick="toggleBloqueoCupo(event, ${c.id}, 'BLOQUEADO')" style="font-size:0.6rem; background:#444; color:white; border:none; padding:2px; margin-top:2px">🔒 Bloquear</button>`;
                    } else if (c.estado === 'BLOQUEADO') {
                        adminActions = `<button onclick="toggleBloqueoCupo(event, ${c.id}, 'LIBRE')" style="font-size:0.6rem; background:#22c55e; color:white; border:none; padding:2px; margin-top:2px">🔓 Habilitar</button>`;
                    } else if (estadoVisual === 'OCUPADO') {
                        if (esSuplenciaTomada) {
                            adminActions = `<small style="font-size:0.6rem; color:#a78bfa; display:block; margin-top:2px">Reemplazo del día</small>`;
                        } else if (c.inscripcion) {
                            // BOTÓN EDITAR JUGADOR (Si es SOCIO)
                            let btnEditar = '';
                            if (c.inscripcion.jugador) {
                                btnEditar = `<button onclick="abrirEditorJugador(event, ${c.inscripcion.jugador.id}, ${c.id})" style="font-size:0.6rem; background:#8b5cf6; color:white; border:none; padding:2px; margin-right:2px; cursor:pointer" title="Editar Info">✏️</button>`;
                            }

                            adminActions = `
                                <div style="display:flex; justify-content:center; gap:2px; flex-wrap:wrap; margin-top:2px">
                                    ${btnEditar}
                                    <button onclick="iniciarMovimiento(event, ${c.inscripcion.id}, '${nombreVisual}')" style="font-size:0.6rem; background:#3b82f6; color:white; border:none; padding:2px; margin-right:2px">🔄 Mover</button>
                                    <button onclick="liberarCupoAdmin(event, ${c.id})" style="font-size:0.6rem; background:#ef4444; color:white; border:none; padding:2px">🚫 Echar</button>
                                </div>
                            `;
                        }
                    }
                }
                // PLAYER ACTIONS
                else if (esMiCupo) {
                    adminActions = `<button onclick="liberarClasePorHoy(event, ${c.id})" style="font-size:0.6rem; background:#f59e0b; color:white; border:none; padding:4px 8px; margin-top:5px; border-radius:4px; font-weight:bold; cursor:pointer">⚡ Liberar x Hoy</button>`;
                }

                return `
                    <div class="cupo ${estadoVisual} ${specialClass}" onclick="handleCupoClick(${c.id}, '${estadoVisual}')" style="position:relative; ${esMiCupo ? 'border:2px solid #3b82f6' : ''}">
                        <span style="font-size:0.7em; opacity:0.7">#${c.orden}</span><br>
                        ${displayText}
                        <div style="display:flex; justify-content:center; gap:2px; flex-wrap:wrap">${adminActions}</div>
                    </div>
                `
            }).join('');

            // Calcular disponibilidad (Considerando excepciones)
            // Un cupo cuenta como libre si su estado base es LIBRE O si tiene excepción hoy
            const cuposLibresCount = t.cupos.filter(c => {
                const excepcionHoy = c.clasesSueltas?.find(cs => cs.fecha === todayStr && cs.estado === 'LIBRE');
                return c.estado === 'LIBRE' || excepcionHoy;
            }).length;

            const estaLleno = cuposLibresCount === 0;

            // Botón Lista de Espera (Si está lleno)
            let footerHtml = '';
            if (estaLleno) {
                footerHtml = `
                    <div style="margin-top:10px; text-align:center">
                        <div style="font-size:0.9rem; color:#f59e0b; margin-bottom:5px">⚠️ Turno Completo</div>
                        <button onclick="abrirWaitlist(${t.id})" class="btn-outline" style="border-color:#f59e0b; color:#f59e0b; width:100%">⏳ Anotarse en Lista de Espera</button>
                    </div>
                `;
            }

            return `
            <div class="card" style="${estaLleno ? 'border: 1px solid #f59e0b20' : ''}">
                <div class="turno-header">
                    <div>
                        <strong>${t.dia}</strong> | ${t.horaInicio} - ${t.horaFin}
                        <br>
                        <small style="color:var(--text-muted)">
                            ${t.categoria.genero} ${t.categoria.nivel} (${t.categoria.tipo})
                        </small>
                    </div>
                    ${token ? `<div style="font-size:0.8em; opacity:0.5; display:flex; gap:10px; align-items:center">
                        ID: ${t.id}
                        <button onclick="borrarTurnoAdmin(${t.id})" style="background:red; color:white; border:none; padding:2px 5px; border-radius:4px; cursor:pointer">🗑</button>
                    </div>` : ''}
                </div>
                <div class="cupos-grid">
                    ${cuposHtml}
                </div>
                ${footerHtml}
                ${(token && t._count && t._count.listaEspera > 0) ? `
                    <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px">
                        <button onclick="abrirGestionEspera(${t.id})" style="width:100%; background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; color:#f59e0b; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold">
                            ⏳ Ver Lista de Espera (${t._count.listaEspera})
                        </button>
                    </div>
                ` : ''}
            </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
        turnosList.innerHTML = '<p class="text-muted">Error cargando turnos...</p>';
    }
}

// Player: Liberar solo por hoy
window.liberarClasePorHoy = async (e, cupoId) => {
    e.stopPropagation();
    if (!currentPlayer) return;

    if (!confirm('📅 ¿Seguro que no vienes HOY?\n\nTu cupo quedará libre para que otro lo use SOLO por esta fecha.\nTu lugar mensual sigue asegurado para la próxima.')) return;

    // Generar fecha local YYYY-MM-DD (Igual que en loadTurnos)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    try {
        const res = await fetch(`${API_URL}/jugadores/liberar-clase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigoJugador: currentPlayer.codigo,
                cupoId: cupoId,
                fecha: todayStr
            })
        });

        if (res.ok) {
            alert('✅ Clase liberada. ¡Gracias por avisar!');
            loadTurnos();
        } else {
            const d = await res.json();
            alert(d.error);
        }
    } catch (err) { console.error(err); }
}

function getNombreOcupante(cupo) {
    if (cupo.estado === 'LIBRE') return '';
    if (!cupo.inscripcion) return 'Ocupado';

    // Prioridad: Invitado > Jugador Registrado
    if (cupo.inscripcion.nombreInvitado) {
        return `${cupo.inscripcion.nombreInvitado} ${cupo.inscripcion.apellidoInvitado.charAt(0)}.`;
    }
    if (cupo.inscripcion.jugador) {
        return `${cupo.inscripcion.jugador.nombre} ${cupo.inscripcion.jugador.apellido}`;
    }
    return 'Reservado';
}

// Click en un cupo
window.handleCupoClick = async (cupoId, estado) => {
    // MODO MOVER (Paste)
    if (inscripcionMoviendoId) {
        if (estado !== 'LIBRE') {
            alert('❌ Debes seleccionar un cupo LIBRE para mover al alumno.');
            return;
        }

        if (!confirm('¿Confirmar movimiento del alumno a este cupo?')) {
            inscripcionMoviendoId = null;
            document.getElementById('move-banner')?.remove();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/inscripciones/mover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    inscripcionId: inscripcionMoviendoId,
                    nuevoCupoId: cupoId
                })
            });

            if (res.ok) {
                alert('✅ Alumno reasignado con éxito.');
                inscripcionMoviendoId = null;
                document.getElementById('move-banner')?.remove();
                loadTurnos();
            } else {
                const d = await res.json();
                alert('❌ Error: ' + d.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
        return;
    }

    // MODO NORMAL (Inscripción)
    if (estado !== 'LIBRE') {
        return;
    }

    if (token) {
        // Admin click en libre (sin estar moviendo) -> Nada o menú futuro
        // alert('Funcionalidad de inscripción manual por Admin pendiente...');
    } else {
        cupoSeleccionado = cupoId;
        publicModal.classList.remove('hidden');
        loginModal.classList.add('hidden');
        publicModal.scrollIntoView({ behavior: 'smooth' });
    }
};

// Admin: Iniciar Movimiento (Cut)
window.iniciarMovimiento = (e, inscripcionId, nombre) => {
    e.stopPropagation();
    inscripcionMoviendoId = inscripcionId;

    // UI Feedback
    const banner = document.createElement('div');
    banner.id = 'move-banner';
    banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#3b82f6; color:white; padding:15px; text-align:center; z-index:9999; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.1)';
    banner.innerHTML = `
        🔄 MOVIENDO A: ${nombre} 
        <br><span style="font-weight:normal; font-size:0.9em">👉 Haz clic en un cupo LIBRE de cualquier turno para reubicarlo.</span>
        <button onclick="cancelarMovimiento()" style="margin-left:15px; background:rgba(0,0,0,0.2); border:1px solid white; color:white; padding:5px 10px; border-radius:5px; cursor:pointer">Cancelar</button>
    `;
    document.body.prepend(banner);
};

window.cancelarMovimiento = () => {
    inscripcionMoviendoId = null;
    document.getElementById('move-banner')?.remove();
};

// Reserva Pública
publicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!cupoSeleccionado) return;

    const email = document.getElementById('p-email').value.trim();
    const emailConfirm = document.getElementById('p-email-confirm').value.trim();

    // Validaciones Email
    if (email !== emailConfirm) {
        alert('❌ Los emails no coinciden. Por favor, asegúrate de escribirlo bien para recibir tu código.');
        return;
    }

    if (checkEmailTypos(email)) {
        if (!confirm(`⚠️ Posible error en el email: "${email}".\n\n¿Es correcto? (Ej: gnail, hotmal)`)) {
            return;
        }
    }

    const data = {
        cupoId: parseInt(cupoSeleccionado),
        origen: 'web_publica',
        nombre: document.getElementById('p-nombre').value,
        apellido: document.getElementById('p-apellido').value,
        telefono: document.getElementById('p-telefono').value,
        email: email
    };

    try {
        const res = await fetch(`${API_URL}/inscripciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const data = await res.json();
            const codigo = data.codigoCancelacion;
            const idJugador = data.jugadorCodigo;

            // Mostrar código importante
            let msg = `✅ ¡Inscripción Confirmada!\n\n`;

            if (data.esSuplencia) {
                msg += `⚡ REEMPLAZO POR EL DÍA (HOY) ⚡\n`;
                msg += `Has reservado este lugar solo para la fecha de hoy.\n\n`;
            } else {
                // Mensaje Mensual
                msg += `📅 INSCRIPCIÓN MENSUAL\n`;
                msg += `🎟 ID DE JUGADOR (Login): ${idJugador}\n`;
                if (data.esNuevoJugador) msg += `(Este ID es TUYO para siempre. Úsalo para gestionar tus turnos).\n\n`;
            }

            msg += `🔑 Código Reserva Actual: ${codigo}\n`;

            alert(msg);

            closePublicModal();
            loadTurnos();
        } else {
            const err = await res.json();
            alert(err.error || 'Error al inscribirse');
        }
    } catch (e) {
        console.error(e);
        alert('Error conectando con el servidor');
    }
});


// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('user').value;
    const password = document.getElementById('pass').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();

        if (res.ok) {
            token = data.token;
            currentUser = data.admin;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUI();
            loadTurnos(); // Recargar para ver info admin si la hubiera
            loadMetadata(); // Recargar metadata siendo admin
        } else {
            alert(data.error);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
});

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUI();
    loadTurnos();
}

// Crear Turno (Admin)
createTurnoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) return;

    // Obtener canchas seleccionadas
    const checkboxes = document.querySelectorAll('input[name="cancha"]:checked');
    const canchasIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (canchasIds.length === 0) {
        alert('Selecciona al menos una cancha');
        return;
    }

    // Resolver Categoria ID desde los 2 selects
    const valNivelUt = document.getElementById('catNivelGenero').value; // "Caballeros - 6ta"
    const valTipo = document.getElementById('catTipo').value; // "Competitivo"

    // Parsear el string combinado "Genero - Nivel"
    const [genero, ...nivelParts] = valNivelUt.split(' - ');
    const nivel = nivelParts.join(' - '); // Por si el nivel tenía guiones

    // Buscar en cache
    const catEncontrada = categoriasCache.find(c =>
        c.genero === genero && c.nivel === nivel && c.tipo === valTipo
    );

    if (!catEncontrada) {
        alert(`La combinación ${valNivelUt} + ${valTipo} no existe en la base de datos.`);
        return;
    }

    const data = {
        dia: document.getElementById('dia').value,
        horaInicio: document.getElementById('inicio').value,
        horaFin: document.getElementById('fin').value,
        categoriaId: catEncontrada.id,
        cuposPorCancha: parseInt(document.getElementById('cupos').value),
        canchasIds
    };

    try {
        const res = await fetch(`${API_URL}/turnos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Turno creado!');
            loadTurnos();
            // No reseteamos form completo para agilizar carga similar
        } else {
            const err = await res.json();
            alert(err.error || 'Error creando turno');
        }
    } catch (e) {
        alert('Error conectando con el servidor');
    }
});

// Cancelación Pública
window.abrirModalCancelar = () => {
    const codigo = prompt('Ingresa tu código de cancelación (4 dígitos):');
    if (!codigo) return;

    cancelarTurno(codigo);
};

async function cancelarTurno(codigo) {
    try {
        const res = await fetch(`${API_URL}/inscripciones/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo })
        });

        if (res.ok) {
            const data = await res.json();
            alert('✅ ' + data.message);
            loadTurnos();
        } else {
            const err = await res.json();
            const msg = err.instruction ? `${err.error}\n\n👉 ${err.instruction}` : err.error;
            alert('❌ No se pudo cancelar:\n' + msg);
        }
    } catch (e) {
        console.error(e);
        alert('Error conectando con el servidor');
    }
}

window.logout = logout;
window.toggleLogin = toggleLogin;
window.closePublicModal = closePublicModal;
window.loginPlayer = loginPlayer;
window.logoutPlayer = logoutPlayer;
// EDITAR JUGADOR (Admin)
const editPlayerModal = document.getElementById('edit-player-modal');

// ==========================================
// GESTIÓN LISTA DE ESPERA (ADMIN)
// ==========================================
const adminWaitlistModal = document.getElementById('admin-waitlist-modal');
const adminWaitlistContent = document.getElementById('admin-waitlist-content');

window.closeAdminWaitlistModal = () => {
    adminWaitlistModal.classList.add('hidden');
};

window.abrirGestionEspera = async (turnoId) => {
    if (!token) return;

    adminWaitlistModal.classList.remove('hidden');
    adminWaitlistModal.scrollIntoView({ behavior: 'smooth' });
    adminWaitlistContent.innerHTML = '<p>Cargando lista...</p>';

    try {
        const res = await fetch(`${API_URL}/espera/turno/${turnoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lista = await res.json();

        if (lista.length === 0) {
            adminWaitlistContent.innerHTML = '<p>No hay nadie en espera.</p>';
            return;
        }

        adminWaitlistContent.innerHTML = lista.map((item, index) => `
            <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:#f59e0b">${index + 1}. ${item.nombre} ${item.apellido}</strong><br>
                    <small>📧 ${item.email} | 📞 ${item.telefono || '-'}</small><br>
                    <small style="opacity:0.5">📅 Alta: ${new Date(item.fechaAlta).toLocaleDateString()}</small>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px; align-items:flex-end">
                    <button onclick="asignarEspera(${item.id})" class="btn-primary" style="padding:5px 10px; font-size:0.8rem; background:#10b981; border-color:#10b981">
                        ✅ Asignar a Cupo
                    </button>
                    <button onclick="eliminarEsperaAdmin(${item.id})" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem; text-decoration:underline">
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error(e);
        adminWaitlistContent.innerHTML = '<p style="color:red">Error cargando lista.</p>';
    }
};

window.asignarEspera = async (esperaId) => {
    if (!confirm('¿Confirmar asignación?\n\nEl alumno pasará a ocupar el primer cupo LIBRE del turno de forma regular.')) return;

    try {
        const res = await fetch(`${API_URL}/espera/${esperaId}/asignar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert('✅ Alumno asignado exitosamente.');
            closeAdminWaitlistModal();
            loadTurnos(); // Recargar para ver el cambio en el cupo
        } else {
            const data = await res.json();
            alert('❌ Error: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('Error conectando con el servidor');
    }
};

window.eliminarEsperaAdmin = async (id) => {
    if (!confirm('¿Eliminar de la lista de espera?')) return;
    try {
        const res = await fetch(`${API_URL}/espera/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            // Actualizar vista actual (removed element visually or reload list)
            const card = document.activeElement.closest('div[style*="background"]');
            if (card) card.remove();

            // Si era el último, reload main ui
            // loadTurnos(); -> No es estrictamente necesario, pero el count cambiará.
            // Para mantener consistencia UI, lo ideal es recargar la lista del modal o cerrar si vacía
            // Simplificación: alert y reload turnos? No, mejor UX:
            alert('Eliminado.');
            closeAdminWaitlistModal();
            loadTurnos();
        }
    } catch (e) { console.error(e); }
};
const editPlayerForm = document.getElementById('edit-player-form');

window.abrirEditorJugador = (e, jugadorId, cupoId) => {
    e.stopPropagation();

    // Buscar datos
    let jugador = null;
    let cupo = null;

    // Iterar lastTurnos para encontrar el cupo y jugador
    if (window.lastTurnos) {
        for (const t of window.lastTurnos) {
            const c = t.cupos.find(cx => cx.id === cupoId);
            if (c && c.inscripcion && c.inscripcion.jugadorId === jugadorId) {
                cupo = c;
                jugador = c.inscripcion.jugador;
                break;
            }
        }
    }

    if (!jugador) {
        alert('No se encontraron datos del jugador.');
        return;
    }

    // Llenar Modal
    document.getElementById('ep-id').value = jugador.id;
    document.getElementById('ep-nombre').value = jugador.nombre;
    document.getElementById('ep-apellido').value = jugador.apellido;
    document.getElementById('ep-email').value = jugador.email;

    // Llenar Select Categorías
    const selectCat = document.getElementById('ep-categoria');
    selectCat.innerHTML = '<option value="">Sin Categoría</option>';

    categoriasCache.forEach(cat => {
        const selected = (jugador.categoriaId === cat.id) ? 'selected' : '';
        selectCat.innerHTML += `<option value="${cat.id}" ${selected}>${cat.genero} ${cat.nivel} (${cat.tipo})</option>`;
    });

    // Mostrar
    editPlayerModal.classList.remove('hidden');
    adminPanel.classList.add('hidden'); // Ocultar panel admin para limpiar vista
};

window.closeEditPlayerModal = () => {
    editPlayerModal.classList.add('hidden');
    adminPanel.classList.remove('hidden'); // Restaurar
};

editPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) return;

    const id = document.getElementById('ep-id').value;
    const data = {
        nombre: document.getElementById('ep-nombre').value,
        apellido: document.getElementById('ep-apellido').value,
        email: document.getElementById('ep-email').value,
        categoriaId: document.getElementById('ep-categoria').value || null
    };

    try {
        const res = await fetch(`${API_URL}/jugadores/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('✅ Jugador actualizado.');
            closeEditPlayerModal();
            loadTurnos(); // Refrescar para ver cambios
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        console.error(error);
        alert('Error conectando con el servidor');
    }
});

function checkEmailTypos(email) {
    const typos = ['gnail.com', 'gmil.com', 'gmaill.com', 'hotmal.com', 'outlok.com', 'yaho.com', 'outlook.co', 'hotmail.co'];
    const domain = email.split('@')[1];

    if (!domain) return false;

    // Check exact match with known typos
    if (typos.includes(domain.toLowerCase())) return true;

    return false;
}

window.toggleLoginPlayer = toggleLoginPlayer;

init();
