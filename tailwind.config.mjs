/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Teal color palette based on #95c3c0 - optimized for accessibility
        primary: {
          50: '#e8f4f3',   // background tints
          100: '#d1e9e7',  // light backgrounds
          200: '#a8d5d2',  // dark mode text/icons (accessible)
          300: '#95c3c0',  // original - decorative elements
          400: '#7ba5a2',  // hover states
          500: '#5a8a87',  // light mode primary (accessible)
          600: '#4a726f',  // light mode hover
          700: '#3a5957',  // light mode pressed
          800: '#2a413f',  // high contrast
          900: '#1a2827',  // highest contrast
        },
        // Coral accent palette based on #dd8e91 - optimized for CTAs
        accent: {
          50: '#fef1f1',   // background tints
          100: '#fce3e4',  // light backgrounds
          200: '#f0a5a8',  // dark mode CTAs (accessible)
          300: '#dd8e91',  // original - decorative elements
          400: '#d47175',  // hover states
          500: '#c05559',  // light mode CTAs (accessible)
          600: '#a64549',  // light mode hover
          700: '#8c3639',  // light mode pressed
          800: '#722629',  // high contrast
          900: '#581719',  // highest contrast
        },
        // Language-specific accent colors using CSS variables
        lang: {
          50: 'var(--lang-accent-50)',
          100: 'var(--lang-accent-100)',
          200: 'var(--lang-accent-200)',
          300: 'var(--lang-accent-300)',
          400: 'var(--lang-accent-400)',
          500: 'var(--lang-accent-500)',
          600: 'var(--lang-accent-600)',
          700: 'var(--lang-accent-700)',
          800: 'var(--lang-accent-800)',
          900: 'var(--lang-accent-900)',
        },
        // Neutral grays for UI elements - optimized for WCAG AA compliance
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',   // Light mode borders only
          400: '#6b7280',   // Updated from #9ca3af - minimum for text on white (4.5:1)
          500: '#4b5563',   // Better contrast for body text
          600: '#374151',   // Preferred for important text
          700: '#1f2937',
          800: '#111827',
          900: '#030712',
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