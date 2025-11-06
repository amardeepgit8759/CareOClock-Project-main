// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            fontSize: {
                'elderly-base': '18px',
                'elderly-lg': '20px',
                'elderly-xl': '24px',
                'elderly-2xl': '28px',
                'elderly-3xl': '32px'
            },
            spacing: {
                'elderly-btn': '48px'
            }
        },
    },
    plugins: [],
}
