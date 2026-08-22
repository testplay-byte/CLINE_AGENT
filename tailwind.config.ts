import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        secondary: 'var(--secondary)',
        input: 'var(--input)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        'accent-2': 'var(--accent-2)',
        'accent-soft': 'var(--accent-soft)',
        'accent-muted': 'var(--accent-muted)',
        success: 'var(--success)',
        'success-soft': 'var(--success-soft)',
        destructive: 'var(--destructive)',
        'destructive-soft': 'var(--destructive-soft)',
        'diff-add': '#22c55e',
        'diff-del': '#ef4444',
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        DEFAULT: 'var(--radius)',
        lg: 'calc(var(--radius) + 0px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      fontFamily: {
        sans: ['"Space Grotesk Variable"', '"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        bento: 'var(--shadow-bento)',
        'bento-sm': 'var(--shadow-bento-sm)',
        drag: 'var(--shadow-drag)',
      },
      transitionTimingFunction: {
        acute: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
