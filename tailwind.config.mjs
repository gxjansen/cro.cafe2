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
        // LinkedIn brand colors
        linkedin: {
          50: '#E8F4F8',    // Light background tint
          100: '#D1E9F1',   // Lighter variations
          200: '#A3D3E3',   // Light accent
          300: '#74BDD5',   // Medium light
          400: '#46A7C7',   // Medium
          500: '#0077B5',   // Primary LinkedIn blue
          600: '#005885',   // Hover state
          700: '#004264',   // Pressed state
          800: '#002C43',   // Dark variant
          900: '#001621',   // Darkest variant
        },
        // Sync status colors for LinkedIn integration
        sync: {
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',   // Primary success
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          pending: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',   // Primary pending/warning
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
          error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',   // Primary error
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
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
          750: '#1a2332',   // New shade for better card contrast
          800: '#111827',
          850: '#0c1118',   // New shade between 800-900
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
      // Shadow utilities for LinkedIn cards
      boxShadow: {
        'linkedin': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'linkedin-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'linkedin-active': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'sync-pending': '0 0 0 3px rgba(234, 179, 8, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'sync-success': '0 0 0 3px rgba(34, 197, 94, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'sync-error': '0 0 0 3px rgba(239, 68, 68, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.08)',
      },
      // Transition utilities for smooth interactions
      transitionProperty: {
        'shadow': 'box-shadow',
        'colors': 'color, background-color, border-color',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}