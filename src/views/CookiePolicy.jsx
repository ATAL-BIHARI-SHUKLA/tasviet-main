import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider 
} from '@mui/material';

const CookiePolicy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700} color="primary.main">
          Cookie Policy
        </Typography>
        
        <Box mb={4}>
          <Typography variant="body1" paragraph>
            This Cookie Policy explains how TASViet ("we", "us", and "our") uses cookies and similar technologies 
            to recognize you when you visit our website and applications ("Website"). It explains what these 
            technologies are and why we use them, as well as your rights to control our use of them.
          </Typography>
          
          <Typography variant="body1" paragraph>
            By continuing to use our Website, you are agreeing to our use of cookies as described in this 
            Cookie Policy.
          </Typography>
        </Box>
        
        <Box mb={4}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            What are cookies?
          </Typography>
          
          <Typography variant="body1" paragraph>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. 
            Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, 
            as well as to provide reporting information.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Cookies set by the website owner (in this case, TASViet) are called "first party cookies". 
            Cookies set by parties other than the website owner are called "third party cookies". 
            Third party cookies enable third party features or functionality to be provided on or through the 
            website (e.g., authentication and session management).
          </Typography>
        </Box>
        
        <Box mb={4}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Why do we use cookies?
          </Typography>
          
          <Typography variant="body1" paragraph>
            We use first and third party cookies for several reasons. Some cookies are required for technical 
            reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" 
            cookies. In particular, we use cookies for authentication and session management between our domains.
          </Typography>
          
          <List sx={{ bgcolor: 'background.default', borderRadius: 1, p: 2, mb: 2 }}>
            <ListItem>
              <ListItemText 
                primary="Authentication cookies" 
                secondary="These cookies are used to identify users and ensure secure sign-in to our application."
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText 
                primary="Session cookies" 
                secondary="These cookies allow our application to remember choices you make and provide enhanced functionality and personalization."
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText 
                primary="Cross-site cookies" 
                secondary="These cookies are used for integrating services across our domains to provide a seamless experience."
              />
            </ListItem>
          </List>
        </Box>
        
        <Box mb={4}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            How can you control cookies?
          </Typography>
          
          <Typography variant="body1" paragraph>
            You have the right to decide whether to accept or reject cookies. However, since our application 
            relies on cookies for authentication and maintaining your session, disabling cookies may prevent 
            you from using our services properly.
          </Typography>
          
          <Typography variant="body1" paragraph>
            You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject 
            cookies, you may still use our website, though your access to some functionality and areas of our 
            website may be restricted.
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Contact us
          </Typography>
          
          <Typography variant="body1">
            If you have any questions about our use of cookies or other technologies, please email us at 
            support@tasviet.com or by post to:
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic' }}>
            TASViet<br />
            123 Business Avenue<br />
            Mumbai, Maharashtra 400001<br />
            India
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CookiePolicy;