import { createTheme, alpha } from '@mui/material/styles'

// Shared brand colours across both modes.
export const brand = {
  primary: '#4f46e5', // indigo
  primaryDark: '#4338ca',
  secondary: '#0ea5e9', // sky
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
}

const common = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
}

function componentsFor(mode, palette) {
  const isDark = mode === 'dark'
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.background.default },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          paddingInline: 16,
          transition: 'transform .12s ease, box-shadow .2s ease, background-color .2s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          boxShadow: `0 6px 16px ${alpha(brand.primary, isDark ? 0.45 : 0.28)}`,
          '&:hover': { boxShadow: `0 10px 22px ${alpha(brand.primary, isDark ? 0.55 : 0.36)}` },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${palette.divider}`,
          backgroundImage: 'none',
          boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(16,24,40,0.05)',
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: palette.divider },
        head: {
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: palette.text.secondary,
          background: isDark ? palette.background.paper : '#f8fafc',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { transition: 'background-color .15s ease' },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: 12, fontWeight: 500, padding: '6px 10px' },
      },
    },
  }
}

export function getTheme(mode = 'light') {
  const isDark = mode === 'dark'
  const palette = isDark
    ? {
        mode: 'dark',
        primary: { main: brand.primary, dark: brand.primaryDark },
        secondary: { main: brand.secondary },
        success: { main: brand.success },
        warning: { main: brand.warning },
        error: { main: brand.error },
        info: { main: brand.info },
        background: { default: '#0b1020', paper: '#121a2e' },
        divider: 'rgba(148,163,184,0.16)',
        text: { primary: '#e8edf6', secondary: '#9aa7bd' },
      }
    : {
        mode: 'light',
        primary: { main: brand.primary, dark: brand.primaryDark },
        secondary: { main: brand.secondary },
        success: { main: brand.success },
        warning: { main: brand.warning },
        error: { main: brand.error },
        info: { main: brand.info },
        background: { default: '#f5f7fb', paper: '#ffffff' },
        divider: '#e6e9f0',
        text: { primary: '#0f172a', secondary: '#64748b' },
      }

  return createTheme({ ...common, palette, components: componentsFor(mode, palette) })
}

export default getTheme('light')
