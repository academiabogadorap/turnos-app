const BASE_URL = 'http://localhost:3000';

async function checkTurnos() {
    try {
        const res = await fetch(`${BASE_URL}/turnos`);
        if (!res.ok) {
            console.error('Failed to fetch turnos:', res.status, res.statusText);
            return;
        }
        const turnos = await res.json();
        console.log('Turnos count:', turnos.length);
        if (turnos.length > 0) {
            console.log('First turno sample:', JSON.stringify(turnos[0], null, 2));
            console.log('Turno.cupos sample:', turnos[0].cupos ? turnos[0].cupos.length : 'NO CUPOS');
        } else {
            console.log('No turnos found.');
        }
    } catch (e) {
        console.error('Error fetching turnos:', e);
    }
}
checkTurnos();
