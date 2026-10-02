import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Paper,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';

const API_BASE_URL = "https://tasviet.vercel.app/api/admin";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const navigate = useNavigate();

  const fetchEmployees = (page, pageSize) => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE_URL}/employees`, {
        params: { page: page + 1, limit: pageSize },
        withCredentials: true,
      })
      .then((res) => {
        let data = res.data.employees || [];
        if (!Array.isArray(data)) data = data ? [data] : [];
        setEmployees(data);
        setRowCount(res.data.pagination?.total || data.length);
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Failed to fetch employees')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees(paginationModel.page, paginationModel.pageSize);
  }, [paginationModel]);

  const handleViewEmployee = (id) => {
    navigate(`/admin/employees/${id}`);
  };

  const columns = [
    { 
      field: 'displayName', 
      headerName: 'Name', 
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography fontWeight={500}>{params.value}</Typography>
        </Box>
      )
    },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { 
      field: 'requestCount', 
      headerName: 'Total Requests', 
      flex: 0.7,
      minWidth: 130,
      renderCell: (params) => {
        const requestCount = params.row?.requests?.length || 0;
        return (
          <Chip 
            label={requestCount} 
            color={requestCount > 0 ? 'primary' : 'default'}
            size="small" 
            variant="outlined"
          />
        );
      }
    },
    { 
      field: 'totalAmount', 
      headerName: 'Total Amount', 
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const totalAmount = params.row?.requests?.reduce((sum, r) => sum + (r.totalAmountRequested || 0), 0) || 0;
        return (
          <Typography>
            ₹{totalAmount.toLocaleString()}
          </Typography>
        );
      }
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Tooltip title="View Employee Details">
            <IconButton 
              color="primary" 
              onClick={() => handleViewEmployee(params.row._id)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        );
      }
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
        Employees
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        View all employees and their request statistics
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <DataGrid
              autoHeight
              rows={employees.filter(employee => employee && employee._id)}
              columns={columns}
              getRowId={(row) => row._id || 'unknown'}
              rowCount={rowCount}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              loading={loading}
              slots={{
                toolbar: GridToolbar,
              }}
              disableRowSelectionOnClick
              sx={{ 
                borderRadius: 1,
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Employees;
