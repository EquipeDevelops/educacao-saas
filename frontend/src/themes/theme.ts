'use client';
import { createTheme } from '@mui/material/styles';

const otherColors = {
  accents: [
    "#FF7948",
    "#FAE2C6",
    "#A582F1",
    "#EBE2FF",
    "#FFB109",
    "#FFF4D1",
  ],
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#377CF7',
      dark: '#0e4fa5ff',
      contrastText: '#73B1FB',
      light: '#E2ECFF',
    },
    secondary: {
      main: '#101828',
    },
    background: {
      default: '#F6F6F6',
      paper: '#FFF',
    },
    text: {
      primary: '#1E1E1E',
      secondary: '#3b3b3bff',
      disabled: '#717182',
    },
    success: {
      main: '#5CCD9F',
      light: '#EDFFEF',
      dark: '#016630',
    },
    error: {
      main: '#fc5659ff',
      light: '#FFE3E3',
      dark: '#9A0000',
    },
    warning: {
      main: '#FF6D70',
      light: '#FFE3E3',
    },
    grey: {
      100: '#F9F9F9',
      200: '#F9FAFB',
      300: '#EBEBEB',
      400: '#CCCCCC',
    },
  },
  typography: {
    fontSize: 16, // base (1rem = 16px)
    h1: {
      fontSize: "3rem", // 48px
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2.25rem", // 36px
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.875rem", // 30px
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.5rem", // 24px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem", // 20px
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem", // 16px
      fontWeight: 500,
      lineHeight: 1.5,
    },

    body1: {
      fontSize: "1rem", // 16px
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem", // 14px
      lineHeight: 1.43,
    },
    caption: {
      fontSize: "0.75rem", // 12px
      lineHeight: 1.35,
      color: "#717182",
    },
    overline: {
      fontSize: "0.75rem", // 12px
      fontWeight: 500,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    button: {
      fontSize: "0.875rem", // 14px
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 5,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    }
  }
});