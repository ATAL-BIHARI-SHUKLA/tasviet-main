import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { Link } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Card, 
  CardContent,
  CircularProgress 
} from "@mui/material";
import { 
  Add as MdAdd, 
  FormatListBulleted as MdListAlt, 
  Pending as MdPending, 
  Done as MdDone, 
  AccountCircle as MdAccountCircle 
} from "@mui/icons-material";
import axios from "axios";

export default function UserDashboard() {
  const { profile } = useUser();
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total and per-status counts using server-side filtering
        // Use limit=1 since we only need the pagination.total count, not the actual data
        const [totalRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
          axios.get("https://tasviet.vercel.app/api/employee/my-requests?page=1&limit=1", { withCredentials: true }),
          axios.get("https://tasviet.vercel.app/api/employee/my-requests?page=1&limit=1&status=pending", { withCredentials: true }),
          axios.get("https://tasviet.vercel.app/api/employee/my-requests?page=1&limit=1&status=management_approved", { withCredentials: true }),
          axios.get("https://tasviet.vercel.app/api/employee/my-requests?page=1&limit=1&status=management_rejected", { withCredentials: true }),
        ]);
        
        setStats({
          total: totalRes.data.pagination?.total || 0,
          approved: approvedRes.data.pagination?.total || 0,
          pending: pendingRes.data.pagination?.total || 0,
          rejected: rejectedRes.data.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Failed to fetch request stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 5 }, bgcolor: "background.paper", borderRadius: 4, boxShadow: 3, minHeight: "80vh" }}>
      {/* Header with greeting */}
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", md: "row" }, 
        alignItems: { md: "center" }, 
        justifyContent: { md: "space-between" },
        mb: 4
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: "bold",
              mb: { xs: 0.5, sm: 1 },
              background: "linear-gradient(to right, #7428dc, #670fdb)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.25rem" }
            }}
          >
            Welcome, {profile?.displayName || "Employee"}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            Manage your expense requests and track their status
          </Typography>
        </Box>
        
        <Button
          component={Link}
          to="/user/profile"
          startIcon={<MdAccountCircle />}
          sx={{ 
            mt: { xs: 2, md: 0 },
            color: "#7428dc",
            "&:hover": {
              color: "#670fdb",
              background: "transparent"
            },
            fontSize: { xs: "0.875rem", sm: "1rem" }
          }}
        >
          View Profile
        </Button>
      </Box>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Grid item xs={12} md={6} lg={3}>
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 3, 
              background: "linear-gradient(135deg, #7428dc, #670fdb)",
              color: "white",
              boxShadow: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",color:"white", mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: "1rem", sm: "1.125rem" }, color:"white" }}>
                Total Requests
              </Typography>
              <MdListAlt style={{ fontSize: "1.75rem", opacity: 0.8 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ my: 1, fontSize: { xs: "1.75rem", sm: "2rem" }, color:"white" }}>
              {loading ? "..." : stats.total}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              All time expense requests
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 3,
              boxShadow: 3,
              height: "100%", 
              display: "flex",
              flexDirection: "column",
              borderLeft: "4px solid #4caf50",
              transition: "transform 0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle1" color="text.primary" fontWeight="medium" sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                Approved
              </Typography>
              <MdDone style={{ fontSize: "1.75rem", color: "#4caf50" }} />
            </Box>
            <Typography variant="h4" color="text.primary" fontWeight="bold" sx={{ my: 1, fontSize: { xs: "1.75rem", sm: "2rem" } }}>
              {loading ? "..." : stats.approved}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              Approved requests
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 3,
              boxShadow: 3,
              height: "100%", 
              display: "flex",
              flexDirection: "column",
              borderLeft: "4px solid #ff9800",
              transition: "transform 0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle1" color="text.primary" fontWeight="medium" sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                Pending
              </Typography>
              <MdPending style={{ fontSize: "1.75rem", color: "#ff9800" }} />
            </Box>
            <Typography variant="h4" color="text.primary" fontWeight="bold" sx={{ my: 1, fontSize: { xs: "1.75rem", sm: "2rem" } }}>
              {loading ? "..." : stats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              Awaiting approval
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 3,
              boxShadow: 3,
              height: "100%", 
              display: "flex",
              flexDirection: "column",
              borderLeft: "4px solid #f44336",
              transition: "transform 0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle1" color="text.primary" fontWeight="medium" sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                Rejected
              </Typography>
              <MdListAlt style={{ fontSize: "1.75rem", color: "#f44336" }} />
            </Box>
            <Typography variant="h4" color="text.primary" fontWeight="bold" sx={{ my: 1, fontSize: { xs: "1.75rem", sm: "2rem" } }}>
              {loading ? "..." : stats.rejected}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              Declined requests
            </Typography>
          </Paper>
        </Grid>
      </div>
      
      {/* Quick actions */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          color="text.primary" 
          fontWeight="600" 
          sx={{ mb: 2, fontSize: { xs: "1.125rem", sm: "1.25rem" } }}
        >
          Quick Actions
        </Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <Grid item xs={12} md={6}>
            <Card 
              component={Link} 
              to="/user/create-request"
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: { xs: 2, sm: 3 },
                background: 'linear-gradient(to right, rgba(116,40,220,0.1), rgba(103,15,219,0.1))',
                borderRadius: 3,
                border: '1px solid rgba(116,40,220,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(116,40,220,0.2)',
                  transform: 'scale(1.02)',
                  boxShadow: 2
                },
                transition: 'all 0.3s',
                textDecoration: 'none'
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: '#7428dc', 
                  borderRadius: 1.5, 
                  p: { xs: 1, sm: 1.5 }, 
                  mr: { xs: 2, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MdAdd style={{ fontSize: '1.5rem', color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  color="#7428dc" 
                  fontWeight="600"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Create New Request
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Submit a new expense request
                </Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              component={Link} 
              to="/user/my-requests"
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: { xs: 2, sm: 3 },
                bgcolor: 'grey.50',
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.12)',
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'scale(1.02)',
                  boxShadow: 2
                },
                transition: 'all 0.3s',
                textDecoration: 'none'
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'grey.700', 
                  borderRadius: 1.5, 
                  p: { xs: 1, sm: 1.5 }, 
                  mr: { xs: 2, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MdListAlt style={{ fontSize: '1.5rem', color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  color="text.primary" 
                  fontWeight="600"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  View My Requests
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Check status of your requests
                </Typography>
              </Box>
            </Card>
          </Grid>
        </div>
      </Box>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-pulse bg-[#7428dc]/20 rounded-full h-12 w-12"></div>
        </div>
      ) : stats.total === 0 ? (
        <Paper 
          sx={{ 
            textAlign: 'center', 
            py: { xs: 4, sm: 5 }, 
            px: { xs: 2, sm: 3 }, 
            bgcolor: 'grey.50', 
            borderRadius: 3, 
            border: '1px dashed rgba(0,0,0,0.12)' 
          }}
        >
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 2 }}
          >
            You haven't created any requests yet.
          </Typography>
          <Button
            component={Link}
            to="/user/create-request"
            variant="contained"
            sx={{
              bgcolor: '#7428dc',
              '&:hover': {
                bgcolor: '#670fdb'
              },
              borderRadius: 1.5,
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Create your first request
          </Button>
        </Paper>
      ) : null}
    </Box>
  );
}
