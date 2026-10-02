import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { 
  Box, Typography, Paper, Avatar, Button, TextField, Grid, Divider, 
  Card, CardContent, Alert, Snackbar, IconButton, InputAdornment
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Visibility, 
  VisibilityOff 
} from "@mui/icons-material";
import axios from "axios";

const primaryColor = "#7428dc";
const primaryColorDark = "#670fdb";

export default function Profile() {
  const { profile, refreshUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phone: profile?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate password if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to set a new password");
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 8) {
        setError("New password must be at least 8 characters");
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match");
        setLoading(false);
        return;
      }
    }
    
    try {
      // Prepare the update data
      const updateData = {
        displayName: formData.displayName,
        phone: formData.phone
      };
      
      // Add password update if provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // Send update request
      await axios.put(
        'https://tasviet.vercel.app/api/auth/profile/update',
        updateData,
        { withCredentials: true }
      );
      
      // Refresh user data
      await refreshUser();
      
      setSuccess("Profile updated successfully");
      setEditing(false);
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  const startEditing = () => {
    setFormData({
      displayName: profile?.displayName || '',
      phone: profile?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setEditing(true);
    setError(null);
  };
  
  const cancelEditing = () => {
    setEditing(false);
    setError(null);
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(null);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColorDark} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            My Profile
          </Typography>
          
          {!editing && (
            <Button 
              variant="contained"
              startIcon={<EditIcon />}
              onClick={startEditing}
              sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: primaryColorDark } }}
            >
              Edit Profile
            </Button>
          )}
        </Box>
        
        <Grid container spacing={4}>
          <div className="w-full">
            <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: primaryColor, 
                    width: 120, 
                    height: 120, 
                    fontSize: '3rem',
                    mb: 2,
                    boxShadow: '0 4px 20px rgba(116, 40, 220, 0.25)'
                  }}
                >
                  {profile?.displayName?.[0] || "A"}
                </Avatar>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
                  {profile?.displayName || "Accountant"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profile?.email}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'primary.50', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 2,
                    color: primaryColor,
                    fontWeight: 500
                  }}
                >
                  Accountant
                </Box>
              </CardContent>
            </Card>
          </div>
          
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  {editing ? "Edit Profile Information" : "Profile Information"}
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Display Name"
                        name="displayName"
                        value={editing ? formData.displayName : profile?.displayName || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                        InputProps={{
                          readOnly: !editing,
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={profile?.email || ''}
                        disabled
                        variant="filled"
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
                        variant={editing ? "outlined" : "filled"}
                        InputProps={{
                          readOnly: !editing,
                        }}
                      />
                    </Grid>
                    
                    {editing && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Change Password (Optional)
                            </Typography>
                          </Divider>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Current Password"
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={handleChange}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    edge="end"
                                  >
                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="New Password"
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={handleChange}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    edge="end"
                                  >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Confirm New Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                          <Button 
                            variant="outlined" 
                            onClick={cancelEditing}
                            disabled={loading}
                            sx={{ color: primaryColor, borderColor: primaryColor }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="contained" 
                            startIcon={<SaveIcon />}
                            type="submit"
                            disabled={loading}
                            sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: primaryColorDark } }}
                          >
                            {loading ? "Saving..." : "Save Changes"}
                          </Button>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}