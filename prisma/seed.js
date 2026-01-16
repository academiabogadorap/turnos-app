require('dotenv').config()
const prisma = require('../src/prisma')

async function main() {
    console.log('🌱 Seedeando datos iniciales...')

    // =========================
    // CATEGORÍAS (Matriz Completa)
    // =========================
    const generos = ['Caballeros', 'Damas'] // Eliminado 'Mixto'
    const niveles = [
        '1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma',
        'Principiantes A', 'Principiantes B'
    ]
    const tipos = ['Competitivo', 'Formativo']

    console.log('🔄 Generando matriz de categorías...')
    for (const genero of generos) {
        for (const nivel of niveles) {
            for (const tipo of tipos) {
                await prisma.categoria.upsert({
                    where: {
                        genero_nivel_tipo: { genero, nivel, tipo }
                    },
                    update: {},
                    create: { genero, nivel, tipo }
                })
            }
        }
    }
    console.log('✅ Categorías creadas (Matriz completa)')

    // =========================
    // CANCHAS
    // =========================
    const canchas = [1, 2, 3, 4, 5, 6]
    for (const numero of canchas) {
        await prisma.cancha.upsert({
            where: { numero },
            update: {},
            create: { numero }
        })
    }
    console.log('✅ Canchas creadas')

    // =========================
    // ADMIN
    // =========================
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash('admin123', 10)

    await prisma.admin.upsert({
        where: { usuario: 'admin' },
        update: {
            password: passwordHash // Forzar actualización de pass por si estaba vieja
        },
        create: {
            usuario: 'admin',
            password: passwordHash,
            activo: true
        }
    })
    console.log('✅ Admin creado (user: admin / pass: admin123)')
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
