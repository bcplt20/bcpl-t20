import { useTheme } from '@/context/ThemeContext';

export const THEMES = {
  stadium: {
    bg: '#101433',
    card: '#1A1F49',
    card2: '#222859',
    ink: '#F3F2FF',
    sub: '#9E9BD1',
    line: 'rgba(255,255,255,0.10)',
    raise: '#262C63',
    glass: 'rgba(16,20,51,0.86)',
    mesh1: 'rgba(255,61,166,0.30)',
    mesh2: 'rgba(0,220,245,0.20)',
    mesh3: 'rgba(124,92,255,0.30)',
    onmesh: '#FFFFFF',
    // accents (shared)
    violet: '#7C5CFF',
    magenta: '#FF3DA6',
    cyan: '#00DCF5',
    lime: '#B6FF3C',
    orange: '#FF8A3D',
    amber: '#FFC53D',
    mint: '#16E0A3',
    coral: '#FF5A6E',
  },
  light: {
    bg: '#F4F1FD',
    card: '#FFFFFF',
    card2: '#FAF8FF',
    ink: '#171040',
    sub: '#6E6796',
    line: '#EAE5F8',
    raise: '#F2EEFD',
    glass: 'rgba(244,241,253,0.86)',
    mesh1: 'rgba(255,61,166,0.16)',
    mesh2: 'rgba(0,220,245,0.16)',
    mesh3: 'rgba(124,92,255,0.18)',
    onmesh: '#171040',
    // accents (shared - maybe some are slightly adjusted in use, but mockup uses same tokens)
    violet: '#7C5CFF',
    magenta: '#FF3DA6',
    cyan: '#00DCF5', // Note: in light theme, cyan/lime links might need darkening if illegible, mockup uses them as-is? Let's check mockup. Mockup says "plus the light-theme accent-darkening the mockup does for tags/links".
    lime: '#B6FF3C',
    orange: '#FF8A3D',
    amber: '#FFC53D',
    mint: '#16E0A3',
    coral: '#FF5A6E',
  }
};

export function useColors() {
  const { theme } = useTheme();
  const tokens = THEMES[theme];

  // The mockup uses text color changes for links/tags in light theme
  const getAccentText = (baseColor: string) => {
    if (theme === 'light') {
      if (baseColor === '#00DCF5') return '#0097A7'; // Darker cyan
      if (baseColor === '#B6FF3C') return '#6F9E00'; // Darker lime
      if (baseColor === '#FFC53D') return '#D49200'; // Darker amber
      if (baseColor === '#16E0A3') return '#009E73'; // Darker mint
    }
    return baseColor;
  };

  return {
    ...tokens,
    getAccentText,
    isDark: theme === 'stadium',
    // Aliases for transition
    background: tokens.bg,
    foreground: tokens.ink,
    cardBackground: tokens.card, // using full name to avoid conflict, but 'card' is in tokens
    mutedForeground: tokens.sub,
    border: tokens.line,
    primary: tokens.violet,
    accent: tokens.cyan,
    destructive: tokens.coral,
    success: tokens.mint,
  };
}