const prisma = require('./src/prisma')

async function main() {
    console.log('🧹 Limpiando excepciones de Clases Sueltas...')
    const deleted = await prisma.claseSuelta.deleteMany({})
    console.log(`✅ Se eliminaron ${deleted.count} excepciones.`)
    console.log('Ahora puedes probar liberar el cupo nuevamente.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
