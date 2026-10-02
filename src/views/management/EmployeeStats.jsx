import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Pagination
} from '@mui/material';
import { 
  MdDownload,
  MdPerson,
  MdEmail,
  MdPhone,
  MdCurrencyRupee
} from 'react-icons/md';

const EmployeeStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [aggregates, setAggregates] = useState({
    totalEmployees: 0,
    totalRequests: 0,
    totalBill: 0,
    totalSanctioned: 0,
  });
  
  const fetchStats = (page = pagination.page) => {
    setLoading(true);
    axios.get(`https://tasviet.vercel.app/api/management/employee-stats?page=${page}&limit=${pagination.limit}`, { withCredentials: true })
      .then(res => {
        setStats(res.data.stats || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
        if (res.data.aggregates) setAggregates(res.data.aggregates);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to fetch stats'))
      .finally(() => setLoading(false));
  };
  
  const handlePageChange = (newPage) => {
    fetchStats(newPage);
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    try {
      const res = await axios.get('https://tasviet.vercel.app/api/management/export?type=stats', { 
        responseType: 'blob',
        withCredentials: true
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_stats.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };
  
  // Use aggregates from backend (computed across ALL employees, not just current page)
  const summaryData = {
    totalEmployees: aggregates.totalEmployees,
    totalRequests: aggregates.totalRequests,
    totalAmount: aggregates.totalBill,
    totalSanctioned: aggregates.totalSanctioned
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3, px: { xs: 2, md: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 4,
        gap: 2
      }}>
        <Typography variant="h4" fontWeight="bold">
          Employee Statistics
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
          startIcon={<MdDownload />}
          sx={{ 
            // borderRadius: 3,
            fontWeight: 'bold',
            px: 3,
            py: 1,
            boxShadow: '0 4px 14px rgba(116, 40, 220, 0.25)'
          }}
        >
          Export CSV
        </Button>
      </Box>
      
      {/* Summary Cards */}
      {!loading && !error && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                // borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MdPerson color="#7428dc" size={20} />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    Total Employees
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {summaryData.totalEmployees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                // borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MdCurrencyRupee color="#7428dc" size={20} />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    Total Requests
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {summaryData.totalRequests}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                // borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MdCurrencyRupee color="#7428dc" size={20} />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    Total Amount
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  ₹{summaryData.totalAmount.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                // borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MdCurrencyRupee color="#7428dc" size={20} />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    Total Sanctioned
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main' }}>
                  ₹{summaryData.totalSanctioned.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Employee Stats Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          {error}
        </Alert>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            // borderRadius: 1,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>Employee</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>Contact Info</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }} align="center">Requests</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }} align="right">Total Billed</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }} align="right">Sanctioned</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }} align="right">Pending</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {stats.map(emp => (
                <TableRow 
                  key={emp.employeeId}
                  sx={{ '&:hover': { bgcolor: 'background.default' } }}
                >
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <Tooltip title="Click to view employee details" arrow>
                      <Box 
                        component={Button}
                        onClick={() => {
                          window.location.href = `/management/employees/${emp.employeeId}`;
                        }}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          textTransform: 'none',
                          fontWeight: 'medium',
                          color: 'text.primary',
                          p: 0,
                          '&:hover': {
                            bgcolor: 'transparent',
                            color: 'primary.main'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: { xs: 28, md: 32 }, 
                            height: { xs: 28, md: 32 }, 
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                            mr: 1.5
                          }}
                        >
                          {emp.displayName?.[0] || 'E'}
                        </Box>
                        {emp.displayName}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <MdEmail size={16} style={{ marginRight: 4, opacity: 0.5 }} />
                      <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {emp.email}
                      </Typography>
                    </Box>
                    {emp.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MdPhone size={16} style={{ marginRight: 4, opacity: 0.5 }} />
                        <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {emp.phone}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box 
                      sx={{ 
                        display: 'inline-flex',
                        minWidth: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      {emp.totalRequests}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                    ₹{Number(emp.totalBill).toLocaleString()}
                  </TableCell>
                  
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontWeight: 'medium', 
                      color: 'success.main'
                    }}
                  >
                    ₹{Number(emp.totalSanctioned).toLocaleString()}
                  </TableCell>
                  
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontWeight: 'medium',
                      color: Number(emp.totalPending) > 0 ? 'warning.dark' : 'text.secondary'
                    }}
                  >
                    ₹{Number(emp.totalPending).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                    No employee data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {!loading && stats.length > 0 && pagination.pages > 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(e, page) => handlePageChange(page)}
                color="primary"
                showFirstButton
                showLastButton
                size="medium"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Showing {stats.length} of {pagination.total} employees (Page {pagination.page} of {pagination.pages})
              </Typography>
            </Box>
          )}
        </TableContainer>
      )}
    </Box>
  );
};

export default EmployeeStats;
