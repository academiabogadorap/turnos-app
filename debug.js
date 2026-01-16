require('dotenv').config();
const prisma = require('./src/prisma');

async function debug() {
    console.log('🔍 Iniciando diagnóstico de DB...');
    try {
        // 1. Verificar conexión y Turnos
        const turno = await prisma.turno.findFirst({
            include: { cupos: { where: { estado: 'LIBRE' } } }
        });

        if (!turno) {
            console.log('❌ No hay turnos creados.');
            return;
        }

        const cupo = turno.cupos[0];
        if (!cupo) {
            console.log('❌ No hay cupos libres para probar.');
            return;
        }

        console.log(`✅ Turno encontrado (ID: ${turno.id}). Probando inscripción en Cupo ${cupo.id}...`);

        // 2. Intentar INSERT con campos nuevos
        const inscripcion = await prisma.inscripcion.create({
            data: {
                cupoId: cupo.id,
                origen: 'debug_script',
                jugadorId: null, // Probamos que acepte NULL
                nombreInvitado: 'Diagnostico', // Campo nuevo
                apellidoInvitado: 'Bot',
                telefono: '11223344',
                categoriaDeclarada: 'Avanzado'
            }
        });

        console.log('🎉 ¡ÉXITO! La base de datos aceptó los campos nuevos.');
        console.log('Registro creado:', inscripcion);

        // Limpiar
        await prisma.inscripcion.delete({ where: { id: inscripcion.id } });
        console.log('🧹 Registro de prueba eliminado.');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO DE PRISMA:');
        console.error(error.message);
        console.error('Code:', error.code);
        if (error.meta) console.error('Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
