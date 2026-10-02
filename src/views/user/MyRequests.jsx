import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// Define theme colors for consistency
const primaryColor = "#7428dc";
const primaryColorDark = "#670fdb";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Pagination,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  DateRange as DateRangeIcon,
  Receipt as ReceiptIcon
} from "@mui/icons-material";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  const fetchRequests = async (page = 1, currentFilter = filter, currentSearch = searchTerm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit });
      if (currentFilter && currentFilter !== 'all') params.append('status', currentFilter);
      if (currentSearch) params.append('search', currentSearch);
      
      const response = await axios.get(`https://tasviet.vercel.app/api/employee/my-requests?${params.toString()}`, { withCredentials: true });
      setRequests(response.data.requests || []);
      setPagination(response.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
      setPagination({ total: 0, page: 1, limit: 10, pages: 1 });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage) => {
    fetchRequests(newPage, filter, searchTerm);
  };

  useEffect(() => {
    fetchRequests(1, filter, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filter changes (reset to page 1)
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchRequests(1, newFilter, searchTerm);
  };

  // Debounced re-fetch when search changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRequests(1, filter, searchTerm);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const getStatusIcon = (status) => {
    switch(status) {
      case "approved": return <CheckCircleIcon fontSize="small" color="success" />;
      case "pending": return <PendingActionsIcon fontSize="small" color="warning" />;
      case "rejected": return <CancelIcon fontSize="small" color="error" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
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
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: { xs: 2, sm: 3 },
        bgcolor: "background.paper",
        minHeight: "70vh",
      }}
    >
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", md: "row" }, 
        alignItems: { xs: "flex-start", md: "center" }, 
        justifyContent: "space-between", 
        mb: { xs: 3, md: 4 }
      }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: { xs: 2, md: 0 },
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColorDark} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" }
          }}
        >
          My Expense Requests
        </Typography>
        
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          width: { xs: "100%", md: "auto" }
        }}>
          <TextField
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              width: { xs: "100%", sm: "200px" },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: primaryColor,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: primaryColor,
              }
            }}
          >
            <InputLabel id="filter-label" sx={{ '&.Mui-focused': { color: primaryColor } }}>Filter</InputLabel>
            <Select
              labelId="filter-label"
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              label="Filter"
              inputProps={{ "aria-label": "Filter requests" }}
            >
              <MenuItem value="all">All Requests</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="admin_reviewed">Admin Reviewed</MenuItem>
              <MenuItem value="management_approved">Approved</MenuItem>
              <MenuItem value="management_rejected">Rejected</MenuItem>
              <MenuItem value="payment_processed">Payment Processed</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Actions row */}
      <Box sx={{ 
        display: "flex", 
        flexWrap: "wrap",
        alignItems: "center", 
        justifyContent: "space-between", 
        gap: 2, 
        mb: 3 
      }}>
        <Button
          onClick={fetchRequests}
          startIcon={<RefreshIcon />}
          variant="outlined"
          sx={{ 
            color: primaryColor, 
            borderColor: primaryColor,
            '&:hover': { 
              borderColor: primaryColorDark, 
              bgcolor: `${primaryColor}10` // 10% opacity
            }
          }}
        >
          Refresh
        </Button>
        
        <Button
          component={Link}
          to="/user/create-request"
          startIcon={<AddIcon />}
          variant="contained"
          sx={{ 
            bgcolor: primaryColor,
            "&:hover": { bgcolor: primaryColorDark },
          }}
        >
          New Request
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "300px",
          flexDirection: "column"
        }}>
          <CircularProgress sx={{ color: primaryColor, mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading your requests...
          </Typography>
        </Box>
      ) : requests.length === 0 ? (
        <Paper 
          variant="outlined"
          sx={{ 
            p: { xs: 4, sm: 5 }, 
            textAlign: "center",
            bgcolor: "grey.50", 
            border: "1px dashed",
            borderColor: "grey.300",
            borderRadius: 2,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)"
          }}
        >
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            mb: 2,
            "& svg": {
              color: `${primaryColor}40`  // 40% opacity
            }
          }}>
            <InfoIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 } }} />
          </Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            No requests found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: "500px", mx: "auto" }}>
            {searchTerm || filter !== "all" 
              ? "Try adjusting your search or filter criteria" 
              : "You haven't created any expense requests yet. Create a new request to get started."}
          </Typography>
          <Button
            component={Link}
            to="/user/create-request"
            startIcon={<AddIcon />}
            variant="contained"
            sx={{ 
              bgcolor: primaryColor,
              "&:hover": { bgcolor: primaryColorDark },
              px: 3,
              py: 1
            }}
          >
            Create New Request
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {requests.map((request) => {
            const statusColor = 
              request.status === 'approved' ? 'success' :
              request.status === 'pending' ? 'warning' : 'error';
            
            return (
              <Card
                key={request._id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  },
                  borderLeft: '4px solid',
                  borderLeftColor: `${statusColor}.main`,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ 
                  p: { xs: 1, sm: 1.5 }, 
                  display: "flex", 
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between", 
                  alignItems: { xs: "flex-start", sm: "center" }, 
                  gap: { xs: 1, sm: 0 },
                  bgcolor: `${statusColor}.50`,
                  borderBottom: '1px solid',
                  borderBottomColor: `${statusColor}.100`
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    {getStatusIcon(request.status)}
                    <Chip
                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1).replace(/_/g, ' ')}
                      color={statusColor}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip
                      icon={<ReceiptIcon sx={{ fontSize: "0.9rem !important" }} />}
                      label={`${request.expenses?.length || 0} expense${(request.expenses?.length || 0) !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      icon={<DateRangeIcon sx={{ fontSize: "0.9rem !important" }} />}
                      label={formatDateRange(request.tripStartDate, request.tripEndDate)}
                      size="small"
                      sx={{ 
                        bgcolor: "background.paper",
                        fontWeight: 500,
                        fontSize: "0.75rem"
                      }}
                    />
                    <Chip
                      label={`${getTripDuration(request.tripStartDate, request.tripEndDate)} day${getTripDuration(request.tripStartDate, request.tripEndDate) !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ 
                        bgcolor: `${primaryColor}15`,
                        color: primaryColor,
                        fontWeight: 600,
                        fontSize: "0.7rem"
                      }}
                    />
                  </Box>
                </Box>
                <CardContent sx={{ pt: 2 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: "text.primary",
                      fontSize: { xs: "1rem", sm: "1.1rem" }
                    }}
                  >
                    {request.title || `Request #${request._id.slice(-6)}`}
                  </Typography>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <DescriptionIcon 
                          fontSize="small"
                          sx={{ color: primaryColor, mr: 1.5, mt: 0.3 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                            Description
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: "text.primary", 
                              bgcolor: "grey.50",
                              p: 1,
                              borderRadius: 1,
                              borderLeft: '2px solid',
                              borderLeftColor: 'grey.200'
                            }}
                          >
                            {request.description || "No description provided"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {request.location && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <LocationIcon 
                            fontSize="small"
                            sx={{ color: primaryColor, mr: 1.5, mt: 0.3 }}
                          />
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                              Location
                            </Typography>
                            <Typography variant="body2">{request.location}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <AccessTimeIcon 
                          fontSize="small"
                          sx={{ color: primaryColor, mr: 1.5, mt: 0.3 }}
                        />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                            Submitted On
                          </Typography>
                          <Typography variant="body2">{formatDate(request.createdAt || new Date())}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <DateRangeIcon 
                          fontSize="small"
                          sx={{ color: primaryColor, mr: 1.5, mt: 0.3 }}
                        />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                            Trip Period
                          </Typography>
                          <Typography variant="body2">
                            {formatDateRange(request.tripStartDate, request.tripEndDate)}
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: primaryColor, fontWeight: 500 }}>
                              ({getTripDuration(request.tripStartDate, request.tripEndDate)} days)
                            </Typography>
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <AccessTimeIcon 
                          fontSize="small"
                          sx={{ color: primaryColor, mr: 1.5, mt: 0.3 }}
                        />
                        <Box sx={{ width: "100%" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                            Expenses
                          </Typography>
                          <Box sx={{ 
                            bgcolor: "grey.50",
                            borderRadius: 1,
                            p: 1.5,
                            borderLeft: '2px solid',
                            borderLeftColor: 'grey.200'
                          }}>
                            <List dense disablePadding>
                              {request.expenses && request.expenses.length > 0 ? request.expenses.map((exp, idx) => (
                                <ListItem key={idx} disablePadding sx={{ 
                                  display: "flex", 
                                  flexDirection: { xs: "column", sm: "row" },
                                  alignItems: { xs: "flex-start", sm: "center" },
                                  justifyContent: "space-between", 
                                  mb: 1,
                                  pb: 1,
                                  gap: { xs: 0.5, sm: 0 },
                                  borderBottom: idx < request.expenses.length - 1 ? '1px dashed #e0e0e0' : 'none'
                                }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {exp.serviceName}
                                      </Typography>
                                      {exp.expenseDate && (
                                        <Chip
                                          label={formatDate(exp.expenseDate)}
                                          size="small"
                                          sx={{ fontSize: "0.65rem", height: 18, bgcolor: "grey.200" }}
                                        />
                                      )}
                                    </Box>
                                    {exp.description && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                        {exp.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: primaryColor }}>
                                      ₹{exp.amount}
                                    </Typography>
                                    {exp.hasBill && exp.bill?.fileUrl ? (
                                      <Button
                                        href={exp.bill.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        sx={{ 
                                          minWidth: 'auto',
                                          px: 1,
                                          fontSize: "0.7rem",
                                          color: primaryColor,
                                          '&:hover': {
                                            bgcolor: `${primaryColor}10`
                                          }
                                        }}
                                      >
                                        Bill
                                      </Button>
                                    ) : (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: "0.65rem" }}>
                                        No bill
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              )) : (
                                <ListItem disablePadding>
                                  <Typography variant="body2" color="text.secondary">No expenses recorded</Typography>
                                </ListItem>
                              )}
                            </List>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </div>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: "space-between", p: 2, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ 
                      bgcolor: `${primaryColor}10`,
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.75
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 500, mb: 0.25 }}>
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: primaryColor }}>
                        ₹{request.totalAmountRequested || 0}
                      </Typography>
                    </Box>
                    
                    {/* <Chip
                      label={request.status.toUpperCase()}
                      size="small"
                      color={
                        request.status === 'approved' ? 'success' :
                        request.status === 'pending' ? 'warning' : 'error'
                      }
                      sx={{ ml: 2, fontWeight: 500 }}
                    /> */}
                  </Box>
                  
                  <Button
                    component={Link}
                    to={`/user/request/${request._id}`}
                    endIcon={<ArrowForwardIcon />}
                    variant="outlined"
                    sx={{ 
                      color: primaryColor,
                      borderColor: primaryColor,
                      '&:hover': { 
                        bgcolor: `${primaryColor}10`,
                        borderColor: primaryColorDark 
                      },
                      mt: { xs: 2, sm: 0 },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            );
          })}
          
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
    </Paper>
  );
}
