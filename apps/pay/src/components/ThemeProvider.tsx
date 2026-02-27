'use client';

import React, { createContext, useContext, useCallback } from 'react';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component that provides dark theme only
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme: Theme = 'dark';

  // No-op functions for backward compatibility
  const setTheme = useCallback(() => {
    // Dark mode only - no operation needed
  }, []);

  const toggleTheme = useCallback(() => {
    // Dark mode only - no operation needed
  }, []);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * ThemeToggle component - no-op for dark mode only
 */
export const ThemeToggle: React.FC = () => {
  // Return null since we don't need theme toggle in dark-only mode
  return null;
};

/**
 * Script to prevent flash of unstyled content (FOUC)
 * This should be injected into the <head> via dangerouslySetInnerHTML
 */
export const FOUC_PREVENTION_SCRIPT = `
(function() {
  document.documentElement.setAttribute('data-theme', 'dark');
})();
`;
