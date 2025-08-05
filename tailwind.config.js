/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", // Escanea el archivo HTML principal
    "./js/**/*.js", // Escanea todos los archivos .js dentro de la carpeta js/ y sus subcarpetas
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
