import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Alert
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  Verified as VerifiedIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from "@mui/icons-material";

const primaryColor = "#7428dc";

export default function Profile() {
  const { profile, fetchProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state for editable fields
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    department: "",
    position: ""
  });
  
  // Initialize form data when profile loads or editing starts
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        department: profile.department || "",
        position: profile.position || ""
      });
    }
  }, [profile, isEditing]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
    // Reset form to original values
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        department: profile.department || "",
        position: profile.position || ""
      });
    }
  };
  
  const handleSaveProfile = async () => {
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.put(
        "https://tasviet.vercel.app/api/auth/profile",
        {
          displayName: formData.displayName.trim(),
          phone: formData.phone.trim(),
          department: formData.department.trim(),
          position: formData.position.trim()
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Refresh profile in context
        if (fetchProfile) {
          fetchProfile();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: { xs: 2, sm: 3 },
        bgcolor: "background.paper",
        minHeight: "60vh",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: { xs: 3, sm: 4, md: 5 } }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              width: { xs: 60, sm: 70, md: 80 },
              height: { xs: 60, sm: 70, md: 80 },
              background: "linear-gradient(135deg, #7428dc 0%, #670fdb 100%)",
              boxShadow: 2,
              mr: { xs: 2, sm: 3 },
            }}
          >
            <AccountCircleIcon sx={{ fontSize: { xs: 40, sm: 45, md: 50 } }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(90deg, #7428dc 0%, #670fdb 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.25rem" },
              }}
            >
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your personal information
            </Typography>
          </Box>
        </Box>
        
        {/* Edit/Save/Cancel buttons */}
        <Box>
          {!isEditing ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              sx={{
                borderColor: primaryColor,
                color: primaryColor,
                "&:hover": {
                  borderColor: "#670fdb",
                  bgcolor: "rgba(116, 40, 220, 0.04)"
                }
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={handleCancelEdit}
                color="inherit"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveProfile}
                disabled={loading}
                sx={{
                  bgcolor: primaryColor,
                  "&:hover": { bgcolor: "#670fdb" }
                }}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Success/Error alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 2,
              },
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  display: "flex", 
                  alignItems: "center",
                  color: "#7428dc",
                  mb: 2
                }}
              >
                <BadgeIcon sx={{ mr: 1 }} />
                Personal Information
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Display Name - Editable */}
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <AccountCircleIcon sx={{ color: "#7428dc", mr: 2, mt: isEditing ? 1 : 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Full Name
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      required
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {profile?.displayName || "Not Available"}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Email - Not Editable */}
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <EmailIcon sx={{ color: "#7428dc", mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Email Address {isEditing && <Chip label="Cannot be changed" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {profile?.email || "Not Available"}
                  </Typography>
                </Box>
              </Box>
              
              {/* Phone - Editable */}
              <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                <PhoneIcon sx={{ color: "#7428dc", mr: 2, mt: isEditing ? 1 : 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Phone Number
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {profile?.phone || "Not Available"}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 2,
              },
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  display: "flex", 
                  alignItems: "center",
                  color: "#7428dc",
                  mb: 2
                }}
              >
                <WorkIcon sx={{ mr: 1 }} />
                Work Information
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Department - Editable */}
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <BusinessIcon sx={{ color: "#7428dc", mr: 2, mt: isEditing ? 1 : 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="Enter department"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {profile?.department || "Not Available"}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Position - Editable */}
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <WorkIcon sx={{ color: "#7428dc", mr: 2, mt: isEditing ? 1 : 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Position
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      placeholder="Enter position"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {profile?.position || "Not Available"}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Account Status - Not Editable */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <VerifiedIcon 
                  sx={{ 
                    color: profile?.verificationStatus === 'verified' ? 'success.main' : 'warning.main', 
                    mr: 2 
                  }} 
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Account Status
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ 
                        color: profile?.verificationStatus === 'verified' 
                          ? 'success.main' 
                          : profile?.verificationStatus === 'rejected'
                            ? 'error.main'
                            : 'warning.main',
                        mr: 1
                      }}
                    >
                      {profile?.verificationStatus || "Not Available"}
                    </Typography>
                    {profile?.verificationStatus === 'verified' && (
                      <Chip 
                        label="Verified" 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </div>
    </Paper>
  );
}
