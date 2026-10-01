export const theme = {
  // Base backgrounds
  bg: '#080c14',
  bgGlass: 'rgba(8, 12, 20, 0.85)',
  bgSubtle: '#0d1322',
  
  // Card and surface layers
  card: '#0e1526',
  cardGlass: 'rgba(14, 21, 38, 0.75)',
  surface: '#141d33',
  surfaceHover: '#1c2846',
  surfaceActive: '#223257',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderMuted: 'rgba(255, 255, 255, 0.04)',
  borderAccent: 'rgba(16, 185, 129, 0.3)',
  borderGlow: 'rgba(16, 185, 129, 0.5)',

  // Primary Accent (Vibrant Emerald Neon)
  accent: '#10b981',
  accentMuted: '#34d399',
  accentDark: '#059669',
  accentSoft: 'rgba(16, 185, 129, 0.12)',
  accentGlow: '0 0 20px rgba(16, 185, 129, 0.35)',

  // Secondary Accents (Cyber Cyan & Indigo)
  cyan: '#06b6d4',
  cyanSoft: 'rgba(6, 182, 212, 0.12)',
  indigo: '#6366f1',
  indigoSoft: 'rgba(99, 102, 241, 0.12)',

  // Typography
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textDim: '#64748b',

  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dangerSoft: 'rgba(239, 68, 68, 0.12)',
  dangerBorder: 'rgba(239, 68, 68, 0.35)',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(20, 29, 51, 0.8) 0%, rgba(14, 21, 38, 0.95) 100%)',
  gradientBubbleMe: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
} as const;

export type ThemeType = typeof theme;
