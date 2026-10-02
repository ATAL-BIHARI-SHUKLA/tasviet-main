import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  Pagination
} from '@mui/material';
import { 
  MdSearch, 
  MdFilterList, 
  MdRemoveRedEye,
  MdCheck,
  MdClose,
  MdAccessTime,
  MdDateRange
} from 'react-icons/md';

const getStatusColor = (status) => {
  switch(status) {
    case 'admin_reviewed':
      return { bg: 'info.light', color: 'info.dark' };
    case 'management_approved':
      return { bg: 'success.light', color: 'success.dark' };
    case 'management_rejected':
      return { bg: 'error.light', color: 'error.dark' };
    case 'paid':
      return { bg: 'success.main', color: 'white' };
    default:
      return { bg: 'warning.light', color: 'warning.dark' };
  }
};

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  const fetchRequests = (page = pagination.page, currentFilters = filters) => {
    setLoading(true);
    const params = {
      ...currentFilters,
      page,
      limit: pagination.limit
    };
    
    axios.get(`https://tasviet.vercel.app/api/management/requests`, { params, withCredentials: true })
      .then(res => {
        setRequests(res.data.requests || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to fetch requests'))
      .finally(() => setLoading(false));
  };
  
  const handlePageChange = (newPage) => {
    fetchRequests(newPage);
  };
  
  // Apply filters or page change — pass new filters directly to avoid stale state
  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchRequests(1, updatedFilters); // Reset to first page when filters change
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };
  
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };
  
  const getTripDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Expense Requests
      </Typography>
      
      {/* Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 4, 
          // borderRadius: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <TextField
          placeholder="Search by title or description"
          variant="outlined"
          fullWidth
          value={filters.search}
          onChange={e => {
            const newSearch = e.target.value;
            handleFilterChange({ search: newSearch });
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: { md: 300 },
            '& .MuiOutlinedInput-root': {
              // borderRadius: 3
            }
          }}
        />
        
        <TextField
          select
          label="Filter by Status"
          value={filters.status}
          onChange={e => handleFilterChange({ status: e.target.value })}
          fullWidth
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdFilterList />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: { md: 250 },
            '& .MuiOutlinedInput-root': {
              // borderRadius: 3
            }
          }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="admin_reviewed">Admin Reviewed</MenuItem>
          <MenuItem value="management_approved">Approved</MenuItem>
          <MenuItem value="management_rejected">Rejected</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
        </TextField>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{  boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          {error}
        </Alert>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            // borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Trip Period</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Expenses</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {requests.map(r => {
                const statusStyles = getStatusColor(r.status);
                return (
                  <TableRow 
                    key={r._id}
                    sx={{ '&:hover': { bgcolor: 'background.default' } }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {r.title}
                    </TableCell>
                    <TableCell>
                      {r.employee?.id ? (
                        <Tooltip title="Click to view employee details" arrow>
                          <Button
                            onClick={() => {
                              window.location.href = `/management/employees/${r.employee?.id}`;
                            }}
                            sx={{ 
                              p: 0, 
                              textTransform: 'none',
                              fontWeight: 'normal',
                              color: 'primary.main',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              '&:hover': {
                                bgcolor: 'transparent',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {r.employee?.name || r.employee?.email}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {r.employee?.name || r.employee?.email || 'Unknown'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={r.status ? r.status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}
                        size="small"
                        sx={{ 
                          bgcolor: statusStyles.bg,
                          color: statusStyles.color,
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      ₹{r.totalAmount || r.totalAmountRequested}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MdDateRange size={16} style={{ opacity: 0.5 }} />
                          <Typography variant="body2">
                            {formatDateRange(r.tripStartDate, r.tripEndDate)}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${getTripDuration(r.tripStartDate, r.tripEndDate)} days`}
                          size="small"
                          sx={{ 
                            mt: 0.5, 
                            width: 'fit-content',
                            bgcolor: '#7428dc15', 
                            color: '#7428dc',
                            fontSize: '0.65rem'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${r.expenses?.length || 0} items`}
                        size="small"
                        variant="outlined"
                        sx={{ color: 'text.secondary' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        to={`/management/requests/${r._id}`}
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<MdRemoveRedEye />}
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 'medium'
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                    No requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {!loading && requests.length > 0 && pagination.pages > 1 && (
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
                Showing {requests.length} of {pagination.total} requests (Page {pagination.page} of {pagination.pages})
              </Typography>
            </Box>
          )}
        </TableContainer>
      )}
    </Box>
  );
};

export default Requests;
