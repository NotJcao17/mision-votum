/**
 * Misión Votum — Dirección visual "Mercado"
 * Tailwind theme tokens. Pega `theme.extend` en tu tailwind.config.js de Next.js.
 *
 * Fuentes (carga en app/layout.tsx con next/font o <link> a Google Fonts):
 *   - Display: Fraunces
 *   - Cuerpo:  Hanken Grotesk
 */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF5EC',     // fondo cálido principal
        cream: '#F2E7D4',      // superficie / inputs
        ink: '#2B1D14',        // tinta tintada (texto principal)
        inksoft: '#6F5E4C',    // texto secundario
        inkfaint: '#A2917C',   // texto terciario / placeholders
        terra: '#C2552F',      // acento principal (terracota)
        terradeep: '#A23F1F',  // hover del acento
        olive: '#3E5A4A',      // acento secundario
        saffron: '#DE9A33',    // acento de energía
        danger: '#B23A2E',     // error (rojo tintado, no puro)
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        terra: '0 8px 20px rgba(194,85,47,0.28)',
      },
    },
  },
  plugins: [],
};
