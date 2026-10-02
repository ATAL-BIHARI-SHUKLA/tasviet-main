import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Avatar, 
  Divider, 
  Card, 
  CardContent 
} from '@mui/material';
import { 
  MdPerson, 
  MdEmail, 
  MdBadge, 
  MdPhone, 
  MdSave 
} from 'react-icons/md';

const Profile = () => {
  const { profile } = useUser();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phone: profile?.phone || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would update the profile here
    setEditing(false);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Profile
      </Typography>
      
      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{  height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main', 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  mb: 2
                }}
              >
                {profile?.displayName?.[0] || 'M'}
              </Avatar>
              
              <Typography variant="h5" fontWeight="bold">
                {profile?.displayName || 'Management User'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textTransform: 'uppercase' }}>
                {profile?.userType || 'Management'}
              </Typography>
              
              <Divider sx={{ my: 2, width: '100%' }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdEmail color="#7428dc" style={{ marginRight: 8 }} />
                <Typography variant="body2">{profile?.email}</Typography>
              </Box>
              
              {profile?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MdPhone color="#7428dc" style={{ marginRight: 8 }} />
                  <Typography variant="body2">{profile?.phone}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Profile Information
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="displayName"
                      value={editing ? formData.displayName : profile?.displayName || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <MdPerson style={{ marginRight: 8, opacity: 0.7 }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={profile?.email || ''}
                      disabled
                      InputProps={{
                        startAdornment: <MdEmail style={{ marginRight: 8, opacity: 0.7 }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={profile?.userType ? profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1) : 'Management'}
                      disabled
                      InputProps={{
                        startAdornment: <MdBadge style={{ marginRight: 8, opacity: 0.7 }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={editing ? formData.phone : profile?.phone || 'Not provided'}
                      onChange={handleChange}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <MdPhone style={{ marginRight: 8, opacity: 0.7 }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    {editing ? (
                      <>
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          onClick={() => setEditing(false)}
                          sx={{ mr: 2, borderRadius: 1 }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          type="submit"
                          startIcon={<MdSave />}
                          // sx={{ borderRadius: 2 }}
                        >
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => setEditing(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
