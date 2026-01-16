require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const turnosRoutes = require('./src/routes/turnos')
const jugadoresRoutes = require('./src/routes/jugadores')
const inscripcionesRoutes = require('./src/routes/inscripciones')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/health', (req, res) => {
    res.json({ ok: true })
})

app.use('/auth', require('./src/routes/auth'))
app.use('/turnos', turnosRoutes)
app.use('/jugadores', jugadoresRoutes)
app.use('/inscripciones', inscripcionesRoutes)
app.use('/espera', require('./src/routes/espera'))
app.use('/cupos', require('./src/routes/cupos'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀 API running on port ${PORT}`)
})
