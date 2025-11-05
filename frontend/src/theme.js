import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',      // Professional blue
      dark: '#004ba0',
      light: '#63a4ff'
    },
    secondary: {
      main: '#ff9800',      // Warning/alert orange
      dark: '#c66900',
      light: '#ffc947'
    },
    error: {
      main: '#f44336'       // Error red
    },
    background: {
      default: '#f5f5f5',   // Light gray background
      paper: '#ffffff'      // White surface
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
});

export default theme;