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
    background: {
      default: '#F6F6F6',
      paper: '#FFF',
    },
    text: {
      primary: '#282828',
      secondary: '#1E1E1E',
      disabled: '#A7A7A7',
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
    accents: {
      100: otherColors.accents[0], // #FF7948
      200: otherColors.accents[1], // #FAE2C6
      300: otherColors.accents[2], // #A582F1
      400: otherColors.accents[3], // #EBE2FF
      500: otherColors.accents[4], // #FFB109
      600: otherColors.accents[5], // #FFF4D1
    },
    grey: {
      100: '#F9F9F9',
      200: '#F9FAFB',
      300: '#EBEBEB',
      400: '#CCCCCC',
    },
  },
});
