/** @type {import('tailwindcss').Config} */
// Palette + scale adapted from Retool's design system (obsidian/parchment/ember),
// with Megaport red retained as the single brand accent.
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // Retool surfaces
        canvas: '#151515',     // dominant ground
        void: '#0e0e0e',       // recessed panels
        ember: '#242424',      // raised cards
        ember2: '#2c2c2c',     // hover lift
        rim: '#3f403d',        // borders/dividers
        copper: '#8b867f',     // muted accents
        ash: '#94958e',        // secondary text
        fog: '#cbccc4',        // supporting copy
        limestone: '#b6b8af',  // eyebrow/captions
        parchment: '#e9ebdf',  // primary text / bright
        forest: '#185849',     // teal wash
        moss: '#0e352c',       // deeper teal / badges
        // Megaport brand accent (single chromatic punctuation)
        mp: '#E0182D',
        mpdark: '#B3121F',
        // status
        live: '#5dcaa5',
        config: '#e0a83a',
        deploy: '#6aa8e0',
      },
      fontFamily: {
        // saansFont substitute per Retool guide: Inter / DM Sans
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'Geist', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        display: '-0.022em',
        head: '-0.01em',
        label: '0.013em',
      },
      borderRadius: {
        card: '12px',
        tag: '4px',
        pill: '9999px',
      },
      transitionTimingFunction: {
        retool: 'cubic-bezier(0.72, 0, 0.12, 1)',
      },
    },
  },
  plugins: [],
}
