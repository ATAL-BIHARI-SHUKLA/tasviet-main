import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const Profile = () => {
  const { profile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  if (!profile) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#7428dc', mb: 2 }} />
          <Typography color="text.secondary">Loading profile...</Typography>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto", bgcolor: '#f5f5f7' }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#7428dc' }}>Admin Profile</Typography>
        <Typography variant="body1" sx={{ color: '#555555' }}>
          Manage your account information
        </Typography>
      </Box>
      
      <Card sx={{ 
        mb: 4, 
        borderRadius: 3, 
        overflow: 'hidden',
        boxShadow: '0px 4px 12px rgba(116, 40, 220, 0.08)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          bgcolor: 'rgba(116, 40, 220, 0.02)'
        }}>
          <Box sx={{ 
            width: { xs: '100%', sm: 250 },
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'rgba(116, 40, 220, 0.04)',
            borderRight: { sm: '1px solid rgba(0, 0, 0, 0.05)' }
          }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2,
                bgcolor: 'rgba(116, 40, 220, 0.2)',
                fontSize: '3rem',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(116, 40, 220, 0.15)'
              }}
            >
              {profile.displayName?.charAt(0) || "A"}
            </Avatar>
            
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {profile.displayName}
            </Typography>
            
            <Box sx={{ 
              bgcolor: 'rgba(116, 40, 220, 0.9)', 
              color: 'white', 
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: 0.5,
              mt: 1,
              boxShadow: '0 2px 8px rgba(116, 40, 220, 0.25)'
            }}>
              Administrator
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1, p: 2 }}>
            <form onSubmit={handleSubmit}>
              <Typography variant="h6" fontWeight={600} mb={2} sx={{ color: '#7428dc' }}>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Personal Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    defaultValue={profile.displayName || ""}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <BadgeIcon sx={{ mr: 1, color: '#7428dc' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    defaultValue={profile.email || ""}
                    variant="outlined"
                    disabled
                    helperText="Email cannot be changed"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: '#7428dc' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    defaultValue={profile.phone || ""}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: '#7428dc' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    defaultValue={profile.bio || ""}
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{ 
                        background: 'linear-gradient(45deg, #7428dc, #670fdb)',
                        boxShadow: '0px 2px 4px rgba(116, 40, 220, 0.15)',
                        '&:hover': { 
                          background: 'linear-gradient(45deg, #8a4be3, #7428dc)',
                          boxShadow: '0px 4px 8px rgba(116, 40, 220, 0.25)'
                        }
                      }}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Profile;
