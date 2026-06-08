import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getTheme } from '../theme'

const ColorModeContext = createContext({ mode: 'light', toggle: () => {} })

const STORAGE_KEY = 'ca_theme_mode'

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.setAttribute('data-theme', mode)
    // brief transition class for smooth toggle
    document.documentElement.classList.add('ca-theme-transition')
    const t = setTimeout(() => document.documentElement.classList.remove('ca-theme-transition'), 300)
    return () => clearTimeout(t)
  }, [mode])

  const value = useMemo(
    () => ({ mode, toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')), setMode }),
    [mode]
  )
  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return useContext(ColorModeContext)
}
