import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Box, 
  Paper, 
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  MdCurrencyRupee, 
  MdAssignment, 
  MdPerson, 
  MdTaskAlt
} from 'react-icons/md';
import api from '../../lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmountApproved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch per-status counts using server-side filtering
        // Use limit=1 since we only need pagination.total count
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          api.get('/management/requests?page=1&limit=1'),
          api.get('/management/requests?page=1&limit=1&status=management_approved'),
          api.get('/management/requests?page=1&limit=1&status=management_rejected'),
        ]);
        
        // For total approved amount, fetch all approved requests with their amounts
        // Use a large limit to get all for sum calculation
        const approvedFullRes = await api.get('/management/requests?status=management_approved&page=1&limit=10000');
        const approvedRequests = approvedFullRes.data.requests || [];
        const totalAmount = approvedRequests.reduce(
          (sum, req) => sum + (req.totalAmount || req.totalAmountRequested || 0), 0
        );
        
        setStats({
          pendingRequests: pendingRes.data.pagination?.total || 0,
          approvedRequests: approvedRes.data.pagination?.total || 0,
          rejectedRequests: rejectedRes.data.pagination?.total || 0,
          totalAmountApproved: totalAmount
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          borderRadius: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 2 } }}>
            <Box
              sx={{
                p: { xs: 1, md: 1.5 },
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}15`,
                color: color,
                mr: { xs: 1.5, md: 2 },
                width: { xs: 32, sm: 36, md: 40 },
                height: { xs: 32, sm: 36, md: 40 }
              }}
            >
              {icon}
            </Box>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              fontWeight={500} 
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              {title}
            </Typography>
          </Box>
          <Typography 
            variant="h4" 
            color="text.primary" 
            fontWeight={600}
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
          >
            {typeof value === 'number' && value.toLocaleString()}
            {typeof value === 'string' && value}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: '1200px', mx: 'auto' }}>
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          mb: { xs: 2, md: 3 }, 
          fontWeight: 600, 
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          color: 'text.primary'
        }}
      >
        Management Dashboard
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress color="primary" size={32} thickness={3} />
        </Box>
      ) : (
        <>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2.5, md: 4 } }}>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard 
                title="Pending Requests" 
                value={stats.pendingRequests} 
                icon={<MdAssignment size={20} />}
                color="#ED6C02" 
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard 
                title="Approved Requests" 
                value={stats.approvedRequests} 
                icon={<MdTaskAlt size={20} />}
                color="#2E7D32" 
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard 
                title="Rejected Requests" 
                value={stats.rejectedRequests}
                icon={<MdAssignment size={20} />}
                color="#D32F2F" 
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard 
                title="Total Approved" 
                value={`₹${stats.totalAmountApproved.toFixed(2)}`}
                icon={<MdCurrencyRupee size={20} />}
                color="#0288D1" 
              />
            </Grid>
          </Grid>

          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 }, 
              mb: { xs: 2.5, md: 4 },
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: { xs: 1.5, md: 2 }, 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
              }}
            >
              Quick Actions
            </Typography>
            <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
            <Typography 
              variant="body1" 
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Welcome to the Management Dashboard. Here you can:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <Typography 
                component="li" 
                variant="body1" 
                sx={{ 
                  mt: { xs: 0.75, md: 1 }, 
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: 'text.secondary'
                }}
              >
                Review and approve/reject expense requests that have been processed by admin
              </Typography>
              <Typography 
                component="li" 
                variant="body1" 
                sx={{ 
                  mt: { xs: 0.75, md: 1 }, 
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: 'text.secondary'
                }}
              >
                View employee statistics and expense patterns
              </Typography>
              <Typography 
                component="li" 
                variant="body1" 
                sx={{ 
                  mt: { xs: 0.75, md: 1 }, 
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: 'text.secondary'
                }}
              >
                Track approved expenses ready for payment processing
              </Typography>
              <Typography 
                component="li" 
                variant="body1" 
                sx={{ 
                  mt: { xs: 0.75, md: 1 }, 
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: 'text.secondary'
                }}
              >
                Generate reports on expenses and employee spending
              </Typography>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
