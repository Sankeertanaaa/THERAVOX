/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2d3436', // dark gray
                secondary: '#0984e3', // blue
                accent: '#ffeaa7', // soft yellow
            }
          
        },
    },
    plugins: [],
}
  