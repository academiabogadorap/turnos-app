require('dotenv').config();
const prisma = require('./src/prisma');

async function main() {
    const turnos = await prisma.turno.findMany({
        include: { categoria: true }
    });
    console.log('Turnos Details:', JSON.stringify(turnos, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
