import { createContext, useLayoutEffect, useState } from "react";

const defaultTheme = "serika_dark";

type ThemeContextType = {
  theme: string,
  setTheme: (theme: string) => void, 
}

export const ThemeContext = createContext<ThemeContextType>({ theme: defaultTheme, setTheme: () => {} });

export interface ThemeProviderProps {
  children: React.ReactNode
}

const ThemeProvider = ( {children}: ThemeProviderProps) => {
  const [theme, setTheme] = useState(defaultTheme);

  useLayoutEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =  `/themes/${theme}.css`;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{theme, setTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;