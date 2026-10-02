import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  CircularProgress, 
  Alert,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack
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

const API_BASE_URL = "https://tasviet.vercel.app/api/admin";

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestsError, setRequestsError] = useState(null);
  const [filters, setFilters] = useState({ status: "" });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    // Fetch employee details
    setLoading(true);
    axios.get(`${API_BASE_URL}/employees`, { params: { page: 1, limit: 1000 }, withCredentials: true })
      .then(res => {
        let data = res.data.employees || [];
        if (!Array.isArray(data)) data = data ? [data] : [];
        const found = data.find(e => e._id === id);
        setEmployee(found || null);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to fetch employee'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchEmployeeRequests(paginationModel.page, paginationModel.pageSize);
  }, [id, filters, paginationModel]);

  const fetchEmployeeRequests = (page, pageSize) => {
    setRequestsLoading(true);
    const params = {
      page: page + 1,
      limit: pageSize
    };
    if (filters.status) params.status = filters.status;
    
    axios.get(`${API_BASE_URL}/employee/${id}/requests`, { params, withCredentials: true })
      .then(res => {
        setEmployeeRequests(res.data.requests || []);
        setRowCount(res.data.pagination?.total || 0);
      })
      .catch(err => {
        setRequestsError(err.response?.data?.message || 'Failed to fetch employee requests');
      })
      .finally(() => {
        setRequestsLoading(false);
      });
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      
      const res = await axios.get(`${API_BASE_URL}/employee/${id}/requests/export/csv`, 
        { params, withCredentials: true, responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${employee.displayName.replace(/\s+/g, '_')}_requests.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setRequestsError("Failed to export CSV");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleViewRequest = (requestId) => {
    navigate(`/admin/requests/${requestId}`);
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box p={3}>
      <Alert severity="error">{error}</Alert>
    </Box>
  );
  
  if (!employee) return (
    <Box p={3}>
      <Alert severity="info">Employee not found.</Alert>
    </Box>
  );

  const totalRequestAmount = employee.requests?.reduce((sum, r) => sum + (r.totalAmountRequested || 0), 0) || 0;

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'admin_reviewed': return 'info';
      case 'management_approved': return 'success';
      case 'management_rejected': return 'error';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  const requestColumns = [
    { field: '_id', headerName: 'Request ID', flex: 1, minWidth: 120 },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      minWidth: 160,
      renderCell: (params) => {
        if (!params.value) return <Chip label="Unknown" color="default" size="small" />;
        return (
          <Chip 
            label={params.value.replace(/_/g, ' ')} 
            color={getStatusColor(params.value)} 
            size="small" 
          />
        );
      },
    },
    { 
      field: 'totalAmountRequested', 
      headerName: 'Amount', 
      flex: 1, 
      minWidth: 120,
      renderCell: (params) => {
        if (!params.value) return '-';
        return `₹${params.value.toLocaleString()}`;
      },
    },
    { 
      field: 'createdAt', 
      headerName: 'Date', 
      flex: 1, 
      minWidth: 120,
      renderCell: (params) => {
        if (!params.row || !params.row.createdAt) return '-';
        return new Date(params.row.createdAt).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Tooltip title="View Request Details">
            <IconButton color="primary" onClick={() => handleViewRequest(params.row._id)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <IconButton color="primary" onClick={() => navigate('/admin/employees')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Employee Details
        </Typography>
      </Stack>
      
      <Box mb={4}>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="h6" fontWeight={500}>{employee.displayName}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{employee.email}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListAltIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Requests</Typography>
                      <Typography variant="h6" fontWeight={500}>{employee.requests?.length || 0}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CurrencyRupeeIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6" fontWeight={500}>₹{totalRequestAmount.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600} display="flex" alignItems="center">
                <ReceiptIcon sx={{ mr: 1 }} color="primary" /> Employee Requests
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select 
                    name="status" 
                    value={filters.status}
                    label="Filter by Status"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="admin_reviewed">Admin Reviewed</MenuItem>
                    <MenuItem value="management_approved">Management Approved</MenuItem>
                    <MenuItem value="management_rejected">Management Rejected</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Box>
            </Box>
            
            {requestsError && (
              <Alert severity="error" sx={{ mb: 2 }}>{requestsError}</Alert>
            )}
            
            {requestsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : employeeRequests.length === 0 ? (
              <Alert severity="info">No requests found for this employee.</Alert>
            ) : (
              <DataGrid
                autoHeight
                rows={employeeRequests.filter(request => request && request._id)}
                columns={requestColumns}
                getRowId={(row) => row._id || 'unknown'}
                paginationMode="server"
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                loading={requestsLoading}
                slots={{ toolbar: GridToolbar }}
                disableRowSelectionOnClick
                sx={{ 
                  borderRadius: 1,
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none',
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EmployeeDetails;
