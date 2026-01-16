/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Montserrat', 'sans-serif'],
            },
            colors: {
                // Paleta inspirada en "Academia Bogado"
                brand: {
                    dark: '#0B1120',       // Fondo principal (Azul noche profundo)
                    blue: '#162A45',       // Paneles / Cards (Azul cancha)
                    lime: '#D4E918',       // Acento principal (Verde tenis/lima)
                    highlight: '#3B82F6',  // Azul eléctrico secundario
                },
                // Alias semánticos
                primary: '#3B82F6',        // Mantener para compatibilidad, o migrar a brand-lime
                secondary: '#D4E918',
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(to bottom right, #0B1120, #111827)',
            }
        },
    },
    plugins: [],
}
