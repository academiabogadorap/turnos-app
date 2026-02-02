require('dotenv').config();
const prisma = require('./src/prisma');

async function main() {
    const cupos = await prisma.cupo.findMany({
        where: { turnoId: 6 },
        include: { inscripcion: true }
    });
    console.log('Cupos for Turno 6:', JSON.stringify(cupos, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
