import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Paper, CircularProgress, Button, Chip, Stack, Card, CardContent, CardActions,
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment, IconButton,
  Divider, Pagination, Snackbar, Alert as MuiAlert
} from "@mui/material";
import { 
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon, 
  Clear as ClearIcon,
  CurrencyRupee,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon
} from "@mui/icons-material";
import { Link } from "react-router-dom";

const primaryColor = "#7428dc";
const primaryColorDark = "#670fdb";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  
  // Filter states
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showFilters, setShowFilters] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  
  const fetchRequests = (filters = {}) => {
    setLoading(true);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.employeeId) params.append("employeeId", filters.employeeId);
    if (filters.search) params.append("search", filters.search);
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.month) params.append("month", filters.month);
    if (filters.year) params.append("year", filters.year);
    
    // Add pagination params
    params.append("page", filters.page || pagination.page);
    params.append("limit", filters.limit || pagination.limit);
    
    axios.get(`https://tasviet.vercel.app/api/account/requests?${params.toString()}`, { withCredentials: true })
      .then(res => {
        setRequests(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(err => {
        console.error("Error fetching requests:", err);
        setRequests([]);
        setPagination({ total: 0, page: 1, limit: 10, pages: 1 });
      })
      .finally(() => setLoading(false));
  };
  
  const fetchEmployees = () => {
    axios.get("https://tasviet.vercel.app/api/account/employees", { withCredentials: true })
      .then(res => setEmployees(res.data))
      .catch(err => {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      });
  };
  
  const handleApplyFilters = () => {
    const filters = {};
    
    if (employeeFilter) filters.employeeId = employeeFilter;
    if (searchQuery) filters.search = searchQuery;
    
    // Handle date filters
    if (dateFrom) filters.from = dateFrom;
    if (dateTo) filters.to = dateTo;
    
    // Handle month/year filters
    if (month && year) {
      filters.month = month;
      filters.year = year;
    } else if (year) {
      filters.year = year;
    }
    
    // Reset to page 1 when applying new filters
    filters.page = 1;
    
    fetchRequests(filters);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    fetchRequests({ 
      employeeId: employeeFilter,
      search: searchQuery,
      from: dateFrom,
      to: dateTo,
      month: month,
      year: year,
      page: newPage
    });
  };
  
  const handleClearFilters = () => {
    setEmployeeFilter("");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setMonth("");
    setYear(new Date().getFullYear().toString());
    fetchRequests();
  };
  
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };
  
  const handleDownloadBillRecords = async () => {
    setDownloadLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeFilter) params.append("employeeId", employeeFilter);
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      if (month && year) { params.append("month", month); params.append("year", year); }
      else if (year) params.append("year", year);

      const res = await axios.get(
        `https://tasviet.vercel.app/api/account/export-bills?${params.toString()}`,
        { withCredentials: true, responseType: "blob" }
      );

      // Extract filename from content-disposition header or use default
      const disposition = res.headers["content-disposition"];
      let filename = "bill_records.csv";
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*?)\1(;|$)/);
        if (match && match[2]) filename = match[2];
      }

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: "Bill records downloaded successfully", severity: "success" });
    } catch (err) {
      console.error("Download failed:", err);
      const msg = err.response?.status === 404
        ? "No bill records found for the selected filters"
        : "Failed to download bill records";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: "background.paper" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap" }}>
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
          Pending Requests
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            startIcon={downloadLoading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadBillRecords}
            disabled={downloadLoading}
            variant="outlined"
            sx={{
              color: primaryColor,
              borderColor: primaryColor,
              "&:hover": { bgcolor: `${primaryColor}10`, borderColor: primaryColorDark }
            }}
          >
            Download Bills
          </Button>
          <Button
            startIcon={showFilters ? <ClearIcon /> : <FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              color: primaryColor,
              "&:hover": { bgcolor: `${primaryColor}10` }
            }}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </Box>
      </Box>
      
      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by title or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearch}
          sx={{ mb: showFilters ? 2 : 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchQuery("")} size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    label="Employee"
                  >
                    <MenuItem value="">All Employees</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="From Date"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="To Date"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
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
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{ 
                    flex: 1,
                    bgcolor: primaryColor, 
                    "&:hover": { bgcolor: primaryColorDark } 
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ 
                    color: primaryColor, 
                    borderColor: primaryColor,
                    "&:hover": { bgcolor: `${primaryColor}10`, borderColor: primaryColorDark } 
                  }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {loading ? (
        <Box sx={{ textAlign: "center", py: 5 }}>
          <CircularProgress sx={{ color: primaryColor }} />
        </Box>
      ) : (
        <Stack spacing={2}>
          {requests.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>No pending requests found</Typography>
              <Typography color="text.secondary" variant="body2">
                Try adjusting your filters or check back later
              </Typography>
            </Box>
          ) : (
            requests.map(request => (
              <Card key={request.id} sx={{ 
                borderRadius: 2, 
                boxShadow: 2,
                borderLeft: `4px solid ${primaryColor}`,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 3
                }
              }}>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4  gap-2" >
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" fontWeight={600}>
                        {request.title || `Request #${request.id?.slice(-6)}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {request.description?.length > 100 
                          ? `${request.description.slice(0, 100)}...` 
                          : request.description}
                      </Typography>
                      
                      <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 2, flexWrap: "wrap" }}>
                        <Chip
                          label="Management Approved"
                          color="warning"
                          sx={{ mr: 2 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DateRangeIcon fontSize="small" sx={{ color: primaryColor }} />
                          <Typography variant="body2" color="text.secondary">
                            {request.tripStartDate 
                              ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '-'} - {request.tripEndDate 
                              ? new Date(request.tripEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '-'}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${request.tripStartDate && request.tripEndDate 
                            ? Math.ceil((new Date(request.tripEndDate) - new Date(request.tripStartDate)) / (1000 * 60 * 60 * 24)) + 1 
                            : 1} days`}
                          size="small"
                          sx={{ bgcolor: '#7428dc15', color: '#7428dc' }}
                        />
                        <Chip
                          label={`${request.expenses?.length || 0} expenses`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ 
                      display: "flex", 
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", md: "flex-end" }
                    }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Employee:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {request.employee?.displayName}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                        <CurrencyRupee fontSize="small" sx={{ color: primaryColor }} />
                        <Typography variant="h6" fontWeight={600} sx={{ color: primaryColor }}>
                          ₹{request.totalAmountRequested?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </div>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end" }}>
                  <Button
                    component={Link}
                    to={`/account/requests/${request.id}`}
                    endIcon={<ArrowForwardIcon />}
                    variant="outlined"
                    sx={{
                      color: primaryColor,
                      borderColor: primaryColor,
                      "&:hover": { bgcolor: `${primaryColor}10`, borderColor: primaryColorDark }
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
          
          {/* Pagination */}
          {!loading && requests.length > 0 && pagination.pages > 1 && (
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
          {!loading && requests.length > 0 && (
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1, display: 'block' }}>
              Showing {requests.length} of {pagination.total} requests (Page {pagination.page} of {pagination.pages})
            </Typography>
          )}
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
}