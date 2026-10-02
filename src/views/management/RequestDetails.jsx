import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert,
  TextField,
  MenuItem,
  Grid,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Link,
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { 
  MdCheck, 
  MdClose, 
  MdCurrencyRupee, 
  MdComment, 
  MdSend,
  MdPerson,
  MdEmail,
  MdPhone,
  MdAccessTime,
  MdWarning,
  MdDateRange
} from 'react-icons/md';
import ReceiptIcon from "@mui/icons-material/Receipt";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CommentIcon from "@mui/icons-material/Comment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Common phrases for management comments
const COMMON_PHRASES = [
  "Approved as per company policy",
  "Request requires more documentation",
  "Expenses are justified and reasonable",
  "Please provide additional information",
  "Approved with adjustments as noted",
  "Rejected due to policy violation",
  "Approved for payment processing",
  "Expense claims verified and validated"
];

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [selectedPhrase, setSelectedPhrase] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`https://tasviet.vercel.app/api/management/requests/${id}`, { withCredentials: true })
      .then(res => {
        setRequest(res.data);
        if (res.data.comments) {
          setComments(res.data.comments);
        }
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to fetch request'))
      .finally(() => setLoading(false));
  }, [id]);
  
  // Handle comment phrase selection
  const handlePhraseChange = (event) => {
    const phrase = event.target.value;
    setSelectedPhrase(phrase);
    setComment(phrase);
  };

  const handleAction = async (type) => {
    setActionLoading(true);
    try {
      // Prepare the payload - only include comment if there's actual content
      const payload = { 
        notes: notes || '' // Ensure notes is never undefined
      };
      
      // Only include the comment if it has content
      const trimmedComment = comment ? comment.trim() : '';
      if (trimmedComment) {
        payload.comment = trimmedComment;
        console.log('Including comment in payload:', payload.comment);
      } else {
        console.log('No comment included in payload');
        // Make sure we don't send undefined or empty comment
        delete payload.comment;
      }
      
      console.log(`Sending ${type} request with payload:`, payload);
      
      // Make the API call
      const response = await axios.post(`https://tasviet.vercel.app/api/management/requests/${id}/${type}`, payload, { 
        withCredentials: true 
      });
      
      console.log(`${type} request succeeded:`, response.data);
      
      // Navigate back to requests list on success
      navigate('/management/requests');
    } catch (err) {
      // Display error from API or fallback message
      console.error(`Error in ${type} request:`, err.response?.data || err);
      
      // Log more detailed error information
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        console.error('Error response data:', err.response.data);
      }
      
      setError(err.response?.data?.error || `Failed to ${type} request`);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setCommentLoading(true);
    try {
      const response = await axios.post(
        `https://tasviet.vercel.app/api/management/requests/${id}/comment`, 
        { comment }, 
        { withCredentials: true }
      );
      setComments(response.data.comments);
      setComment('');
      setSelectedPhrase('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress color="primary" />
    </Box>
  );
  
  if (error) return (
    <Alert 
      severity="error" 
      sx={{ 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 4,
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
    >
      {error}
    </Alert>
  );
  
  if (!request) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Typography color="text.secondary" variant="h6">Request not found</Typography>
    </Box>
  );

  // Get adjusted amount from admin review
  const adjustedAmount = request.adminReview?.adjustedAmount !== undefined 
    ? request.adminReview.adjustedAmount 
    : request.totalAmountRequested;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'admin_reviewed': return 'primary';
      case 'management_approved': return 'success';
      case 'management_rejected': return 'error';
      case 'paid': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', bgcolor: '#f5f5f7' }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#7428dc' }}>
          Request Details
        </Typography>
        <Typography variant="body1" sx={{ color: '#555555' }} fontFamily="monospace">
          ID: {request._id}
        </Typography>
      </Box>

      {/* Management Action Card — only for admin_reviewed requests */}
      {request.status === 'admin_reviewed' && (
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'rgba(116, 40, 220, 0.05)', borderColor: '#7428dc', boxShadow: '0 4px 12px rgba(116, 40, 220, 0.08)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <MdWarning style={{ marginRight: 8, color: '#f59e0b' }} />
              Management Action Required
            </Typography>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
              You are approving the adjusted amount of ₹{adjustedAmount}.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select common phrase</InputLabel>
                  <Select value={selectedPhrase} label="Select common phrase" onChange={handlePhraseChange}>
                    <MenuItem value=""><em>Custom comment</em></MenuItem>
                    {COMMON_PHRASES.map((phrase, index) => (
                      <MenuItem key={index} value={phrase}>{phrase}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select a predefined comment or write your own</FormHelperText>
                </FormControl>
                <TextField fullWidth multiline rows={2} label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add your comment on this request" sx={{ mb: 3 }} InputProps={{ startAdornment: <MdComment style={{ marginRight: 8, color: '#666' }} /> }} />
                <TextField fullWidth multiline rows={3} label="Decision Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add detailed notes about your decision (optional)" sx={{ mb: 3 }} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="success" startIcon={<MdCheck />} onClick={() => handleAction('approve')} disabled={actionLoading} sx={{ fontWeight: 'bold', py: 1.5, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
                {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Approve Request'}
              </Button>
              <Button variant="contained" color="error" startIcon={<MdClose />} onClick={() => handleAction('reject')} disabled={actionLoading} sx={{ fontWeight: 'bold', py: 1.5, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Reject Request'}
              </Button>
              <Button variant="outlined" startIcon={<MdComment />} onClick={handleAddComment} disabled={!comment.trim() || commentLoading} sx={{ ml: { xs: 0, sm: 'auto' }, fontWeight: 'bold', py: 1.5 }}>
                {commentLoading ? <CircularProgress size={24} color="inherit" /> : 'Add Comment Only'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Request Overview — mirroring Admin layout */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
            {request.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {request.description}
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Employee</Typography>
                  <Typography variant="body1">{request.employee?.name || request.employee?.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">{request.employee?.email}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip label={request.status.replace(/_/g, ' ')} color={getStatusColor(request.status)} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', '& .MuiChip-label': { px: 1 } }} />
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CurrencyRupeeIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="body1">₹{(request.totalAmountRequested || adjustedAmount)?.toLocaleString()}</Typography>
                  {request.adminReview?.adjustedAmount !== undefined && request.adminReview.adjustedAmount !== request.totalAmountRequested && (
                    <Typography variant="caption" color="primary">Adjusted: ₹{request.adminReview.adjustedAmount?.toLocaleString()}</Typography>
                  )}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon sx={{ color: '#7428dc' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#555555' }}>Trip Period</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {request.tripStartDate ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                    {' - '}
                    {request.tripEndDate ? new Date(request.tripEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                  </Typography>
                  <Chip label={`${request.tripStartDate && request.tripEndDate ? Math.ceil((new Date(request.tripEndDate) - new Date(request.tripStartDate)) / (1000 * 60 * 60 * 24)) + 1 : 1} days`} size="small" sx={{ mt: 0.5, bgcolor: '#7428dc15', color: '#7428dc', fontWeight: 500 }} />
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="caption" sx={{ color: '#555555' }}>Submitted</Typography>
                  <Typography variant="body2">{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-'}</Typography>
                </Box>
              </Stack>
            </Grid>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table with Bills — mirroring Admin */}
      {request.expenses && request.expenses.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3, boxShadow: '0px 4px 12px rgba(116, 40, 220, 0.08)', borderRadius: 3 }} id="expenses-section">
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center">
              <ReceiptIcon sx={{ mr: 1, color: '#7428dc' }} /> Expenses
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(116, 40, 220, 0.04)' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Original Amount</TableCell>
                    {request.adminReview?.editedExpenses && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Adjusted Amount</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Bill</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.expenses.map((exp, i) => {
                    const editedExpense = request.adminReview?.editedExpenses?.find(
                      (e) => e.serviceName === exp.serviceName && e.description === exp.description
                    );
                    const isEdited = editedExpense && Number(editedExpense.amount) !== Number(exp.amount);

                    return (
                      <TableRow key={i} sx={isEdited ? { bgcolor: 'rgba(0, 0, 0, 0.04)' } : {}}>
                        <TableCell sx={{ fontWeight: 500 }}>{exp.serviceName}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {exp.expenseDate 
                              ? new Date(exp.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : (request.tripStartDate 
                                ? new Date(request.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">₹{Number(exp.amount).toLocaleString()}</TableCell>
                        {request.adminReview?.editedExpenses && (
                          <TableCell align="right">
                            {isEdited ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Typography color={Number(editedExpense.amount) < Number(exp.amount) ? 'error.main' : 'success.main'} fontWeight={600}>
                                  ₹{Number(editedExpense.amount).toLocaleString()}
                                </Typography>
                                {editedExpense.amount !== exp.amount && (
                                  <Chip size="small" label={`${Number(editedExpense.amount) > Number(exp.amount) ? '+' : ''}${(Number(editedExpense.amount) - Number(exp.amount)).toLocaleString()}`} color={Number(editedExpense.amount) < Number(exp.amount) ? 'error' : 'success'} sx={{ ml: 1, fontWeight: 600, '& .MuiChip-label': { padding: '0 8px' }, borderWidth: '1.5px' }} variant="outlined" />
                                )}
                              </Box>
                            ) : '—'}
                          </TableCell>
                        )}
                        <TableCell>{exp.description}</TableCell>
                        <TableCell>
                          {exp.hasBill && exp.bill?.fileUrl ? (
                            <Tooltip title="View Bill">
                              <Link href={exp.bill.fileUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center' }}>
                                <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />
                                View
                              </Link>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No bill</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{request.expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toLocaleString()}
                    </TableCell>
                    {request.adminReview?.editedExpenses && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{request.adminReview.adjustedAmount ? request.adminReview.adjustedAmount.toLocaleString() : '-'}
                      </TableCell>
                    )}
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Workflow Cards — mirroring Admin */}
      <Card variant="outlined" sx={{ mb: 3, boxShadow: '0px 4px 12px rgba(116, 40, 220, 0.08)', borderRadius: 3 }}>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center">
            <HistoryIcon sx={{ mr: 1, color: '#7428dc' }} /> Workflow
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Grid item xs={12} sm={12} md={6}>
              <Card sx={{ p: 1.5, height: '100%', background: 'linear-gradient(145deg, rgba(116, 40, 220, 0.03) 0%, rgba(103, 15, 219, 0.06) 100%)', borderLeft: '4px solid #7428dc', borderRadius: '8px' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#7428dc' }} mb={0.5}>Admin Review</Typography>
                <Box mt={1}>
                  {request.adminReview?.reviewedBy ? (
                    <>
                      <Typography variant="body2"><b>By:</b> {request.adminReview.reviewedBy.name || request.adminReview.reviewedBy.displayName}</Typography>
                      <Typography variant="body2"><b>At:</b> {new Date(request.adminReview.reviewedAt).toLocaleString()}</Typography>
                      {request.adminReview.adjustedAmount !== undefined && (
                        <>
                          <Typography variant="body2"><b>Original Amount:</b> ₹{request.expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toLocaleString()}</Typography>
                          <Typography variant="body2"><b>Adjusted Amount:</b> ₹{request.adminReview.adjustedAmount.toLocaleString()}</Typography>
                          {request.adminReview.editedExpenses && (
                            <Typography variant="body2" color="primary">
                              <Link href="#expenses" underline="hover" onClick={(e) => { e.preventDefault(); document.getElementById('expenses-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                View edited expenses
                              </Link>
                            </Typography>
                          )}
                        </>
                      )}
                      {request.adminReview.notes && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}><b>Notes:</b> {request.adminReview.notes}</Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.disabled">Not reviewed yet</Typography>
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 1.5, height: '100%', background: 'linear-gradient(145deg, rgba(103, 15, 219, 0.03) 0%, rgba(116, 40, 220, 0.07) 100%)', borderLeft: (request.status === 'management_approved' || request.status === 'management_rejected' || request.status === 'paid') ? '4px solid #670fdb' : '4px solid #e0e0e0', borderRadius: '8px' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#670fdb' }} mb={0.5}>Management Decision</Typography>
                <Box mt={1}>
                  {request.managementDecision?.decidedBy ? (
                    <>
                      <Typography variant="body2"><b>By:</b> {request.managementDecision.decidedBy.name || request.managementDecision.decidedBy.displayName}</Typography>
                      <Typography variant="body2"><b>At:</b> {new Date(request.managementDecision.decidedAt).toLocaleString()}</Typography>
                      <Typography variant="body2"><b>Decision:</b>{' '}
                        <Chip size="small" label={request.managementDecision.decision || (request.status === 'management_approved' ? 'approved' : 'rejected')} color={request.status === 'management_approved' ? 'success' : 'error'} sx={{ fontWeight: 600, textTransform: 'capitalize', '& .MuiChip-label': { px: 1 } }} />
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.disabled">Pending decision</Typography>
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 1.5, height: '100%', background: 'linear-gradient(145deg, rgba(116, 40, 220, 0.05) 0%, rgba(103, 15, 219, 0.1) 100%)', borderLeft: request.status === 'paid' ? '4px solid #670fdb' : '4px solid #e0e0e0', borderRadius: '8px' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#670fdb' }} mb={0.5}>Payment</Typography>
                <Box mt={1}>
                  {request.payment?.processedBy ? (
                    <>
                      <Typography variant="body2"><b>By:</b> {request.payment.processedBy.name || request.payment.processedBy.displayName}</Typography>
                      <Typography variant="body2"><b>At:</b> {new Date(request.payment.processedAt).toLocaleString()}</Typography>
                      <Typography variant="body2"><b>Method:</b> {request.payment.method}</Typography>
                      {request.payment.reference && (
                        <Typography variant="body2"><b>Reference:</b> {request.payment.reference}</Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.disabled">Not processed yet</Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          </div>
        </CardContent>
      </Card>

      {/* Comments & Status History — two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%', boxShadow: '0px 4px 12px rgba(116, 40, 220, 0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} mb={1.5} display="flex" alignItems="center">
                <CommentIcon sx={{ mr: 1, color: '#7428dc' }} /> Comments ({comments.length})
              </Typography>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.disabled">No comments yet</Typography>
              ) : (
                <List sx={{ py: 0 }}>
                  {comments.map((c, i) => (
                    <ListItem key={i} divider={i < comments.length - 1} sx={{ px: 0.5, py: 0.75 }} alignItems="flex-start">
                      <ListItemText disableTypography
                        primary={
                          <Box display="flex" alignItems="center" flexWrap="wrap" mb={0.5}>
                            <Typography variant="subtitle2" color="primary.main" sx={{ mr: 1.5, textTransform: 'capitalize' }}>
                              {c.user?.role || c.userType || 'user'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(c.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                            {c.comment}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Inline comment form when NOT admin_reviewed (action card handles that case) */}
              {request.status !== 'admin_reviewed' && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Divider />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Select common phrase</InputLabel>
                    <Select value={selectedPhrase} label="Select common phrase" onChange={handlePhraseChange}>
                      <MenuItem value=""><em>Custom comment</em></MenuItem>
                      {COMMON_PHRASES.map((phrase, index) => (
                        <MenuItem key={index} value={phrase}>{phrase}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField fullWidth placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} variant="outlined" size="medium" />
                    <IconButton color="primary" onClick={handleAddComment} disabled={!comment.trim() || commentLoading} sx={{ bgcolor: 'primary.main', color: 'white', width: 45, height: 45, borderRadius: '100%', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' } }}>
                      {commentLoading ? <CircularProgress size={20} color="inherit" /> : <MdSend />}
                    </IconButton>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%', boxShadow: '0px 4px 12px rgba(116, 40, 220, 0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} mb={1.5} display="flex" alignItems="center">
                <HistoryIcon sx={{ mr: 1, color: '#7428dc' }} /> Status History
              </Typography>
              {request.statusHistory && request.statusHistory.length > 0 ? (
                <List dense sx={{ py: 0 }}>
                  {request.statusHistory.map((h, i) => (
                    <ListItem key={i} divider={i < request.statusHistory.length - 1} sx={{ px: 0.5, py: 0.75 }} alignItems="flex-start">
                      <ListItemText disableTypography
                        primary={
                          <Box display="flex" flexWrap="wrap" alignItems="center" mb={0.5}>
                            <Chip size="small" label={h.status.replace(/_/g, ' ')} color={getStatusColor(h.status)} sx={{ mr: 1.5, fontWeight: 600, textTransform: 'capitalize', '& .MuiChip-label': { px: 1 } }} />
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>by</Typography>
                              <Typography component="span" color="primary.main" variant="caption" fontWeight={600}>
                                {h.changedBy?.displayName || h.changedBy?.name || 'System'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                {new Date(h.changedAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={h.notes && <Typography variant="body2" color="text.primary" sx={{ ml: 0.5, whiteSpace: 'pre-wrap' }}>{h.notes}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.disabled">No status history available.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </div>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/management/requests')} startIcon={<ArrowBackIcon />} sx={{ background: 'linear-gradient(45deg, #7428dc, #670fdb)', boxShadow: '0px 2px 4px rgba(116, 40, 220, 0.15)', '&:hover': { background: 'linear-gradient(45deg, #8a4be3, #7428dc)', boxShadow: '0px 4px 8px rgba(116, 40, 220, 0.25)' } }}>
          Back to Requests
        </Button>
      </Box>
    </Box>
  );
};

export default RequestDetails;
