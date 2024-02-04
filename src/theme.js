// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Assuming a dark theme for better visibility of text against the gradient
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background: linear-gradient(to bottom, #030708 0%, #1B2832 100%);
          min-height: 100vh;
          color: white;
        }
      `,
    },
  },
});

export default theme;
