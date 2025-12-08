import { createTheme } from '@mui/material/styles';

// CoreSY Admin Dashboard Theme
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#9C27B0',
      light: '#BA68C8',
      dark: '#7B1FA2',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    error: {
      main: '#F44336',
    },
    info: {
      main: '#2196F3',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  spacing: 8, // Base spacing unit (8px)
  shape: {
    borderRadius: 8, // Default border radius
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.12)',
    '0 1px 3px rgba(0,0,0,0.12)',
    '0 1px 3px rgba(0,0,0,0.12)',
    '0 4px 6px rgba(0,0,0,0.1)',
    '0 4px 6px rgba(0,0,0,0.1)',
    '0 4px 6px rgba(0,0,0,0.1)',
    '0 4px 6px rgba(0,0,0,0.1)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 10px 20px rgba(0,0,0,0.15)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
    '0 20px 40px rgba(0,0,0,0.2)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});
