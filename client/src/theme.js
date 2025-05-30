import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E3B55',
      light: '#4A5D7A',
      dark: '#1A2536',
    },
    secondary: {
      main: '#E57373',
      light: '#FFA4A4',
      dark: '#B34141',
    },
  },
  typography: {
    fontFamily: [
      'Playfair Display',
      'Montserrat',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Playfair Display',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Playfair Display',
      fontWeight: 600,
    },
    h3: {
      fontFamily: 'Playfair Display',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Playfair Display',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Montserrat',
      fontWeight: 500,
    },
    h6: {
      fontFamily: 'Montserrat',
      fontWeight: 500,
    },
    body1: {
      fontFamily: 'Montserrat',
    },
    body2: {
      fontFamily: 'Montserrat',
    },
    button: {
      fontFamily: 'Montserrat',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          },
        },
      },
    },
  },
});

export default theme; 