import { createTheme } from '@mui/material/styles';

// Admin theme with purple gradients and black text
const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7428dc', // Main purple
      light: '#8a4be3', // Lighter purple
      dark: '#670fdb', // Darker purple
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#670fdb', // Darker purple
      light: '#7f32e4',
      dark: '#5c00cb',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#000000', // Black for primary text
      secondary: '#555555', // Light black for less important text
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#000000',
    },
    h2: {
      fontWeight: 700,
      color: '#000000',
    },
    h3: {
      fontWeight: 600,
      color: '#000000',
    },
    h4: {
      fontWeight: 600,
      color: '#000000',
    },
    h5: {
      fontWeight: 500,
      color: '#000000',
    },
    h6: {
      fontWeight: 500,
      color: '#000000',
    },
    subtitle1: {
      color: '#555555',
    },
    subtitle2: {
      color: '#555555',
      fontWeight: 400,
    },
    body1: {
      color: '#000000',
    },
    body2: {
      color: '#555555',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 4px 8px rgba(116, 40, 220, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(116, 40, 220, 0.25)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #7428dc, #670fdb)',
          '&:hover': {
            background: 'linear-gradient(45deg, #8a4be3, #7428dc)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #670fdb, #5c00cb)',
          '&:hover': {
            background: 'linear-gradient(45deg, #7428dc, #670fdb)',
          },
        },
        outlined: {
          borderColor: '#7428dc',
          color: '#7428dc',
          '&:hover': {
            borderColor: '#670fdb',
            background: 'rgba(116, 40, 220, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        filledPrimary: {
          background: 'linear-gradient(45deg, #7428dc, #670fdb)',
        },
        filledSecondary: {
          background: 'linear-gradient(45deg, #670fdb, #5c00cb)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(116, 40, 220, 0.04)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': {
            border: 0,
          },
        },
      },
    },
  },
});

export default adminTheme;
