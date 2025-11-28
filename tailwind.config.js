/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          cream: {
            bg: '#F7F5F2', 
            card: 'rgba(255, 255, 255, 0.85)', 
            text: '#2D2A26', 
            accent: '#E8D5C4', 
          },
        },
        boxShadow: {
          'cream': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
          'cream-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 8px 10px -2px rgba(0, 0, 0, 0.06)',
          'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.6)',
        },
        borderRadius: {
          'xl-card': '28px',
        },
      },
    },
    plugins: [],
  }