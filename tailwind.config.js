/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
                serif: ['Crimson Text', 'serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            colors: {
                background: 'rgb(var(--background) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                surface: 'rgb(var(--surface) / <alpha-value>)',
                muted: 'rgb(var(--muted) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                accent: 'rgb(var(--accent) / <alpha-value>)',
                interactive: 'rgb(var(--interactive) / <alpha-value>)',
                primary: {
                    DEFAULT: 'rgb(var(--foreground) / <alpha-value>)',
                },
            },
            fontSize: {
                'display': ['72px', { lineHeight: '1', letterSpacing: '-0.02em' }],
                'h1': ['48px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
                'h2': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
                'h3': ['24px', { lineHeight: '1.3' }],
            },
            transitionTimingFunction: {
                'editorial': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', // Slower, smoother fade
                'marquee': 'marquee 40s linear infinite',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
            },
        },
    },
    plugins: [],
}
