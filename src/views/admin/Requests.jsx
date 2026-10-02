
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { 
  Box, 
  Typography, 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const API_BASE_URL = "https://tasviet.vercel.app/api/admin";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ status: "", employee: "", from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const navigate = useNavigate();

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line
  }, []);
  
  // Fetch requests when filters or pagination changes
  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [filters, paginationModel]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`, { params: { page: 1, limit: 1000 }, withCredentials: true });
      setEmployees(res.data.employees || []);
    } catch {
      setEmployees([]);
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.employee) params.employee = filters.employee;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await axios.get(`${API_BASE_URL}/requests/export/csv`, { params, withCredentials: true, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'requests.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch {
      setError("Failed to export CSV");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to first page on filter change
  };

  const columns = [
    // { 
    //   field: '_id', 
    //   headerName: 'Request ID', 
    //   flex: 1, 
    //   minWidth: 120, 
    //   renderCell: (params) => {
    //     if (!params.value) return '-';
    //     return <Typography fontFamily="monospace">{params.value}</Typography>;
    //   }
    // },
    { 
      field: 'employee', 
      headerName: 'Employee', 
      flex: 1, 
      minWidth: 160, 
      renderCell: (params) => {
        if (!params.row || !params.row.employee) return '-';
        return params.row.employee.displayName || '-';
      }
    },
    { 
      field: 'originalAmount', 
      headerName: 'Original Amount', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => {
        if (!params.row || !params.row.expenses) return '₹0';
        const amount = params.row.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        return `₹${amount.toLocaleString()}`;
      }
    },
    { 
      field: 'adjustedAmount', 
      headerName: 'Adjusted Amount', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => {
        if (!params.row || !params.row.adminReview || params.row.adminReview.adjustedAmount === undefined) return '-';
        return `₹${params.row.adminReview.adjustedAmount.toLocaleString()}`;
      }
    },
    { 
      field: 'finalAmount', 
      headerName: 'Final Amount', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => {
        if (!params.row) return '₹0';
        // Use finalAmount if it exists, fall back to totalAmountRequested if not
        const amount = params.row.finalAmount !== undefined ? 
          params.row.finalAmount : 
          params.row.totalAmountRequested;
        return `₹${(amount || 0).toLocaleString()}`;
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => {
        if (!params.row || !params.row.status) return '-';
        return params.row.status.replace(/_/g, ' ');
      }
    },
    { 
      field: 'createdAt', 
      headerName: 'Created', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => {
        if (!params.row || !params.row.createdAt) return '-';
        return new Date(params.row.createdAt).toLocaleDateString();
      }
    },
    { 
      field: 'tripDates', 
      headerName: 'Trip Period', 
      flex: 1.5, 
      minWidth: 180, 
      renderCell: (params) => {
        if (!params.row) return '-';
        const startDate = params.row.tripStartDate;
        const endDate = params.row.tripEndDate;
        if (!startDate || !endDate) return '-';
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{start} - {end}</Typography>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>{days} days</Typography>
          </Box>
        );
      }
    },
    { 
      field: 'expenseCount', 
      headerName: 'Expenses', 
      flex: 0.5, 
      minWidth: 80, 
      renderCell: (params) => {
        if (!params.row || !params.row.expenses) return 0;
        return params.row.expenses.length;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        if (!params.row) return null;
        
        return (
          <Box display="flex" gap={1}>
            <Tooltip title="View Details">
              <IconButton color="primary" onClick={() => navigate(`/admin/requests/${params.row._id}`)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            {params.row.status === 'pending' && (
              <Tooltip title="Review/Edit">
                <IconButton color="success" onClick={() => navigate(`/admin/requests/${params.row._id}?review=1`)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];

  // Function to fetch requests with pagination parameters
  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize
      };
      if (filters.status) params.status = filters.status;
      if (filters.employee) params.employee = filters.employee;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await axios.get(`${API_BASE_URL}/requests`, { params, withCredentials: true });
      setRequests(res.data.requests || []);
      setRowCount(res.data.pagination?.total || 0);
    } catch {
      setError("Failed to fetch requests");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>All Requests</Typography>
      <Typography variant="body1" color="text.secondary" mb={2}>View, filter, and export all expense requests.</Typography>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={filters.status} label="Status" onChange={handleFilterChange}>
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="admin_reviewed">Admin Reviewed</MenuItem>
              <MenuItem value="management_approved">Management Approved</MenuItem>
              <MenuItem value="management_rejected">Management Rejected</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Employee</InputLabel>
            <Select name="employee" value={filters.employee} label="Employee" onChange={handleFilterChange}>
              <MenuItem value="">All Employees</MenuItem>
              {employees.map(emp => (
                <MenuItem key={emp._id} value={emp._id}>{emp.displayName} ({emp.email})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel shrink>From</InputLabel>
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} style={{ border: '1px solid #ccc', borderRadius: 4, padding: 8 }} />
          </FormControl>
          <FormControl size="small">
            <InputLabel shrink>To</InputLabel>
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} style={{ border: '1px solid #ccc', borderRadius: 4, padding: 8 }} />
          </FormControl>
          <Button onClick={handleExport} variant="contained" color="secondary" startIcon={<FileDownloadIcon />} sx={{ minWidth: 120 }}>
            Export
          </Button>
        </Box>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
        ) : (
          <>
            <DataGrid
              autoHeight
              rows={requests.filter(request => request && request._id)} // Ensure we only use valid rows with IDs
              columns={columns}
              getRowId={(row) => row && row._id ? row._id : Math.random().toString(36).substr(2, 9)} // Fallback ID for missing _id
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) => setPaginationModel(model)}
              pageSizeOptions={[10, 25, 50]}
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              pagination
              sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 0, fontSize: 15 }}
              disableRowSelectionOnClick
            />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Showing {requests.length} of {rowCount} requests
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Requests;
