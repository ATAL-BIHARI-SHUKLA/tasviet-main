import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Menu,
  Badge,
  Avatar,
  Tooltip,
  ListItemIcon,
  ListItemText,
  ListItem,
  List,
  Collapse,
  FormGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import BadgeIcon from '@mui/icons-material/Badge';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
  });

  const open = Boolean(anchorEl);
  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      try {
        const res = await axios.get(`https://tasviet.vercel.app/api/management/employees/${id}?page=1&limit=10`, { 
          withCredentials: true 
        });
        setEmployee(res.data.employee);
        setRequests(res.data.requests || []);
        setStats(res.data.stats || {});
        setRowCount(res.data.pagination?.total || 0);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch employee details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeInfo();
  }, [id]);

  // Re-fetch requests when pagination changes (skip initial load handled above)
  useEffect(() => {
    if (!employee) return; // Skip until initial load is done
    const fetchRequests = async () => {
      try {
        const res = await axios.get(`https://tasviet.vercel.app/api/management/employees/${id}?page=${paginationModel.page + 1}&limit=${paginationModel.pageSize}`, { 
          withCredentials: true 
        });
        setRequests(res.data.requests || []);
        setStats(res.data.stats || {});
        setRowCount(res.data.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to fetch requests page:', err);
      }
    };
    fetchRequests();
  }, [id, paginationModel]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return { bg: 'warning.light', text: 'warning.dark' };
      case 'admin_reviewed':
        return { bg: 'info.light', text: 'info.dark' };
      case 'management_approved':
        return { bg: 'success.light', text: 'success.dark' };
      case 'management_rejected':
        return { bg: 'error.light', text: 'error.dark' };
      case 'payment_processed':
        return { bg: 'primary.light', text: 'primary.dark' };
      default:
        return { bg: 'grey.200', text: 'grey.800' };
    }
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
    });
    setAnchorEl(null);
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'admin_reviewed', label: 'Admin Reviewed' },
    { value: 'management_approved', label: 'Approved' },
    { value: 'management_rejected', label: 'Rejected' },
    { value: 'payment_processed', label: 'Payment Processed' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Employee not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/management/employee-stats')}
          sx={{ mt: 2 }}
        >
          Return to Employee List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      {/* Back button */}
      <Button 
        startIcon={<ArrowBackIcon sx={{ fontSize: { xs: 18, md: 24 } }} />}
        onClick={() => navigate('/management/employee-stats')}
        sx={{ 
          mb: { xs: 2, md: 3 },
          fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
          py: { xs: 0.5, md: 1 }
        }}
      >
        Back to Employee List
      </Button>
      
      {/* Employee Profile Card */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 }, 
          mb: { xs: 2, md: 3 }, 
          borderRadius: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4} md={3}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: { xs: 'center', sm: 'flex-start' },
              mb: { xs: 2, sm: 0 }
            }}>
              <Avatar 
                sx={{ 
                  width: { xs: 80, sm: 100, md: 120 }, 
                  height: { xs: 80, sm: 100, md: 120 }, 
                  fontSize: { xs: 30, sm: 40, md: 50 },
                  mb: { xs: 1, sm: 1.5, md: 2 },
                  bgcolor: (theme) => `${theme.palette.primary.main}60`,
                  color: 'primary.dark',
                }}
              >
                {employee.displayName?.[0] || 'E'}
              </Avatar>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={8} md={9}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                mb: { xs: 1, sm: 1.5 }
              }}
            >
              {employee.displayName || 'Employee'}
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EmailIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={employee.email}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  
                  {employee.phone && (
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PhoneIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={employee.phone}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <List dense disablePadding>
                  {employee.department && (
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <BusinessCenterIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Department" 
                        secondary={employee.department}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  )}
                  
                  {employee.position && (
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <BadgeIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Position" 
                        secondary={employee.position}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  )}
                  
                  {employee.hireDate && (
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CalendarTodayIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Hire Date" 
                        secondary={formatDate(employee.hireDate)}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box display="flex" alignItems="center">
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.dark', 
                    mr: 1.5,
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 }
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
                    Total Requests
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                    {stats.totalRequests || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
            //   borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box display="flex" alignItems="center">
                <Avatar 
                  sx={{ 
                    bgcolor: 'info.light', 
                    color: 'info.dark', 
                    mr: 1.5,
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 }
                  }}
                >
                  <HourglassEmptyIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
                    Pending Review
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                    {stats.pendingRequests || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
            //   borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box display="flex" alignItems="center">
                <Avatar 
                  sx={{ 
                    bgcolor: 'success.light', 
                    color: 'success.dark', 
                    mr: 1.5,
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 }
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
                    Approved
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                    {stats.approvedRequests || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
            //   borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box display="flex" alignItems="center">
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.dark', 
                    mr: 1.5,
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 }
                  }}
                >
                  <CurrencyRupeeIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
                    Total Approved
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                    ₹${stats.totalApprovedAmount?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Requests Table */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 }, 
        //   borderRadius: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1.5, md: 2 } }}>
          <Typography 
            variant="h5" 
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}
          >
            Request History
          </Typography>
          
          <Box>
            <Button
              size="small"
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              sx={{ textTransform: 'none' }}
            >
              Filters
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleFilterClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 1,
                sx: { 
                  width: { xs: 250, sm: 300 },
                  borderRadius: 1,
                  p: { xs: 1.5, md: 2 },
                  mt: 1
                }
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">Filters</Typography>
                <IconButton size="small" onClick={handleResetFilters}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                sx={{ mb: 2 }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                select
                fullWidth
                size="small"
                label="Date Range"
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                sx={{ mb: 2 }}
              >
                {dateRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Amount"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Amount"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                />
              </Box>
              
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleFilterClose}
              >
                Apply Filters
              </Button>
            </Menu>
          </Box>
        </Box>
        
        {requests.length > 0 ? (
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={requests.map(r => ({
                id: r._id,
                title: r.title,
                date: new Date(r.createdAt),
                amount: (r.adminReview?.adjustedAmount !== undefined && r.adminReview?.adjustedAmount !== null) 
                  ? Number(r.adminReview.adjustedAmount) 
                  : (r.totalAmountRequested !== undefined && r.totalAmountRequested !== null)
                    ? Number(r.totalAmountRequested)
                    : 0,
                status: r.status,
                reviewedAt: r.adminReview?.reviewedAt ? new Date(r.adminReview.reviewedAt) : null,
                approvedAt: r.managementDecision?.decidedAt ? new Date(r.managementDecision.decidedAt) : null,
              }))}
              columns={[
                { field: 'title', headerName: 'Request', flex: 1 },
                { 
                  field: 'date', 
                  headerName: 'Date', 
                  width: 130,
                  valueFormatter: (value) => formatDate(value)
                },
                {
                  field: 'amount',
                  headerName: 'Amount',
                  width: 120,
                  valueFormatter: (value) => value !== null && value !== undefined ? `₹${value.toFixed(2)}` : '₹0.00'
                },
                {
                  field: 'status',
                  headerName: 'Status',
                  width: 180,
                  renderCell: (params) => {
                    const { bg, text } = getStatusColor(params.value);
                    return (
                      <Chip
                        label={formatStatus(params.value)}
                        size="small"
                        sx={{
                          bgcolor: bg,
                          color: text,
                          fontWeight: 'medium',
                        }}
                      />
                    );
                  }
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  renderCell: (params) => (
                    <Tooltip title="View request details">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: { xs: 16, md: 20 } }} />}
                        component={Link}
                        to={`/management/requests/${params.id}`}
                        sx={{ 
                          borderRadius: 1,
                          fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8125rem' },
                          py: { xs: 0.5, md: 0.75 }
                        }}
                      >
                        View
                      </Button>
                    </Tooltip>
                  )
                }
              ]}
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              sortingMode="client"
              initialState={{
                sorting: {
                  sortModel: [{ field: 'date', sort: 'desc' }],
                },
              }}
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'background.default',
                  borderRadius: 0,
                },
                border: 'none',
                borderRadius: 0,
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-footerContainer': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                },
                '& .MuiTablePagination-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
                  fontWeight: 'bold'
                }
              }}
            />
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No requests found matching the current filters.
            </Typography>
            {Object.values(filters).some(v => v !== '' && v !== 'all') && (
              <Button 
                variant="text" 
                size="small" 
                onClick={handleResetFilters}
                sx={{ mt: 1 }}
              >
                Reset Filters
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EmployeeDetails;
