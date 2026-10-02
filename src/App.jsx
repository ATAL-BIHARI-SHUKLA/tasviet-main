
import { routes } from "./routes/CompositeRoute";
import { RouterProvider } from "react-router-dom";
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import adminTheme from './theme/adminTheme';
import api from './lib/api';

// Get the UnauthorizedError class from the default export
const { UnauthorizedError } = api;

const App = () => {
  // Global error handler for unauthorized errors
  useEffect(() => {
    // Add a flag to prevent multiple redirects
    let redirecting = false;
    
    const handleUnauthorizedErrors = (event) => {
      const error = event.error;
      if (error instanceof UnauthorizedError && !redirecting) {
        console.error('Global unauthorized error caught:', error.message);
        redirecting = true;
        
        // Use history API instead of direct location change to prevent full reload
        if (window.location.pathname !== '/unauthorized') {
          window.history.pushState({}, '', '/unauthorized');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        
        event.preventDefault(); // Prevent default error handling
      }
    };
    
    window.addEventListener('error', handleUnauthorizedErrors);
    return () => window.removeEventListener('error', handleUnauthorizedErrors);
  }, []);
  
  return (
    <ThemeProvider theme={adminTheme}>
      <RouterProvider router={routes} />
    </ThemeProvider>
  );
};

export default App;