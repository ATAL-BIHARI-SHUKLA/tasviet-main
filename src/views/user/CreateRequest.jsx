import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon
} from "@mui/icons-material";

export default function CreateRequest() {
  const navigate = useNavigate();
  const { role, profile } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const draftStorageKey = profile?.email || profile?._id
    ? `tasviet:create-request-draft:${profile.email || profile._id}`
    : null;

  const getInitialRequestData = () => ({
    title: "",
    description: "",
    location: "",
    tripStartDate: new Date().toISOString().split('T')[0],
    tripEndDate: new Date().toISOString().split('T')[0],
  });
  
  const [requestData, setRequestData] = useState(getInitialRequestData);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  
  // File preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [pendingFileUpload, setPendingFileUpload] = useState({ index: null, file: null });

  const buildFileFromDataUrl = async (dataUrl, fileName, fileType) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName || "receipt", { type: fileType || blob.type || "application/octet-stream" });
  };

  useEffect(() => {
    if (!draftStorageKey) {
      setDraftRestored(true);
      return;
    }

    try {
      const savedDraft = localStorage.getItem(draftStorageKey);
      if (!savedDraft) {
        setDraftRestored(true);
        return;
      }

      const parsedDraft = JSON.parse(savedDraft);
      if (parsedDraft?.requestData) {
        setRequestData(prev => ({ ...prev, ...parsedDraft.requestData }));
      }

      if (Array.isArray(parsedDraft?.expenses)) {
        setExpenses(parsedDraft.expenses.map(expense => ({
          serviceName: expense.serviceName || "",
          amount: expense.amount ?? "",
          description: expense.description || "",
          expenseDate: expense.expenseDate || parsedDraft.requestData?.tripStartDate || getInitialRequestData().tripStartDate,
          hasBill: expense.hasBill || false,
          bill: expense.bill || null,
        })));
      }

      if (parsedDraft?.pendingFileDraft?.previewFile && typeof parsedDraft.pendingFileDraft.index === "number") {
        buildFileFromDataUrl(
          parsedDraft.pendingFileDraft.previewFile,
          parsedDraft.pendingFileDraft.fileName,
          parsedDraft.pendingFileDraft.fileType
        ).then(restoredFile => {
          setPreviewFile(parsedDraft.pendingFileDraft.previewFile);
          setPreviewType(parsedDraft.pendingFileDraft.previewType || (parsedDraft.pendingFileDraft.fileType?.startsWith('image/') ? 'image' : 'pdf'));
          setPendingFileUpload({ index: parsedDraft.pendingFileDraft.index, file: restoredFile });
          setPreviewOpen(true);
        }).catch(draftError => {
          console.error("Failed to restore pending file draft:", draftError);
        });
      }

      setDraftRestored(true);
      setSuccess("Draft restored from your previous session.");
    } catch (draftError) {
      console.error("Failed to restore draft:", draftError);
      localStorage.removeItem(draftStorageKey);
      setDraftRestored(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftRestored || !draftStorageKey) return;

    const hasMeaningfulData =
      requestData.title.trim() ||
      requestData.description.trim() ||
      requestData.location.trim() ||
      expenses.length > 0 ||
      requestData.tripStartDate !== getInitialRequestData().tripStartDate ||
      requestData.tripEndDate !== getInitialRequestData().tripEndDate;

    if (!hasMeaningfulData) {
      localStorage.removeItem(draftStorageKey);
      return;
    }

    const pendingFileDraft = previewOpen && pendingFileUpload.file && previewFile
      ? {
          index: pendingFileUpload.index,
          previewFile,
          previewType,
          fileName: pendingFileUpload.file.name,
          fileType: pendingFileUpload.file.type,
        }
      : null;

    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          requestData,
          expenses,
          pendingFileDraft,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (draftError) {
      console.warn("Unable to save request draft:", draftError);
    }
  }, [draftRestored, draftStorageKey, requestData, expenses]);

  // Handle input changes for the request details
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({ ...prev, [name]: value }));
  };

  // Add a new expense row
  const handleAddExpense = () => {
    setExpenses([...expenses, { 
      serviceName: "", 
      amount: "", 
      description: "", 
      expenseDate: requestData.tripStartDate,
      hasBill: false, 
      bill: null 
    }]);
  };

  // Remove an expense row
  const handleRemoveExpense = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // Handle expense field change
  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  // Handle file selection and show preview
  const handleFileSelect = (index, file) => {
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewFile(reader.result);
      setPreviewType(file.type.startsWith('image/') ? 'image' : 'pdf');
      setPendingFileUpload({ index, file });
      setPreviewOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Confirm and upload file after preview
  const confirmFileUpload = async () => {
    const { index, file } = pendingFileUpload;
    if (!file || index === null) return;
    
    setPreviewOpen(false);
    setUploading(prev => ({ ...prev, [index]: true }));
    setError("");
    
    try {
      const formData = new FormData();
      formData.append('bill', file);
      
      const response = await axios.post(
        "https://tasviet.vercel.app/api/employee/upload-file",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      
      const updated = [...expenses];
      updated[index] = { ...updated[index], bill: response.data.file };
      setExpenses(updated);
      
    } catch (err) {
      setError(`Failed to upload file for expense #${index + 1}: ${err.response?.data?.error || err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [index]: false }));
      setPendingFileUpload({ index: null, file: null });
      setPreviewFile(null);
    }
  };

  // Cancel file upload
  const cancelFileUpload = () => {
    setPreviewOpen(false);
    setPendingFileUpload({ index: null, file: null });
    setPreviewFile(null);
  };

  // Validate expense date is within trip range
  const isExpenseDateValid = (expenseDate) => {
    if (!expenseDate || !requestData.tripStartDate || !requestData.tripEndDate) return true;
    const expDate = new Date(expenseDate);
    const startDate = new Date(requestData.tripStartDate);
    const endDate = new Date(requestData.tripEndDate);
    return expDate >= startDate && expDate <= endDate;
  };

  // Submit the complete request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!requestData.title.trim()) {
      setError("Please provide a title for the request");
      return;
    }
    if (!requestData.tripStartDate || !requestData.tripEndDate) {
      setError("Please provide trip start and end dates");
      return;
    }
    if (new Date(requestData.tripStartDate) > new Date(requestData.tripEndDate)) {
      setError("Trip start date cannot be after end date");
      return;
    }
    if (new Date(requestData.tripEndDate) > new Date()) {
      setError("Trip end date cannot be in the future");
      return;
    }
    if (expenses.length === 0) {
      setError("Please add at least one expense item");
      return;
    }
    for (let i = 0; i < expenses.length; i++) {
      if (!expenses[i].serviceName || !expenses[i].amount) {
        setError(`Expense #${i + 1} is missing service name or amount`);
        return;
      }
      if (expenses[i].hasBill && !expenses[i].bill) {
        setError(`Expense #${i + 1} is marked as having a bill but no file was uploaded`);
        return;
      }
      if (!isExpenseDateValid(expenses[i].expenseDate)) {
        setError(`Expense #${i + 1} date must be within the trip date range`);
        return;
      }
    }

    setLoading(true);
    try {
      const requestPayload = {
        title: requestData.title,
        description: requestData.description,
        location: requestData.location,
        tripStartDate: requestData.tripStartDate,
        tripEndDate: requestData.tripEndDate,
        expenses: expenses.map(({ serviceName, amount, description, expenseDate, hasBill, bill }) => ({
          serviceName,
          amount: parseFloat(amount),
          description,
          expenseDate: expenseDate || requestData.tripStartDate,
          hasBill: hasBill || false,
          bill: hasBill ? bill : null
        }))
      };

      const createEndpoint = role === 'accountant' 
        ? "https://tasviet.vercel.app/api/account/request"
        : "https://tasviet.vercel.app/api/employee/request";

      await axios.post(
        createEndpoint,
        requestPayload,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      setSuccess("Request submitted successfully!");
      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }
      setDraftRestored(false);
      setRequestData(getInitialRequestData());
      setExpenses([]);
      setTimeout(() => navigate("/user/my-requests"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (!requestData.tripStartDate || !requestData.tripEndDate) return 0;
    const start = new Date(requestData.tripStartDate);
    const end = new Date(requestData.tripEndDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate total amount
  const getTotalAmount = () => {
    return expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 3, md: 4, lg: 5 },
          borderRadius: { xs: 2, sm: 3 },
          bgcolor: "background.paper",
          minHeight: "70vh",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 2, sm: 3 }, flexWrap: "wrap", gap: 1 }}>
          <IconButton
            component={Link}
            to="/user/dashboard"
            sx={{ mr: 1, color: "text.secondary" }}
            size={isMobile ? "small" : "medium"}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(90deg, #7428dc 0%, #670fdb 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Create New Expense Request
          </Typography>
        </Box>

        {draftRestored && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Draft restored from your last session. Your changes are saved automatically in this browser until you submit the request.
          </Alert>
        )}
        
        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Request details section */}
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 2,
              bgcolor: "grey.50",
              mb: { xs: 3, sm: 4 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <DescriptionIcon sx={{ color: "#7428dc", mr: 1 }} />
              <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600}>
                Request Details
              </Typography>
            </Box>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="title"
                  label="Title"
                  value={requestData.title}
                  onChange={handleInputChange}
                  placeholder="Business Trip to Chennai"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TitleIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="location"
                  label="Location"
                  value={requestData.location}
                  onChange={handleInputChange}
                  placeholder="Mumbai, Maharashtra"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  bgcolor: "#7428dc10", 
                  p: 1.5, 
                  borderRadius: 1,
                  justifyContent: "center"
                }}>
                  <DateRangeIcon sx={{ color: "#7428dc", mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Trip Duration: <strong>{getTripDuration()} day{getTripDuration() !== 1 ? 's' : ''}</strong>
                  </Typography>
                </Box>
              </Grid>
              
              {/* Trip Date Range */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "white", borderColor: "#7428dc40" }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DateRangeIcon fontSize="small" />
                    Trip Date Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="date"
                        name="tripStartDate"
                        label="Trip Start Date"
                        value={requestData.tripStartDate}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        inputProps={{
                          max: requestData.tripEndDate || new Date().toISOString().split('T')[0]
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="date"
                        name="tripEndDate"
                        label="Trip End Date"
                        value={requestData.tripEndDate}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        inputProps={{
                          min: requestData.tripStartDate,
                          max: new Date().toISOString().split('T')[0]
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={isMobile ? 3 : 4}
                  name="description"
                  label="Description (Optional)"
                  value={requestData.description}
                  onChange={handleInputChange}
                  placeholder="Provide additional details about this expense request"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                        <DescriptionIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* Expenses section */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between", 
              alignItems: { xs: "stretch", sm: "center" }, 
              mb: 2,
              gap: 2
            }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CurrencyRupeeIcon sx={{ color: "#7428dc", mr: 1 }} />
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600}>
                  Expense Items
                </Typography>
                {expenses.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    Total: ₹{getTotalAmount().toLocaleString()}
                  </Typography>
                )}
              </Box>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddExpense}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{
                  borderColor: "#7428dc",
                  color: "#7428dc",
                  "&:hover": {
                    borderColor: "#670fdb",
                    backgroundColor: "rgba(116, 40, 220, 0.04)",
                  },
                }}
              >
                Add Item
              </Button>
            </Box>
            
            {expenses.length > 0 ? (
              <Stack spacing={2} sx={{ mb: 3 }}>
                {expenses.map((exp, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      borderLeft: "4px solid #7428dc",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        Expense #{i + 1}
                      </Typography>
                      <IconButton
                        onClick={() => handleRemoveExpense(i)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="flex-start">
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          fullWidth
                          required
                          label="Service Name"
                          placeholder="Hotel Stay"
                          value={exp.serviceName}
                          onChange={(e) => handleExpenseChange(i, "serviceName", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={6} md={2}>
                        <TextField
                          fullWidth
                          required
                          label="Amount"
                          placeholder="100.00"
                          value={exp.amount}
                          onChange={(e) => handleExpenseChange(i, "amount", e.target.value)}
                          type="number"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">₹</InputAdornment>
                            ),
                          }}
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={6} md={2}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Expense Date"
                          value={exp.expenseDate || requestData.tripStartDate}
                          onChange={(e) => handleExpenseChange(i, "expenseDate", e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{
                            min: requestData.tripStartDate,
                            max: requestData.tripEndDate
                          }}
                          error={!isExpenseDateValid(exp.expenseDate)}
                          helperText={!isExpenseDateValid(exp.expenseDate) ? "Must be within trip dates" : ""}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <TextField
                          fullWidth
                          label="Description"
                          placeholder="Optional details"
                          value={exp.description}
                          onChange={(e) => handleExpenseChange(i, "description", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={3} md={1.5}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={exp.hasBill || false}
                              onChange={(e) => handleExpenseChange(i, "hasBill", e.target.checked)}
                              size="small"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#7428dc',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#7428dc',
                                },
                              }}
                            />
                          }
                          label={
                            <Typography variant="caption" color="text.secondary">
                              Has Bill
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={3} md={1.5}>
                        {exp.hasBill ? (
                          <Box sx={{ position: 'relative' }}>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={uploading[i] ? <CircularProgress size={16} /> : <UploadIcon />}
                              sx={{
                                borderColor: exp.bill ? "success.main" : "grey.400",
                                color: exp.bill ? "success.main" : "text.secondary",
                                fontSize: { xs: "0.7rem", sm: "0.8rem" }
                              }}
                              fullWidth
                              size="small"
                              disabled={uploading[i]}
                            >
                              {uploading[i] ? 'Uploading' : 
                               exp.bill ? "✓ Uploaded" : 
                               "Upload"}
                              <input
                                type="file"
                                hidden
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileSelect(i, e.target.files[0])}
                              />
                            </Button>
                            {exp.bill && (
                              <Typography variant="caption" color="success.main" sx={{ 
                                display: 'block', 
                                mt: 0.5,
                                fontSize: "0.65rem",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap"
                              }}>
                                {exp.bill.originalFileName?.slice(0, 15)}...
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center', mt: 1 }}>
                            No bill
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  borderStyle: "dashed",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No expense items added yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddExpense}
                  sx={{
                    mt: 2,
                    bgcolor: "#7428dc",
                    "&:hover": {
                      bgcolor: "#670fdb",
                    },
                  }}
                >
                  Add First Expense
                </Button>
              </Paper>
            )}
          </Box>
          
          {/* Error/Success messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          {/* Submit button */}
          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "flex-end",
            gap: 2
          }}>
            <Button
              component={Link}
              to="/user/dashboard"
              variant="outlined"
              fullWidth={isMobile}
              sx={{ order: { xs: 2, sm: 1 } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || expenses.length === 0}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              fullWidth={isMobile}
              sx={{
                order: { xs: 1, sm: 2 },
                bgcolor: "#7428dc",
                "&:hover": {
                  bgcolor: "#670fdb",
                },
                "&.Mui-disabled": {
                  bgcolor: "action.disabledBackground",
                },
              }}
            >
              {loading ? "Processing..." : "Submit Request"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* File Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={cancelFileUpload}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          bgcolor: "#7428dc",
          color: "white"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PreviewIcon />
            File Preview
          </Box>
          <IconButton onClick={cancelFileUpload} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center", alignItems: "center", minHeight: { xs: "60vh", sm: "400px" }, bgcolor: "grey.100" }}>
          {previewFile && previewType === 'image' && (
            <img 
              src={previewFile} 
              alt="Preview" 
              style={{ 
                maxWidth: "100%", 
                maxHeight: isMobile ? "60vh" : "500px", 
                objectFit: "contain" 
              }} 
            />
          )}
          {previewFile && previewType === 'pdf' && (
            <Box sx={{ 
              textAlign: "center", 
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2
            }}>
              <Box sx={{ 
                width: 80, 
                height: 100, 
                bgcolor: "#dc143c", 
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "1.2rem"
              }}>
                PDF
              </Box>
              <Typography variant="body1" color="text.secondary">
                PDF file selected
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pendingFileUpload.file?.name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Is this the correct file?
          </Typography>
          <Button onClick={cancelFileUpload} variant="outlined" color="error">
            Cancel
          </Button>
          <Button 
            onClick={confirmFileUpload} 
            variant="contained"
            sx={{ bgcolor: "#7428dc", "&:hover": { bgcolor: "#670fdb" } }}
          >
            Confirm & Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
