/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        customNavyBlue: "#1E3A8A",
        customTableBlue: "#93C5FD",
        customYellow: "#FDE68A",
      },
      boxShadow: {
        'superdark': '0 10px 30px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
