/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
            },
            colors: {
                'app-bg': '#0b0b0c',
                'surface-1': 'rgba(17,18,20,0.60)',
                'surface-2': 'rgba(34,36,40,0.50)',
                accent: '#7c5cff',
            },
            boxShadow: {
                'soft-glow': '0 6px 30px rgba(124,92,255,0.06)',
            },
        },
    },
    plugins: [],
};
