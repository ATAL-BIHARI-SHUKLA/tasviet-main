import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Typography, Paper, Chip, CircularProgress, Button, Stack, Divider, TextField,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Card, CardContent, FormControl, InputLabel, Select, MenuItem, Grid, InputAdornment
} from "@mui/material";
import { CheckCircle, Cancel, ArrowBack, CurrencyRupee, Receipt, AccountBalance, DateRange as DateRangeIcon } from "@mui/icons-material";

const primaryColor = "#7428dc";
const primaryColorDark = "#670fdb";

export default function RequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Payment dialog state
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);
  
  const fetchRequestDetails = () => {
    setLoading(true);
    axios.get(`https://tasviet.vercel.app/api/account/requests/${requestId}`, { withCredentials: true })
      .then(res => {
        setRequest(res.data);
      })
      .catch(err => {
        console.error("Error fetching request details:", err);
      })
      .finally(() => setLoading(false));
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      await axios.post(`https://tasviet.vercel.app/api/account/requests/${requestId}/comment`, { comment }, { withCredentials: true });
      setComment("");
      // Refresh comments
      fetchRequestDetails();
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setCommentLoading(false);
    }
  };
  
  const handleOpenPaymentDialog = () => {
    setOpenPaymentDialog(true);
  };
  
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    // Reset form
    setPaymentMethod("bank_transfer");
    setTransactionId("");
    setNotes("");
    setProofFile(null);
    setPaymentError("");
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, file.type, file.size);
      setProofFile(file);
    }
  };
  
  const handleMarkAsPaid = async () => {
    if (!transactionId.trim()) {
      setPaymentError("Transaction ID is required");
      return;
    }
    
    setPaymentLoading(true);
    setPaymentError("");
    
    try {
      const formData = new FormData();
      formData.append("method", paymentMethod);
      formData.append("transactionId", transactionId);
      formData.append("notes", notes);
      
      if (proofFile) {
        console.log("Appending file to FormData:", proofFile.name, proofFile.type);
        formData.append("bill", proofFile); // Use 'bill' to match backend expectation
      } else {
        console.log("No proof file to upload");
      }
      
      // Debug FormData contents
      for (let [key, value] of formData.entries()) {
        console.log("FormData entry:", key, value);
      }
      
      console.log("Sending request to mark as paid with formData");
      
      const response = await axios.post(
        `https://tasviet.vercel.app/api/account/requests/${requestId}/paid`, 
        formData, 
        { 
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      
      console.log("Mark as paid response:", response.data);
      
      // Success - close dialog and refresh
      handleClosePaymentDialog();
      fetchRequestDetails();
      // Show success message or redirect
      navigate("/account/payment-history");
    } catch (err) {
      console.error("Error marking as paid:", err);
      console.error("Error response:", err.response?.data);
      setPaymentError(err.response?.data?.error || "Failed to process payment. Please try again.");
      setPaymentLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: "background.paper" }}>
      <Button 
        onClick={() => navigate("/account/requests")} 
        startIcon={<ArrowBack />} 
        sx={{ mb: 2, color: primaryColor }}
      >
        Back to Requests
      </Button>
      {loading || !request ? (
        <Box sx={{ textAlign: "center", py: 5 }}>
          <CircularProgress sx={{ color: primaryColor }} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                {request.title || `Request #${request.id?.slice(-6)}`}
              </Typography>
              <Chip
                label={request.status}
                color={request.status === "paid" ? "success" : "warning"}
                icon={request.status === "paid" ? <CheckCircle /> : <Cancel />}
                sx={{ mb: 2 }}
              />
            </Box>
            
            {request.status === "management_approved" && (
              <Button
                variant="contained"
                startIcon={<CurrencyRupee />}
                sx={{ 
                  bgcolor: primaryColor, 
                  "&:hover": { bgcolor: primaryColorDark },
                  mt: { xs: 2, md: 0 }
                }}
                onClick={handleOpenPaymentDialog}
              >
                Mark as Paid
              </Button>
            )}
          </Box>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper', boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Request Details
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
                    {request.description}
                  </Typography>
                  
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
                    Location
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {request.location?.address || "No location specified"}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" fontWeight={600}>
                    Expenses
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {request.expenses?.map((expense, idx) => (
                      <Box key={idx} sx={{ mb: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {expense.category}
                            </Typography>
                            <Typography variant="body2">{expense.description}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {expense.expenseDate 
                              ? new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : request.tripStartDate 
                                ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '-'}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={500} sx={{ color: primaryColor, mt: 0.5 }}>
                          ₹{expense.amount.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper', boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Payment Information
                  </Typography>
                  
                  <Box sx={{ mb: 3, p: 2, bgcolor: "#f9f4ff", borderRadius: 1, border: `1px solid ${primaryColor}` }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Amount:
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: primaryColor }}>
                      ₹{request.totalAmount?.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Requested by:
                    </Typography>
                    <Typography variant="body1">
                      {request.employee?.displayName || "Unknown Employee"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.employee?.email || ""}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Requested on:
                    </Typography>
                    <Typography variant="body1">
                      {new Date(request.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <DateRangeIcon sx={{ color: primaryColor, fontSize: 20 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Trip Period:
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {request.tripStartDate 
                        ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '-'} - {request.tripEndDate 
                        ? new Date(request.tripEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '-'}
                    </Typography>
                    <Chip
                      label={`${request.tripStartDate && request.tripEndDate 
                        ? Math.ceil((new Date(request.tripEndDate) - new Date(request.tripStartDate)) / (1000 * 60 * 60 * 24)) + 1 
                        : 1} days`}
                      size="small"
                      sx={{ mt: 0.5, bgcolor: '#7428dc15', color: '#7428dc', fontWeight: 500 }}
                    />
                  </Box>
                  
                  {request.status === "paid" && request.payment && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        Payment Details
                      </Typography>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Paid on:
                        </Typography>
                        <Typography variant="body1">
                          {new Date(request.payment.processedAt).toLocaleDateString('en-US', {
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Method:
                        </Typography>
                        <Typography variant="body1">
                          {request.payment.method === "bank_transfer" ? "Bank Transfer" : 
                           request.payment.method === "cash" ? "Cash" : 
                           request.payment.method === "upi" ? "UPI" :
                           request.payment.method === "check" ? "Check" : 
                           request.payment.method === "other" ? "Other" : 
                           request.payment.method}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Transaction ID:
                        </Typography>
                        <Typography variant="body1">
                          {request.payment.transactionId || "N/A"}
                        </Typography>
                      </Box>
                      
                      {request.payment.notes && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Notes:
                          </Typography>
                          <Typography variant="body1">
                            {request.payment.notes}
                          </Typography>
                        </Box>
                      )}
                      
                      {request.payment.proof && request.payment.proof.fileUrl && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Payment Proof:
                          </Typography>
                          <Box 
                            component="a" 
                            href={request.payment.proof.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outlined"
                              startIcon={<Receipt />}
                              size="small"
                            >
                              View Proof
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </div>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Comments
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {request.comments && request.comments.length > 0 ? (
                  request.comments.map((c, idx) => (
                    <Box key={idx} sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {c.user?.displayName || "Accountant"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{c.comment}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
                )}
              </Stack>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Add Comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  size="small"
                  multiline
                  rows={2}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  sx={{ 
                    bgcolor: primaryColor, 
                    "&:hover": { bgcolor: primaryColorDark },
                    alignSelf: "flex-start"
                  }}
                  onClick={handleAddComment}
                  disabled={commentLoading}
                >
                  {commentLoading ? "Adding..." : "Add Comment"}
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          {/* Payment Dialog */}
          <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Mark Request as Paid</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 3 }}>
                Enter payment details to mark this request as paid. This action cannot be undone.
              </DialogContentText>
              
              {paymentError && (
                <Box sx={{ bgcolor: "error.light", color: "error.main", p: 1.5, borderRadius: 1, mb: 2 }}>
                  {paymentError}
                </Box>
              )}
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                margin="normal"
                label="Transaction ID / Reference"
                fullWidth
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalance fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                label="Notes (Optional)"
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Upload Payment Proof (Optional)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Receipt />}
                >
                  Select File
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                {proofFile && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Selected: {proofFile.name}
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleClosePaymentDialog} disabled={paymentLoading}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleMarkAsPaid}
                disabled={paymentLoading}
                sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: primaryColorDark } }}
              >
                {paymentLoading ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Paper>
  );
}