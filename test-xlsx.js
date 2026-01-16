const xlsx = require('xlsx')
const fs = require('fs')

try {
    const wb = xlsx.utils.book_new()
    const rows = [
        { "Dia": "Lunes", "Horario": "18:00 - 19:30" }
    ]
    const ws = xlsx.utils.json_to_sheet(rows)
    xlsx.utils.book_append_sheet(wb, ws, 'Inscripciones')

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    fs.writeFileSync('test_output.xlsx', buffer)
    console.log('Test file created successfully. Size:', buffer.length)

} catch (e) {
    console.error('Error:', e)
}
