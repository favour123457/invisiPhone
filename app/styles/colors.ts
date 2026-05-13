// Centralized color scheme configuration
// Maroon/Dark Orange theme

export const colors = {
  // Primary colors
  primary: {
    maroon: '#991b1b',      // red-900
    darkOrange: '#c2410c',  // orange-700
    orange: '#ea580c',      // orange-600
    lightOrange: '#fb923c', // orange-400
  },

  // Gradients
  gradients: {
    primary: 'from-orange-700 to-red-700',
    primaryCSS: 'linear-gradient(135deg, #c2410c, #991b1b)',
    accent: 'from-orange-600 to-orange-700',
    accentCSS: 'linear-gradient(135deg, #ea580c, #c2410c)',
  },

  // Semantic colors
  background: {
    primary: '#07070c',
    secondary: '#0a0a14',
    tertiary: '#0d0d16',
  },

  // State colors
  states: {
    active: '#ea580c',      // orange-600
    hover: '#c2410c',       // orange-700
    disabled: 'rgba(255,255,255,0.06)',
  },

  // Border colors
  borders: {
    primary: 'rgba(234, 88, 12, 0.2)',   // orange with opacity
    secondary: 'rgba(234, 88, 12, 0.4)',
    active: 'rgba(234, 88, 12, 0.5)',
  },

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.6)',
    tertiary: 'rgba(255,255,255,0.4)',
    accent: '#fb923c',      // orange-400
  },

  // Shadow colors
  shadows: {
    primary: 'rgba(234, 88, 12, 0.2)',
    glow: 'rgba(234, 88, 12, 0.6)',
  },
};

// Tailwind class mappings for easy replacement
export const tailwindClasses = {
  // Background classes
  bgPrimary: 'bg-orange-600',
  bgPrimaryHover: 'hover:bg-orange-500',
  bgPrimaryLight: 'bg-orange-600/10',
  bgGradient: 'bg-gradient-to-br from-orange-700 to-red-700',

  // Text classes
  textPrimary: 'text-orange-400',
  textAccent: 'text-orange-500',

  // Border classes
  borderPrimary: 'border-orange-500',
  borderPrimaryLight: 'border-orange-500/20',

  // Ring/Focus classes
  ringPrimary: 'ring-orange-500',
  focusBorder: 'focus-within:border-orange-500/50',
};
