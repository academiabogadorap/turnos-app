require('dotenv').config();
const prisma = require('./src/prisma');

async function main() {
    await prisma.turno.update({
        where: { id: 6 },
        data: { activo: true }
    });
    console.log('Turno 6 activated');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
