import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Link,
  Stack,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PaidIcon from "@mui/icons-material/Paid";
import HistoryIcon from "@mui/icons-material/History";
import CommentIcon from "@mui/icons-material/Comment";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const API_BASE_URL = "https://tasviet.vercel.app/api";

const RequestDetails = () => {
  const { requestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editableExpenses, setEditableExpenses] = useState([]);
  const [isEditingExpenses, setIsEditingExpenses] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        // Use the dedicated endpoint to get a specific request by ID
        const res = await axios.get(
          `${API_BASE_URL}/admin/request/${requestId}`,
          {
            withCredentials: true,
          }
        );

        const req = res.data.request;

        if (req) {
          setRequest(req);
          setEditAmount(req?.totalAmountRequested || "");
          // Initialize editable expenses from request
          if (req && req.expenses) {
            setEditableExpenses(
              req.expenses.map((exp) => ({
                ...exp,
                originalAmount: exp.amount,
                isEditing: false,
              }))
            );
          }
        } else {
          setError(`Request with ID ${requestId} not found`);
        }
      } catch (err) {
        console.error("Error fetching request:", err);
        setError(
          "Failed to fetch request details: " +
            (err.response?.data?.message || err.message)
        );
      }
      setLoading(false);
    };
    fetchDetails();
  }, [requestId]);

  // Check if review mode is enabled
  const isReviewMode =
    request &&
    request.status === "pending" &&
    new URLSearchParams(location.search).get("review") === "1";

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Check if expenses were edited
      const hasEditedExpenses =
        isEditingExpenses &&
        editableExpenses.some((exp) => exp.amount !== exp.originalAmount);

      // Only send edited expenses if they were changed
      const payload = {
        editedAmount: editAmount,
        adminComment,
      };

      if (hasEditedExpenses) {
        payload.editedExpenses = editableExpenses.map((exp) => ({
          id: exp._id,
          serviceName: exp.serviceName,
          description: exp.description,
          amount: Number(exp.amount),
        }));
      }

      await axios.patch(
        `${API_BASE_URL}/admin/request/${requestId}/review`,
        payload,
        { withCredentials: true }
      );
      navigate("/admin/requests");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review request");
    }
    setSubmitting(false);
  };

  const handleExpenseEdit = (index, field, value) => {
    const newExpenses = [...editableExpenses];
    newExpenses[index][field] = value;
    setEditableExpenses(newExpenses);

    // Update the total amount based on the sum of all expenses
    const newTotal = newExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount || 0),
      0
    );
    setEditAmount(newTotal.toFixed(2)); // Format to 2 decimal places
  };

  const toggleExpenseEditing = () => {
    if (!isEditingExpenses) {
      // When entering expense editing mode, make sure we have the most current data
      if (request && request.expenses) {
        setEditableExpenses(
          request.expenses.map((exp) => ({
            ...exp,
            originalAmount: exp.amount,
            isEditing: false,
          }))
        );
      }
    }
    setIsEditingExpenses(!isEditingExpenses);
  };

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  if (!request)
    return (
      <Box p={3}>
        <Alert severity="info">Request not found.</Alert>
      </Box>
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "admin_reviewed":
        return "primary"; // Changed to purple (primary)
      case "management_approved":
        return "success";
      case "management_rejected":
        return "error";
      case "paid":
        return "secondary"; // Changed to dark purple (secondary)
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: 1200,
        mx: "auto",
        bgcolor: "#f5f5f7",
      }}
    >
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#7428dc" }}>
          Request Details
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#555555" }}
          fontFamily="monospace"
        >
          ID: {request._id}
        </Typography>
      </Box>

      <Box mb={4}>
        {isReviewMode && (
          <Card
            variant="outlined"
            sx={{
              mb: 3,
              bgcolor: "rgba(116, 40, 220, 0.05)",
              borderColor: "#7428dc",
              boxShadow: "0 4px 12px rgba(116, 40, 220, 0.08)",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={600}
                mb={2}
                sx={{ color: "#7428dc" }}
              >
                Admin Review & Edit
              </Typography>
              <Box
                component="form"
                onSubmit={handleReview}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {isEditingExpenses ? (
                  <Box mb={2}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        color="text.primary"
                      >
                        Edit Individual Expenses
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          bgcolor: "rgba(25, 118, 210, 0.08)",
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          border: "1px solid rgba(25, 118, 210, 0.2)",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mr={1}
                        >
                          Total Adjusted:
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          ₹{Number(editAmount).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.05)" }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow
                            sx={{ bgcolor: "rgba(25, 118, 210, 0.04)" }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              Service
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Description
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              Original Amount (₹)
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              Edited Amount (₹)
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              Difference
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {editableExpenses.map((exp, i) => {
                            const isEdited =
                              Number(exp.amount) !== Number(exp.originalAmount);
                            const difference =
                              Number(exp.amount) - Number(exp.originalAmount);

                            return (
                              <TableRow
                                key={i}
                                sx={
                                  isEdited
                                    ? { bgcolor: "rgba(25, 118, 210, 0.04)" }
                                    : {}
                                }
                              >
                                <TableCell>{exp.serviceName}</TableCell>
                                <TableCell>{exp.description}</TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {Number(exp.originalAmount).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={exp.amount}
                                    onChange={(e) =>
                                      handleExpenseEdit(
                                        i,
                                        "amount",
                                        e.target.value
                                      )
                                    }
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          ₹
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={{ width: 120 }}
                                    error={isEdited}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {isEdited && (
                                    <Chip
                                      size="small"
                                      label={
                                        difference > 0
                                          ? `+${difference}`
                                          : difference
                                      }
                                      color={
                                        difference < 0 ? "error" : "success"
                                      }
                                      variant="outlined"
                                      sx={{
                                        fontWeight: 600,
                                        "& .MuiChip-label": {
                                          padding: "0 8px",
                                        },
                                      }}
                                    />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box mt={2} display="flex" justifyContent="space-between">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          // Reset all expenses to their original amounts
                          const originalExpenses = editableExpenses.map(
                            (exp) => ({
                              ...exp,
                              amount: exp.originalAmount,
                            })
                          );
                          setEditableExpenses(originalExpenses);
                          const originalTotal = originalExpenses.reduce(
                            (sum, exp) => sum + Number(exp.originalAmount || 0),
                            0
                          );
                          setEditAmount(originalTotal);
                        }}
                        startIcon={<CancelIcon />}
                        sx={{
                          borderRadius: "4px",
                          fontWeight: 500,
                          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        Reset All
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={toggleExpenseEditing}
                        startIcon={<CancelIcon />}
                        sx={{
                          borderRadius: "4px",
                          fontWeight: 500,
                          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        Cancel Editing
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box mb={2}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Adjusted Total Amount"
                          type="number"
                          fullWidth
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                ₹
                              </InputAdornment>
                            ),
                          }}
                          helperText={
                            editAmount !== request.totalAmountRequested
                              ? `Original amount: ₹${request.totalAmountRequested.toLocaleString()}`
                              : ""
                          }
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={toggleExpenseEditing}
                          fullWidth
                        >
                          Edit Individual Expenses
                        </Button>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Click to modify specific expenses and automatically
                          calculate the new total
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <TextField
                  label="Admin Comment"
                  multiline
                  rows={3}
                  fullWidth
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  startIcon={
                    submitting ? <CircularProgress size={20} /> : <SendIcon />
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Review & Send to Management"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Employee
                    </Typography>
                    <Typography variant="body1">
                      {request.employee?.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.employee?.email}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box>
                      <Chip
                        label={request.status.replace(/_/g, " ")}
                        color={getStatusColor(request.status)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          textTransform: "capitalize",
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CurrencyRupeeIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body1">
                      ₹{request.totalAmountRequested?.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon sx={{ color: "#7428dc" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "#555555" }}>
                      Trip Period
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {request && request.tripStartDate
                        ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : "-"}
                      {" - "}
                      {request && request.tripEndDate
                        ? new Date(request.tripEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : "-"}
                    </Typography>
                    <Chip 
                      label={`${request.tripStartDate && request.tripEndDate ? Math.ceil((new Date(request.tripEndDate) - new Date(request.tripStartDate)) / (1000 * 60 * 60 * 24)) + 1 : 1} days`}
                      size="small"
                      sx={{ mt: 0.5, bgcolor: '#7428dc15', color: '#7428dc', fontWeight: 500 }}
                    />
                  </Box>
                  
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="caption" sx={{ color: "#555555" }}>
                      Submitted
                    </Typography>
                    <Typography variant="body2">
                      {request && request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : "-"}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </div>
          </CardContent>
        </Card>
        <Card
          variant="outlined"
          sx={{
            mb: 3,
            boxShadow: "0px 4px 12px rgba(116, 40, 220, 0.08)",
            borderRadius: 3,
          }}
          id="expenses-section"
        >
          <CardContent>
            <Typography
              variant="h6"
              fontWeight={600}
              mb={2}
              display="flex"
              alignItems="center"
            >
              <ReceiptIcon sx={{ mr: 1, color: "#7428dc" }} /> Expenses
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(116, 40, 220, 0.04)" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Original Amount
                    </TableCell>
                    {request.adminReview?.editedExpenses && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Adjusted Amount
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Bill</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.expenses.map((exp, i) => {
                    // Check if this expense was edited by admin
                    const editedExpense =
                      request.adminReview?.editedExpenses?.find(
                        (e) =>
                          e.serviceName === exp.serviceName &&
                          e.description === exp.description
                      );
                    const isEdited =
                      editedExpense &&
                      Number(editedExpense.amount) !== Number(exp.amount);

                    return (
                      <TableRow
                        key={i}
                        sx={isEdited ? { bgcolor: "rgba(0, 0, 0, 0.04)" } : {}}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          {exp.serviceName}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {exp.expenseDate 
                              ? new Date(exp.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : (request.tripStartDate 
                                ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          ₹{Number(exp.amount).toLocaleString()}
                        </TableCell>

                        {request.adminReview?.editedExpenses && (
                          <TableCell align="right">
                            {isEdited ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <Typography
                                  color={
                                    Number(editedExpense.amount) <
                                    Number(exp.amount)
                                      ? "error.main"
                                      : "success.main"
                                  }
                                  fontWeight={600}
                                >
                                  ₹
                                  {Number(
                                    editedExpense.amount
                                  ).toLocaleString()}
                                </Typography>
                                {editedExpense.amount !== exp.amount && (
                                  <Chip
                                    size="small"
                                    label={`${
                                      Number(editedExpense.amount) >
                                      Number(exp.amount)
                                        ? "+"
                                        : ""
                                    }${(
                                      Number(editedExpense.amount) -
                                      Number(exp.amount)
                                    ).toLocaleString()}`}
                                    color={
                                      Number(editedExpense.amount) <
                                      Number(exp.amount)
                                        ? "error"
                                        : "success"
                                    }
                                    sx={{
                                      ml: 1,
                                      fontWeight: 600,
                                      "& .MuiChip-label": { padding: "0 8px" },
                                      borderWidth: "1.5px",
                                    }}
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        )}

                        <TableCell>{exp.description}</TableCell>
                        <TableCell>
                          {exp.hasBill && exp.bill?.fileUrl ? (
                            <Tooltip title="View Bill">
                              <Link
                                href={exp.bill.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />
                                View
                              </Link>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              No bill
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableHead>
                  <TableRow sx={{ bgcolor: "background.default" }}>
                    <TableCell colSpan={1} sx={{ fontWeight: 600 }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹
                      {request.expenses
                        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
                        .toLocaleString()}
                    </TableCell>
                    {request.adminReview?.editedExpenses && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹
                        {request.adminReview.adjustedAmount
                          ? request.adminReview.adjustedAmount.toLocaleString()
                          : "-"}
                      </TableCell>
                    )}
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            boxShadow: "0px 4px 12px rgba(116, 40, 220, 0.08)",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ pb: 1 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              mb={2}
              display="flex"
              alignItems="center"
            >
              <HistoryIcon sx={{ mr: 1, color: "#7428dc" }} /> Workflow
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Grid item xs={12} sm={12} md={6}>
                <Card
                  sx={{
                    p: 1.5,
                    height: "100%",
                    background:
                      "linear-gradient(145deg, rgba(116, 40, 220, 0.03) 0%, rgba(103, 15, 219, 0.06) 100%)",
                    borderLeft: "4px solid #7428dc",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: "#7428dc" }}
                    mb={0.5}
                  >
                    Admin Review
                  </Typography>
                  <Box mt={1}>
                    {request.adminReview?.reviewedBy ? (
                      <>
                        <Typography variant="body2">
                          <b>By:</b>{" "}
                          {request.adminReview.reviewedBy.displayName}
                        </Typography>
                        <Typography variant="body2">
                          <b>At:</b>{" "}
                          {new Date(
                            request.adminReview.reviewedAt
                          ).toLocaleString()}
                        </Typography>
                        {request.adminReview.adjustedAmount !== undefined && (
                          <>
                            <Typography variant="body2">
                              <b>Original Amount:</b> ₹
                              {request.expenses && request.expenses.length > 0
                                ? request.expenses
                                    .reduce(
                                      (sum, exp) =>
                                        sum + Number(exp.amount || 0),
                                      0
                                    )
                                    .toLocaleString()
                                : "0"}
                            </Typography>
                            <Typography variant="body2">
                              <b>Adjusted Amount:</b> ₹
                              {request.adminReview.adjustedAmount.toLocaleString()}
                            </Typography>
                            {request.adminReview.editedExpenses && (
                              <Typography variant="body2" color="primary">
                                <Link
                                  href="#expenses"
                                  underline="hover"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document
                                      .getElementById("expenses-section")
                                      .scrollIntoView({ behavior: "smooth" });
                                  }}
                                >
                                  View edited expenses
                                </Link>
                              </Typography>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        Not reviewed yet
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    p: 1.5,
                    height: "100%",
                    background:
                      "linear-gradient(145deg, rgba(103, 15, 219, 0.03) 0%, rgba(116, 40, 220, 0.07) 100%)",
                    borderLeft:
                      request.status === "management_approved" ||
                      request.status === "management_rejected" ||
                      request.status === "paid"
                        ? "4px solid #670fdb"
                        : "4px solid #e0e0e0",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: "#670fdb" }}
                    mb={0.5}
                  >
                    Management Decision
                  </Typography>
                  <Box mt={1}>
                    {request.managementDecision?.decidedBy ? (
                      <>
                        <Typography variant="body2">
                          <b>By:</b>{" "}
                          {request.managementDecision.decidedBy.displayName}
                        </Typography>
                        <Typography variant="body2">
                          <b>At:</b>{" "}
                          {new Date(
                            request.managementDecision.decidedAt
                          ).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <b>Decision:</b>{" "}
                          <Chip
                            size="small"
                            label={request.managementDecision.decision}
                            color={
                              request.managementDecision.decision === "approved"
                                ? "success"
                                : "error"
                            }
                            sx={{
                              fontWeight: 600,
                              textTransform: "capitalize",
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        Pending decision
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    p: 1.5,
                    height: "100%",
                    background:
                      "linear-gradient(145deg, rgba(116, 40, 220, 0.05) 0%, rgba(103, 15, 219, 0.1) 100%)",
                    borderLeft:
                      request.status === "paid"
                        ? "4px solid #670fdb"
                        : "4px solid #e0e0e0",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: "#670fdb" }}
                    mb={0.5}
                  >
                    Payment
                  </Typography>
                  <Box mt={1}>
                    {request.payment?.processedBy ? (
                      <>
                        <Typography variant="body2">
                          <b>By:</b> {request.payment.processedBy.displayName}
                        </Typography>
                        <Typography variant="body2">
                          <b>At:</b>{" "}
                          {new Date(
                            request.payment.processedAt
                          ).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <b>Method:</b> {request.payment.method}
                        </Typography>
                        {request.payment.reference && (
                          <Typography variant="body2">
                            <b>Reference:</b> {request.payment.reference}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        Not processed yet
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                boxShadow: "0px 4px 12px rgba(116, 40, 220, 0.08)",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  mb={1.5}
                  display="flex"
                  alignItems="center"
                >
                  <CommentIcon sx={{ mr: 1, color: "#7428dc" }} /> Comments
                </Typography>
                {request.comments.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">
                    No comments yet
                  </Typography>
                ) : (
                  <List sx={{ py: 0 }}>
                    {request.comments.map((c, i) => (
                      <ListItem
                        key={i}
                        divider={i < request.comments.length - 1}
                        sx={{ px: 0.5, py: 0.75 }}
                        alignItems="flex-start"
                      >
                        <ListItemText
                          primary={
                            <Box
                              display="flex"
                              alignItems="center"
                              flexWrap="wrap"
                              mb={0.5}
                            >
                              <Typography
                                variant="subtitle2"
                                color="primary.main"
                                sx={{ mr: 1.5, textTransform: "capitalize" }}
                              >
                                {c.userType.replace(/_/g, " ")}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(c.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ whiteSpace: "pre-wrap" }}
                            >
                              {c.comment}
                            </Typography>
                          }
                          disableTypography
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                boxShadow: "0px 4px 12px rgba(116, 40, 220, 0.08)",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  mb={1.5}
                  display="flex"
                  alignItems="center"
                >
                  <HistoryIcon sx={{ mr: 1, color: "#7428dc" }} /> Status
                  History
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {request.statusHistory.map((h, i) => (
                    <ListItem
                      key={i}
                      divider={i < request.statusHistory.length - 1}
                      sx={{ px: 0.5, py: 0.75 }}
                      alignItems="flex-start"
                    >
                      <ListItemText
                        disableTypography
                        primary={
                          <Box
                            display="flex"
                            flexWrap="wrap"
                            alignItems="center"
                            mb={0.5}
                          >
                            <Chip
                              size="small"
                              label={h.status.replace(/_/g, " ")}
                              color={getStatusColor(h.status)}
                              sx={{
                                mr: 1.5,
                                fontWeight: 600,
                                background:
                                  h.status === "paid"
                                    ? "linear-gradient(45deg, #670fdb, #5c00cb)"
                                    : h.status === "admin_reviewed"
                                    ? "linear-gradient(45deg, #7428dc, #670fdb)"
                                    : undefined,
                                textTransform: "capitalize",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                            <Box
                              component="span"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mr: 0.5 }}
                              >
                                by
                              </Typography>
                              <Typography
                                component="span"
                                color="primary.main"
                                variant="caption"
                                fontWeight={600}
                              >
                                {h.changedBy?.displayName || "System"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                {new Date(h.changedAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          h.notes && (
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ ml: 0.5, whiteSpace: "pre-wrap" }}
                            >
                              {h.notes}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </div>
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/admin/requests")}
          startIcon={<ArrowBackIcon />}
          sx={{
            background: "linear-gradient(45deg, #7428dc, #670fdb)",
            boxShadow: "0px 2px 4px rgba(116, 40, 220, 0.15)",
            "&:hover": {
              background: "linear-gradient(45deg, #8a4be3, #7428dc)",
              boxShadow: "0px 4px 8px rgba(116, 40, 220, 0.25)",
            },
          }}
        >
          Back to Requests
        </Button>
      </Box>
    </Box>
  );
};

export default RequestDetails;
