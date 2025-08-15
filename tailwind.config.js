/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Mobile-first breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Touch-friendly spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Mobile-optimized z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Safe area support
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Touch target sizes
      minHeight: {
        '44': '44px', // Minimum touch target size
        '48': '48px',
      },
      minWidth: {
        '44': '44px',
        '48': '48px',
      },
      // Mobile-optimized animation durations
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
      // Mobile-friendly border radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Performance-optimized shadows
      boxShadow: {
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      // Mobile typography scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      }
    },
  },
  plugins: [
    // Add plugin for touch utilities
    function({ addUtilities, theme }) {
      addUtilities({
        '.touch-callout-none': {
          '-webkit-touch-callout': 'none',
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.touch-pan-x': {
          'touch-action': 'pan-x',
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y',
        },
        '.touch-pinch-zoom': {
          'touch-action': 'pinch-zoom',
        },
        '.touch-none': {
          'touch-action': 'none',
        },
        '.overscroll-none': {
          'overscroll-behavior': 'none',
        },
        '.overscroll-contain': {
          'overscroll-behavior': 'contain',
        },
        '.webkit-appearance-none': {
          '-webkit-appearance': 'none',
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.user-select-none': {
          '-webkit-user-select': 'none',
          '-moz-user-select': 'none',
          'user-select': 'none',
        },
        '.hardware-accelerate': {
          'transform': 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
        }
      });
    }
  ],
};
