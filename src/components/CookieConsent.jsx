import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Slide, Link, Alert } from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';
import { setCookie, checkThirdPartyCookiesEnabled } from '../utils/cookieUtils';

const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [thirdPartyCookiesDisabled, setThirdPartyCookiesDisabled] = useState(false);
  
  useEffect(() => {
    // Check if user already accepted cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      // Show banner after a small delay for better UX
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Check if third-party cookies are enabled
      const checkCookies = async () => {
        const thirdPartyCookiesEnabled = await checkThirdPartyCookiesEnabled();
        if (!thirdPartyCookiesEnabled) {
          setThirdPartyCookiesDisabled(true);
          setOpen(true);
        }
      };
      checkCookies();
    }
  }, []);

  const handleAccept = async () => {
    // Set the cookie acceptance in local storage
    localStorage.setItem('cookiesAccepted', 'true');
    
    // Set the required cookies with proper attributes for cross-domain use
    setCookie("cookieConsent", "true", { maxAge: 31536000 }); // 1 year
    
    // Check if third-party cookies work
    const thirdPartyCookiesEnabled = await checkThirdPartyCookiesEnabled();
    if (!thirdPartyCookiesEnabled) {
      setThirdPartyCookiesDisabled(true);
    } else {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <Slide direction="up" in={open}>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 9999,
          p: 2,
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <CookieIcon color="primary" fontSize="large" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              This site uses cookies
            </Typography>
            
            {thirdPartyCookiesDisabled && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Third-party cookies appear to be disabled in your browser. This application requires third-party cookies
                for authentication between domains. Please enable third-party cookies to use all features.
              </Alert>
            )}
            
            <Typography variant="body2" color="text.secondary" paragraph>
              We use cookies to enable authentication and maintain your session. This application requires cookies to function properly.
              Third-party cookies are used for authentication between our domains to provide you with a seamless experience.
              <Link 
                href="/cookie-policy"
                sx={{ ml: 1, display: 'inline-block' }}
                color="primary"
              >
                Learn more
              </Link>
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAccept}
                sx={{ minWidth: 120 }}
              >
                Accept All Cookies
              </Button>
              
              {thirdPartyCookiesDisabled && (
                <Button
                  variant="outlined"
                  color="primary"
                  component="a"
                  href="https://www.cookiesandyou.com/enable-cookies/windows/chrome/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to Enable Cookies
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default CookieConsent;