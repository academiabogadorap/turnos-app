const BASE_URL = 'http://localhost:3000';

async function testDeleteFlow() {
    console.log('🚀 TESTING DELETE TURNO FLOW...');

    try {
        // -------------------------
        // 1. LOGIN ADMIN
        // -------------------------
        console.log('\n🔐 Logging in as Admin...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const loginData = await loginRes.json();
        const TOKEN = loginData.token;
        console.log('✅ Logged in!');

        // -------------------------
        // 2. CREATE A TURNO (To be deleted cleanly)
        // -------------------------
        console.log('\ntodo: Creating Turno 1 (For clean delete)...');
        const turno1Res = await fetch(`${BASE_URL}/turnos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({
                dia: 'Domingo Test',
                horaInicio: '10:00',
                horaFin: '11:00',
                categoriaId: 1,
                cuposPorCancha: 4,
                canchasIds: [1]
            })
        });

        if (!turno1Res.ok) {
            const err = await turno1Res.json();
            throw new Error(`Failed to create Turno 1: ${JSON.stringify(err)}`);
        }
        const turno1 = await turno1Res.json();
        console.log(`✅ Turno 1 created (ID: ${turno1.turnoId})`);


        // -------------------------
        // 3. DELETE TURNO 1 (Normal case)
        // -------------------------
        console.log('\n🗑️  Deleting Turno 1 (Should succeed)...');
        const delete1Res = await fetch(`${BASE_URL}/turnos/${turno1.turnoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!delete1Res.ok) {
            const err = await delete1Res.json();
            throw new Error(`Failed to delete Turno 1: ${JSON.stringify(err)}`);
        }
        console.log('✅ Turno 1 deleted successfully');


        // -------------------------
        // 4. CREATE TURNO 2 (For conflict test)
        // -------------------------
        console.log('\nCreating Turno 2 (For conflict)...');
        const turno2Res = await fetch(`${BASE_URL}/turnos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({
                dia: 'Domingo Test Conflict',
                horaInicio: '12:00',
                horaFin: '13:30',
                categoriaId: 1,
                cuposPorCancha: 4,
                canchasIds: [1]
            })
        });
        const turno2 = await turno2Res.json();
        console.log(`✅ Turno 2 created (ID: ${turno2.turnoId})`);

        // -------------------------
        // 5. CREATE JUGADOR & INSCRIPTION
        // -------------------------
        console.log('Creating Jugador for inscription...');
        const jugadorRes = await fetch(`${BASE_URL}/jugadores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: 'Test', apellido: 'Deleter' })
        });
        const jugador = await jugadorRes.json();

        // Get cupos to inscribe
        const turnosListRes = await fetch(`${BASE_URL}/turnos`);
        const turnosList = await turnosListRes.json();
        const miTurno = turnosList.find(t => t.id === turno2.turnoId);
        const cupoLibre = miTurno.cupos.find(c => c.estado === 'LIBRE');

        console.log(`Inscribing jugador to Cupo ${cupoLibre.id}...`);
        await fetch(`${BASE_URL}/inscripciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jugadorId: jugador.id, cupoId: cupoLibre.id })
        });
        console.log('✅ Inscription active.');


        // -------------------------
        // 6. TRY DELETE TURNO 2 (Should Fail)
        // -------------------------
        console.log('\n🗑️  Attempting delete Turno 2 (Should FAIL)...');
        const deleteFailRes = await fetch(`${BASE_URL}/turnos/${turno2.turnoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (deleteFailRes.status === 409) {
            console.log('✅ Delete blocked correctly (409 Conflict)');
            const errBody = await deleteFailRes.json();
            console.log('   Message:', errBody.message);
        } else {
            console.error('❌ Delete should have failed with 409, but got:', deleteFailRes.status);
        }

        // -------------------------
        // 7. TRY DELETE TURNO 2 WITH FORCE (Should Succeed)
        // -------------------------
        console.log('\n🧨 Attempting delete Turno 2 WITH FORCE...');
        const deleteForceRes = await fetch(`${BASE_URL}/turnos/${turno2.turnoId}?force=true`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (deleteForceRes.ok) {
            const body = await deleteForceRes.json();
            console.log('✅ Force delete successful!');
            console.log('   Details:', body.details);
        } else {
            console.error('❌ Force delete failed:', await deleteForceRes.json());
        }

    } catch (e) {
        console.error('\n❌ FATAL ERROR IN TEST SCRIPT:', e);
    }
}

testDeleteFlow();
