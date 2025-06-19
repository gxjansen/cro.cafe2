/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Teal color palette based on #95c3c0
        primary: {
          50: '#e8f4f3',   // background tints
          100: '#d1e9e7',  // dark mode text
          200: '#a3d3ce',  // dark mode accents
          300: '#95c3c0',  // original - dark mode primary
          400: '#6ba9a4',  // transitions
          500: '#4d8783',  // light mode secondary text
          600: '#3d6b68',  // light mode links/buttons
          700: '#2e504e',  // light mode body text
          800: '#1e3533',  // light mode headings
          900: '#0f1a1a',  // high contrast elements
        },
        // Coral pink palette based on #dd8e91
        secondary: {
          50: '#fef1f1',   // background tints
          100: '#fce3e4',  // dark mode text
          200: '#f9c7c9',  // dark mode accents
          300: '#dd8e91',  // original - dark mode primary
          400: '#d16669',  // transitions
          500: '#c14448',  // light mode secondary text
          600: '#9a363a',  // light mode links/buttons
          700: '#73292c',  // light mode body text
          800: '#4d1b1d',  // light mode headings
          900: '#260e0f',  // high contrast elements
        },
        // Neutral grays for UI elements
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}