import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import AppRouter from './router';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
