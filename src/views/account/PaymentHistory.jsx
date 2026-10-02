import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Paper, CircularProgress, Stack, Card, CardContent, Chip,
  Grid, TextField, MenuItem, Button, IconButton, Tooltip, FormControl, 
  InputLabel, Select, Divider, CardActions, Pagination
} from "@mui/material";
import { 
  FilterAlt as FilterIcon, 
  Download as DownloadIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AccessTime as AccessTimeIcon
} from "@mui/icons-material";
import { Link } from "react-router-dom";

const primaryColor = "#7428dc";
const primaryColorDark = "#670fdb";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmountPaid: 0,
    monthlyData: []
  });

  // Pagination states
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  // Filter states
  const [filters, setFilters] = useState({
    employeeId: "",
    year: new Date().getFullYear(),
    month: "",
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load employees for filter dropdown
  useEffect(() => {
    axios.get("https://tasviet.vercel.app/api/account/employees", { withCredentials: true })
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Failed to fetch employees", err));
  }, []);

  // Load payment history with applied filters
  useEffect(() => {
    setLoading(true);
    
    // Build query params from filters
    const params = new URLSearchParams();
    if (filters.employeeId) params.append("employeeId", filters.employeeId);
    if (filters.year) params.append("year", filters.year);
    if (filters.month) params.append("month", filters.month);
    params.append("page", filters.page);
    params.append("limit", filters.limit);
    
    axios.get(`https://tasviet.vercel.app/api/account/payment-history?${params.toString()}`, { withCredentials: true })
      .then(res => {
        setPayments(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => {
        setPayments([]);
        setPagination({ total: 0, page: 1, limit: 10, pages: 1 });
      })
      .finally(() => setLoading(false));
      
    // Get payment stats with the same year filter
    if (filters.year) {
      axios.get(`https://tasviet.vercel.app/api/account/payment-stats?year=${filters.year}`, { withCredentials: true })
        .then(res => setStats(res.data))
        .catch(err => console.error("Failed to fetch payment stats", err));
    }
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // Reset to page 1 when filters change
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({
      employeeId: "",
      year: new Date().getFullYear(),
      month: "",
      page: 1,
      limit: 10
    });
  };

  const exportPayments = (format) => {
    setExportLoading(true);
    
    let url = `https://tasviet.vercel.app/api/account/export`;
    const params = new URLSearchParams();
    
    if (filters.employeeId) params.append("employeeId", filters.employeeId);
    if (filters.year) params.append("year", filters.year);
    if (filters.month) params.append("month", filters.month);
    
    // If format is specified, use the format-specific endpoint
    if (format) {
      url = `https://tasviet.vercel.app/api/account/export/${format}?${params.toString()}`;
    } else {
      url = `https://tasviet.vercel.app/api/account/export?${params.toString()}`;
    }
    
    // Open download in new tab
    window.open(url, '_blank');
    setExportLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div>
      <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: "background.paper", mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColorDark} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Payment History
          </Typography>
          <Box>
            <Tooltip title="Filter">
              <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton 
                onClick={() => exportPayments()} 
                color="primary" 
                disabled={exportLoading}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: `${primaryColor}10`, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Total Payments</Typography>
                <Typography variant="h5" fontWeight={600} color={primaryColor}>{stats.totalPayments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: `${primaryColor}10`, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="h5" fontWeight={600} color={primaryColor}>
                  {formatCurrency(stats.totalAmountPaid)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: `${primaryColor}10`, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Current Month</Typography>
                <Typography variant="h5" fontWeight={600} color={primaryColor}>
                  {filters.month ? 
                    formatCurrency(stats.monthlyData.find(m => m.month === parseInt(filters.month))?.amount || 0) : 
                    formatCurrency(stats.monthlyData.find(m => m.month === new Date().getMonth() + 1)?.amount || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: `${primaryColor}10`, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Current Year</Typography>
                <Typography variant="h5" fontWeight={600} color={primaryColor}>
                  {formatCurrency(stats.monthlyData.reduce((sum, month) => sum + month.amount, 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </div>

        {/* Filters */}
        {showFilters && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Filter Payments</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="employee-label">Employee</InputLabel>
                  <Select
                    labelId="employee-label"
                    id="employeeId"
                    name="employeeId"
                    value={filters.employeeId}
                    onChange={handleFilterChange}
                    label="Employee"
                  >
                    <MenuItem value="">All Employees</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp._id} value={emp._id}>{emp.displayName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Year"
                  type="number"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 2020, max: 2050 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="month-label">Month</InputLabel>
                  <Select
                    labelId="month-label"
                    id="month"
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    label="Month"
                  >
                    <MenuItem value="">All Months</MenuItem>
                    <MenuItem value="1">January</MenuItem>
                    <MenuItem value="2">February</MenuItem>
                    <MenuItem value="3">March</MenuItem>
                    <MenuItem value="4">April</MenuItem>
                    <MenuItem value="5">May</MenuItem>
                    <MenuItem value="6">June</MenuItem>
                    <MenuItem value="7">July</MenuItem>
                    <MenuItem value="8">August</MenuItem>
                    <MenuItem value="9">September</MenuItem>
                    <MenuItem value="10">October</MenuItem>
                    <MenuItem value="11">November</MenuItem>
                    <MenuItem value="12">December</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button 
                  variant="outlined" 
                  onClick={resetFilters}
                  sx={{ height: "100%" }}
                  fullWidth
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <CircularProgress sx={{ color: primaryColor }} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {payments.length === 0 ? (
              <Typography color="text.secondary">No payments found for the selected criteria.</Typography>
            ) : (
              payments.map(payment => (
                <Card key={payment.id || payment._id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {payment.title || `Request #${(payment.id || payment._id).slice(-6)}`}
                    </Typography>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <PersonIcon sx={{ color: primaryColor, mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Employee
                            </Typography>
                            <Typography variant="body2">
                              {payment.employee?.displayName || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <ReceiptIcon sx={{ color: primaryColor, mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Amount
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(payment.totalAmountRequested)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <CreditCardIcon sx={{ color: primaryColor, mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Payment Method
                            </Typography>
                            <Typography variant="body2">
                              {payment.payment?.method === 'bank_transfer' ? 'Bank Transfer' : 
                               payment.payment?.method === 'upi' ? 'UPI' : 
                               payment.payment?.method === 'cash' ? 'Cash' : 
                               payment.payment?.method === 'check' ? 'Check' : 
                               payment.payment?.method === 'other' ? 'Other' : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <AccessTimeIcon sx={{ color: primaryColor, mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Paid On
                            </Typography>
                            <Typography variant="body2">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 
                               payment.payment?.processedAt ? new Date(payment.payment.processedAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </div>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                    <Chip 
                      label="PAID" 
                      color="success" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Button 
                      component={Link} 
                      to={`/account/requests/${payment.id || payment._id}`}
                      size="small"
                      sx={{ color: primaryColor }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              ))
            )}
            
            {/* Pagination */}
            {!loading && payments.length > 0 && pagination.pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={(e, page) => handlePageChange(page)}
                  color="primary"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: 'text.secondary',
                    },
                    '& .MuiPaginationItem-root.Mui-selected': {
                      bgcolor: primaryColor,
                      color: 'white',
                      '&:hover': {
                        bgcolor: primaryColorDark,
                      }
                    }
                  }}
                />
              </Box>
            )}
            
            {/* Results info */}
            {!loading && payments.length > 0 && (
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1, display: 'block' }}>
                Showing {payments.length} of {pagination.total} payments (Page {pagination.page} of {pagination.pages})
              </Typography>
            )}
          </Stack>
        )}
      </Paper>
    </div>
  );
}