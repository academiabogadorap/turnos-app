const BASE_URL = 'http://localhost:3000';

async function runTestParams() {
    console.log('🚀 Iniciando prueba de flujo completo...');

    try {
        // 1. Crear un Jugador
        console.log('\nCreating Jugador...');
        const jugadorRes = await fetch(`${BASE_URL}/jugadores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: 'Lionel',
                apellido: 'Messi Test'
            })
        });
        const jugador = await jugadorRes.json();
        console.log('✅ Jugador creado:', jugador);

        if (!jugador.id) throw new Error('Falló la creación del jugador');

        // 2. Crear un Turno
        console.log('\nCreating Turno...');
        const turnoRes = await fetch(`${BASE_URL}/turnos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dia: 'Sabado Test',
                horaInicio: '10:00',
                horaFin: '11:30',
                categoriaId: 1, // Asumimos que existe categoria ID 1 del seed
                cuposPorCancha: 4
            })
        });
        const turnoData = await turnoRes.json();
        console.log('✅ Turno creado:', turnoData);

        if (!turnoData.turnoId) throw new Error('Falló la creación del turno');

        // 3. Buscar el cupo para inscribirse
        // Necesitamos consultar el turno completo para ver sus cupos
        // Como el POST /turnos no devuelve los IDs de los cupos explícitamente, buscamos el turno
        // O mejor, usamos el endpoint GET /turnos para buscar el último
        const turnosListRes = await fetch(`${BASE_URL}/turnos`);
        const turnosList = await turnosListRes.json();

        // Buscamos el turno que acabamos de crear
        const miTurno = turnosList.find(t => t.id === turnoData.turnoId);
        if (!miTurno || !miTurno.cupos || miTurno.cupos.length === 0) {
            throw new Error('No se encontraron cupos para el turno creado');
        }

        const cupoLibre = miTurno.cupos.find(c => c.estado === 'LIBRE');
        console.log(`\n🔍 Cupo encontrado para inscripción: ID ${cupoLibre.id} (Cancha ${cupoLibre.canchaId})`);

        // 4. Inscribir al Jugador
        console.log('\nInscribiendo Jugador...');
        const inscripcionRes = await fetch(`${BASE_URL}/inscripciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jugadorId: jugador.id,
                cupoId: cupoLibre.id
            })
        });
        const inscripcion = await inscripcionRes.json();

        if (inscripcionRes.status !== 201) {
            console.error('Error inscripción:', inscripcion);
            throw new Error('Falló la inscripción');
        }

        console.log('✅ Inscripción exitosa:', inscripcion);

        console.log('\n🎉 ¡PRUEBA FINALIZADA CON ÉXITO!');
        console.log('El sistema funciona correctamente en tu localhost.');

    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    }
}

runTestParams();
