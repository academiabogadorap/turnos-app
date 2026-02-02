require('dotenv').config();
const prisma = require('./src/prisma');

async function testFlow() {
    console.log('--- TEST: Registration Flow ---');

    const cupoId = 30; // Another free cupo in Turno 6
    const email = 'runner_' + Date.now() + '@test.com';

    try {
        // 1. Check cupo initial state
        const cupoBefore = await prisma.cupo.findUnique({ where: { id: cupoId } });
        console.log('Cupo stage 1 (Initial):', cupoBefore.estado);

        // 2. Perform registration (Simulating POST /inscripciones)
        // We'll use the logic from the route but directly in DB for testing "flow logic"
        // or just call the route if we want. Let's do a fetch if possible? 
        // Since API is running on 3000, we can use fetch.

        const response = await fetch('http://localhost:3000/inscripciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cupoId: cupoId,
                nombre: 'Flow',
                apellido: 'Tester',
                email: email,
                telefono: '11223344',
                origen: 'automated_test'
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error('Registration failed: ' + result.error);

        console.log('Registration Success:', result);
        console.log('Player Code:', result.jugadorCodigo);
        console.log('Cancel Code:', result.codigoCancelacion);

        // 3. Verify Cupo State
        const cupoAfter = await prisma.cupo.findUnique({ where: { id: cupoId } });
        console.log('Cupo stage 2 (After Reg):', cupoAfter.estado);

        // 4. Test Cancellation (Simulating POST /inscripciones/cancelar)
        console.log('Attempting cancellation...');
        const cancelRes = await fetch('http://localhost:3000/inscripciones/cancelar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: result.codigoCancelacion })
        });

        const cancelResult = await cancelRes.json();
        if (!cancelRes.ok) throw new Error('Cancellation failed: ' + cancelResult.error);

        console.log('Cancellation Success:', cancelResult.message);

        // 5. Verify Cupo State finally
        const cupoFinal = await prisma.cupo.findUnique({ where: { id: cupoId } });
        console.log('Cupo stage 3 (Final):', cupoFinal.estado);

    } catch (e) {
        console.error('❌ TEST FAILED:', e.message);
    }
}

testFlow();
