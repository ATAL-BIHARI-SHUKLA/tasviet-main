import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  InputAdornment,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Link,
  Stack
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Cancel as CancelIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon
} from "@mui/icons-material";

const RequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for adding new expense
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    serviceName: "",
    amount: "",
    description: "",
    bill: null
  });
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  
  // Theme colors
  const primaryColor = "#7428dc";
  const primaryColorDark = "#670fdb";

  // Fetch request details
  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://tasviet.vercel.app/api/employee/request/${requestId}`,
        { withCredentials: true }
      );
      setRequest(response.data.request);
      setError(null);
    } catch (err) {
      console.error("Error fetching request details:", err);
      setError(err.response?.data?.message || "Failed to fetch request details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  // Handler for adding a new expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.serviceName || !newExpense.amount || !newExpense.bill) {
      alert("Please fill in all required fields and upload a bill");
      return;
    }
    
    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", newExpense.bill);
      
      // Upload file first
      const uploadRes = await axios.post(
        "https://tasviet.vercel.app/api/upload",
        formData,
        { withCredentials: true }
      );
      
      // Then add the expense with the uploaded file info
      const fileInfo = uploadRes.data.fileInfo;
      
      await axios.post(
        `https://tasviet.vercel.app/api/employee/request/${requestId}/expense`,
        {
          serviceName: newExpense.serviceName,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          bill: {
            fileUrl: fileInfo.url,
            fileType: fileInfo.fileType,
            fileName: fileInfo.originalName
          }
        },
        { withCredentials: true }
      );
      
      // Reset form and refresh data
      setNewExpense({
        serviceName: "",
        amount: "",
        description: "",
        bill: null
      });
      setFilePreview(null);
      setShowAddForm(false);
      fetchRequestDetails();
    } catch (err) {
      console.error("Error adding expense:", err);
      alert(err.response?.data?.message || "Failed to add expense");
    } finally {
      setUploading(false);
    }
  };

  // Handler for removing an expense
  const handleRemoveExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to remove this expense?")) {
      return;
    }
    
    try {
      await axios.delete(
        `https://tasviet.vercel.app/api/employee/request/${requestId}/expense/${expenseId}`,
        { withCredentials: true }
      );
      
      // Refresh data after deletion
      fetchRequestDetails();
    } catch (err) {
      console.error("Error removing expense:", err);
      alert(err.response?.data?.message || "Failed to remove expense");
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewExpense({ ...newExpense, bill: file });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "approved": return <CheckCircleIcon sx={{ color: "success.main", fontSize: { xs: 20, sm: 24 } }} />;
      case "pending": return <PendingActionsIcon sx={{ color: "warning.main", fontSize: { xs: 20, sm: 24 } }} />;
      case "rejected": return <CancelIcon sx={{ color: "error.main", fontSize: { xs: 20, sm: 24 } }} />;
      default: return null;
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case "approved": return "success";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Determine if expense can be modified (pending status)
  const canModifyExpenses = request?.status === "pending";

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 2, md: 5 },
        bgcolor: "background.paper",
        borderRadius: 2,
        minHeight: "60vh"
      }}
    >
      {/* Header with back button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton 
          onClick={() => navigate("/user/my-requests")}
          sx={{ mr: 1.5 }}
          size="medium"
        >
          <ArrowBackIcon color="action" />
        </IconButton>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColorDark} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
          }}
        >
          Request Details
        </Typography>
      </Box>

      {loading ? (
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            minHeight: "300px" 
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress sx={{ color: primaryColor, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading request details...
            </Typography>
          </Box>
        </Box>
      ) : error ? (
        <Box 
          sx={{ 
            p: 4, 
            textAlign: "center", 
            borderRadius: 2,
            bgcolor: "error.lighter",
            border: 1,
            borderColor: "error.light"
          }}
        >
          <CancelIcon sx={{ fontSize: 48, color: "error.main", mb: 2 }} />
          <Typography variant="h6" color="error.dark" gutterBottom>
            Error Loading Request
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button 
            variant="contained"
            color="error"
            onClick={fetchRequestDetails}
          >
            Try Again
          </Button>
        </Box>
      ) : request ? (
        <>
          {/* Status Header */}
          <Box 
            sx={{ 
              p: { xs: 1, sm: 1 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: 2,
              mb: 3,
              bgcolor: `${getStatusColor(request.status)}.lighter`,
              border: 1,
              borderColor: `${getStatusColor(request.status)}.light`
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {getStatusIcon(request.status)}
              <Chip 
                label={request.status} 
                color={getStatusColor(request.status)}
                size="small"
                sx={{ 
                  ml: { xs: 1, sm: 1.5 },
                  textTransform: "capitalize",
                  fontWeight: 500
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Created on{" "}
              </Box>
              {formatDate(request.createdAt)}
            </Typography>
          </Box>
          
          {/* Request details */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" }
              }}
            >
              {request.title || `Request #${request._id.slice(-6)}`}
            </Typography>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: "grey.50", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", alignItems: "flex-start" }}>
                    <DescriptionIcon 
                      sx={{ 
                        color: primaryColor, 
                        mr: 1.5, 
                        mt: 0.5,
                        fontSize: { xs: 20, sm: 24 }
                      }} 
                    />
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {request.description || "No description provided"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {request.location && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ bgcolor: "grey.50", borderRadius: 2 }}>
                    <CardContent sx={{ display: "flex", alignItems: "flex-start" }}>
                      <LocationOnIcon 
                        sx={{ 
                          color: primaryColor, 
                          mr: 1.5, 
                          mt: 0.5,
                          fontSize: { xs: 20, sm: 24 }
                        }} 
                      />
                      <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Location
                        </Typography>
                        <Typography variant="body2">
                          {request.location}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: "grey.50", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", alignItems: "flex-start" }}>
                    <DateRangeIcon 
                      sx={{ 
                        color: primaryColor, 
                        mr: 1.5, 
                        mt: 0.5,
                        fontSize: { xs: 20, sm: 24 }
                      }} 
                    />
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Trip Period
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(request.tripStartDate)} - {formatDate(request.tripEndDate)}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: "inline-block", 
                        mt: 1,
                        bgcolor: `${primaryColor}15`,
                        color: primaryColor,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontWeight: 500
                      }}>
                        {request.tripDuration || (request.tripStartDate && request.tripEndDate ? Math.ceil((new Date(request.tripEndDate) - new Date(request.tripStartDate)) / (1000 * 60 * 60 * 24)) + 1 : 1)} days
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        (Submitted: {formatDate(request.createdAt)})
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: "grey.50", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", alignItems: "flex-start" }}>
                    <CurrencyRupeeIcon 
                      sx={{ 
                        color: primaryColor, 
                        mr: 1.5, 
                        mt: 0.5,
                        fontSize: { xs: 20, sm: 24 }
                      }} 
                    />
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Total Amount
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        ₹{request.totalAmountRequested || 0}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </div>
            
            {/* Status updates */}
            {(request.approvedBy || request.sanctionedBy) && (
              <Box 
                sx={{ 
                  mb: 3, 
                  borderLeft: 4, 
                  borderColor: primaryColor, 
                  pl: { xs: 2, sm: 2.5 },
                  py: 1
                }}
              >
                {request.approvedBy && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Approved by
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {request.approvedBy.displayName || request.approvedBy.email}
                    </Typography>
                  </Box>
                )}
                
                {request.sanctionedBy && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Sanctioned by
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {request.sanctionedBy.displayName || request.sanctionedBy.email}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Comments section if any */}
            {request.comments && request.comments.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                  Comments
                </Typography>
                <Stack spacing={2}>
                  {request.comments.map((comment, index) => (
                    <Card key={index} variant="outlined" sx={{ bgcolor: "grey.50", borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ 
                          display: "flex", 
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1 
                        }}>
                          <Box>
                            <Typography variant="body2" fontWeight={500} component="span">
                              {comment.user?.displayName || comment.user?.email || "Unknown User"}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                ml: 1,
                                textTransform: "capitalize",
                                fontWeight: 400
                              }}
                              component="span"
                            >
                              ({comment.user?.userType || "user"})
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {comment.text}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
          
          {/* Expenses list */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              mb: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Expenses
                <Typography 
                  component="span" 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  ({request.expenses?.length || 0} items)
                </Typography>
              </Typography>
              
              {canModifyExpenses && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddForm(true)}
                  disabled={showAddForm}
                  sx={{
                    bgcolor: primaryColor,
                    '&:hover': {
                      bgcolor: primaryColorDark,
                    }
                  }}
                >
                  Add Expense
                </Button>
              )}
            </Box>
            
            {/* Add Expense Form */}
            <Collapse in={showAddForm} sx={{ mb: 3 }}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: "grey.50",
                }}
              >
                <CardContent>
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    mb: 2 
                  }}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Add New Expense
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setShowAddForm(false)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <form onSubmit={handleAddExpense}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          size="small"
                          label="Service Name"
                          value={newExpense.serviceName}
                          onChange={(e) => setNewExpense({...newExpense, serviceName: e.target.value})}
                          sx={{
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: primaryColor,
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl 
                          fullWidth 
                          required 
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: primaryColor,
                            }
                          }}
                        >
                          <InputLabel htmlFor="amount">Amount</InputLabel>
                          <OutlinedInput
                            id="amount"
                            type="number"
                            inputProps={{ min: "0", step: "0.01" }}
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                            startAdornment={<InputAdornment position="start">₹</InputAdornment>}
                            label="Amount"
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description"
                      size="small"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: primaryColor,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: primaryColor,
                        }
                      }}
                    />
                      
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Upload Bill*
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          sx={{ 
                            flexGrow: 1,
                            borderStyle: "dashed",
                            height: 80,
                            borderColor: "grey.300",
                            '&:hover': {
                              borderColor: primaryColor,
                              bgcolor: 'background.paper'
                            },
                            flexDirection: 'column'
                          }}
                        >
                          <input
                            type="file"
                            hidden
                            required
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {filePreview ? "Change file" : "Choose a file"}
                          </Typography>
                        </Button>
                        
                        {filePreview && (
                          <Box sx={{ 
                            ml: 2, 
                            p: 1, 
                            border: 1, 
                            borderColor: "grey.300", 
                            borderRadius: 1,
                            width: 64, 
                            height: 64, 
                            position: "relative" 
                          }}>
                            {newExpense.bill.type.includes('image') ? (
                              <Box
                                component="img"
                                src={filePreview}
                                alt="Preview"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0.5 }}
                              />
                            ) : (
                              <Box sx={{ 
                                width: '100%', 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                bgcolor: 'grey.100',
                                borderRadius: 0.5
                              }}>
                                <ReceiptIcon sx={{ fontSize: 32, color: primaryColor }} />
                              </Box>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => {
                                setNewExpense({...newExpense, bill: null});
                                setFilePreview(null);
                              }}
                              sx={{ 
                                position: 'absolute', 
                                top: -8, 
                                right: -8, 
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                p: 0.5
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={uploading}
                        sx={{
                          bgcolor: primaryColor,
                          '&:hover': {
                            bgcolor: primaryColorDark,
                          }
                        }}
                      >
                        {uploading ? "Uploading..." : "Add Expense"}
                      </Button>
                    </Box>
                  </form>
                </CardContent>
              </Card>
            </Collapse>
            
            {/* Expenses list */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: 500, width: { xs: "30%", sm: "35%" } }}>Service Name</TableCell>
                    <TableCell sx={{ fontWeight: 500, width: { xs: "20%", sm: "15%" }, display: { xs: "none", sm: "table-cell" } }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 500, width: "15%" }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 500, width: "20%" }}>Bill</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, width: "10%" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.expenses && request.expenses.length > 0 ? (
                    request.expenses.map((expense, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {expense.serviceName}
                          </Typography>
                          {expense.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {expense.description}
                            </Typography>
                          )}
                          {/* Show date on mobile as secondary text */}
                          <Typography 
                            variant="caption" 
                            color="primary" 
                            sx={{ display: { xs: "block", sm: "none" }, mt: 0.5 }}
                          >
                            {formatDate(expense.expenseDate || request.tripStartDate || request.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(expense.expenseDate || request.tripStartDate || request.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">₹{expense.amount}</Typography>
                        </TableCell>
                        <TableCell>
                          {expense.hasBill && expense.bill?.fileUrl ? (
                            <Link
                              href={expense.bill.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ 
                                display: "flex", 
                                alignItems: "center", 
                                color: "primary.main",
                                '&:hover': { 
                                  textDecoration: "underline" 
                                }
                              }}
                            >
                              <ReceiptIcon sx={{ mr: 0.5, fontSize: 16 }} />
                              <Typography 
                                variant="body2" 
                                component="span"
                                noWrap
                                sx={{ maxWidth: 120, display: { xs: "none", sm: "block" } }}
                              >
                                {expense.bill.originalFileName?.slice(0, 12) || "View Bill"}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              No bill
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {canModifyExpenses && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveExpense(expense._id)}
                              title="Delete expense"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No expenses found for this request
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Expenses total */}
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: 500 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      ₹{request.totalAmountRequested || 0}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          {/* Action buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              component={RouterLink}
              to="/user/my-requests"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: 'none' }}
            >
              Back to All Requests
            </Button>
            
            {canModifyExpenses && !showAddForm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddForm(true)}
                sx={{
                  bgcolor: primaryColor,
                  '&:hover': {
                    bgcolor: primaryColorDark,
                  }
                }}
              >
                Add Expense
              </Button>
            )}
          </Box>
        </>
      ) : (
        <Box 
          sx={{ 
            p: 4, 
            textAlign: "center", 
            bgcolor: "grey.50", 
            borderRadius: 2,
            border: 1,
            borderStyle: "dashed",
            borderColor: "grey.300"
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Request not found
          </Typography>
          <Link 
            component={RouterLink} 
            to="/user/my-requests" 
            sx={{ 
              display: "inline-block", 
              mt: 2,
              color: primaryColor,
              '&:hover': {
                textDecoration: "underline"
              }
            }}
          >
            Back to My Requests
          </Link>
        </Box>
      )}
    </Paper>
  );
}

export default RequestDetail;