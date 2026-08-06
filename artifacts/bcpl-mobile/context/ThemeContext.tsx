import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'stadium' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('bcpl-theme').then((val) => {
      if (val === 'stadium' || val === 'light') {
        setThemeState(val);
      }
      setLoaded(true);
    });
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem('bcpl-theme', t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'stadium' ? 'light' : 'stadium');
  };

    return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
