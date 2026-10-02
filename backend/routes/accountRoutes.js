
import express from 'express';
import {authenticate} from '../middlewares/authenticate.js';
import {authorizeRoles} from '../middlewares/verifyRole.js';
import { getRequests, markAsPaid, getPaymentHistory, exportPaymentsCSV, exportBillRecords, getEmployeesList, getRequestDetails } from '../controllers/accountController.js';
import { 
  uploadExpenseBill, 
  processUploadedFile, 
  updateUploadedFile,
  validateFileAccess,
} from '../utils/fileUpload.js';
import Request from '../models/requestSchema.js';

const router = express.Router();

// All routes require accountant role
router.use(authenticate, authorizeRoles(['accountant']));

// Get all management-approved requests (with filters)
router.get('/requests', getRequests);

// Get specific request details with all populated fields
router.get('/requests/:id', getRequestDetails);

// Get list of employees for filtering
router.get('/employees', getEmployeesList);

// Mark a request as paid (with file upload for proof)
router.post('/requests/:id/paid', uploadExpenseBill, markAsPaid);

// File upload endpoint for accountants
router.post(
  "/upload-proof",
  uploadExpenseBill,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No proof file uploaded' });
      }
      
      const fileData = await processUploadedFile(req);
      res.json({ 
        message: 'Proof file uploaded successfully',
        file: fileData 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Proof file upload failed', 
        details: error.message 
      });
    }
  }
);

// Update proof file endpoint
router.put(
  "/update-proof/:fileId",
  uploadExpenseBill,
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No new proof file provided' });
      }
      
      const updatedFileData = await updateUploadedFile(req, fileId);
      res.json({ 
        message: 'Proof file updated successfully',
        file: updatedFileData 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Proof file update failed', 
        details: error.message 
      });
    }
  }
);

// Add a comment to a request
router.post('/requests/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const request = await Request.findById(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Add comment
    request.comments.push({
      user: req.user._id,
      userType: 'accountant',
      comment,
      timestamp: new Date()
    });
    
    await request.save();
    await request.populate('comments.user', 'displayName email userType phone');
    
    res.json({ 
      message: 'Comment added successfully',
      comments: request.comments.map(c => ({
        ...c.toObject(),
        user: c.user ? {
          id: c.user._id,
          name: c.user.displayName,
          email: c.user.email,
          role: c.user.userType,
          phone: c.user.phone || 'Not provided'
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

// Create a new request (for accountants who need to create requests on behalf of employees)
router.post('/request', async (req, res) => {
  try {
    const { title, description, expenses, location } = req.body;
    const accountantId = req.user.id;

    // Validate expenses array
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ 
        message: "Request must include at least one expense item"
      });
    }

    // Validate each expense item has required fields
    for (const item of expenses) {
      if (!item.serviceName || !item.amount) {
        return res.status(400).json({
          message: "Each expense must include serviceName and amount"
        });
      }
      
      // Check for bill data
      if (!item.bill?.fileId) {
        return res.status(400).json({
          message: "Each expense must include a bill document with fileId"
        });
      }
    }

    // Calculate total requested amount from all expenses
    const totalAmountRequested = expenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
      0
    );

    // Create new request (created by accountant)
    const newRequest = new Request({
      employee: accountantId, // Use accountant ID as the creator
      title,
      description,
      expenses,
      totalAmountRequested,
      location: location || 'Not specified',
      status: 'pending_admin_review', // Skip employee submission step
      createdBy: 'accountant', // Flag to indicate this was created by accountant
      statusHistory: [{
        status: 'pending_admin_review',
        changedBy: accountantId,
        changedAt: new Date(),
        remarks: 'Request created by accountant'
      }]
    });

    const savedRequest = await newRequest.save();
    
    // Populate the saved request with user details for response
    await savedRequest.populate('employee', 'displayName email phone userType');

    res.status(201).json({
      message: "Request created successfully by accountant",
      request: {
        id: savedRequest._id,
        title: savedRequest.title,
        description: savedRequest.description,
        status: savedRequest.status,
        totalAmountRequested: savedRequest.totalAmountRequested,
        expenses: savedRequest.expenses,
        createdAt: savedRequest.createdAt,
        employee: savedRequest.employee
      }
    });

  } catch (error) {
    console.error('Error creating request for accountant:', error);
    res.status(500).json({ 
      message: "Failed to create request", 
      error: error.message 
    });
  }
});

// Get payment history for an employee (with filters for month/year)
router.get('/payment-history', getPaymentHistory);

// Get payment statistics (total, monthly, yearly)
router.get('/payment-stats', async (req, res) => {
  try {
    const { year } = req.query;
    
    // Base filter for paid requests
    const filter = { status: 'paid' };
    
    // Get total payments
    const totalPayments = await Request.countDocuments(filter);
    
    // Get total amount paid
    const amountAggregation = await Request.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$totalAmountRequested" } } }
    ]);
    
    const totalAmountPaid = amountAggregation.length > 0 ? amountAggregation[0].total : 0;
    
    // Get monthly data for the specified year
    const monthlyData = [];
    if (year) {
      const startYear = new Date(year, 0, 1);
      const endYear = new Date(year, 11, 31, 23, 59, 59, 999);
      
      // Get monthly statistics
      for (let month = 0; month < 12; month++) {
        const startMonth = new Date(year, month, 1);
        const endMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        const monthlyFilter = { 
          status: 'paid',
          'payment.processedAt': { 
            $gte: startMonth, 
            $lte: endMonth 
          } 
        };
        
        const countForMonth = await Request.countDocuments(monthlyFilter);
        
        const monthlyAmount = await Request.aggregate([
          { $match: monthlyFilter },
          { $group: { _id: null, total: { $sum: "$totalAmountRequested" } } }
        ]);
        
        monthlyData.push({
          month: month + 1,
          count: countForMonth,
          amount: monthlyAmount.length > 0 ? monthlyAmount[0].total : 0
        });
      }
    }
    
    res.json({
      totalPayments,
      totalAmountPaid,
      monthlyData
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment stats', details: err.message });
  }
});

// Export payment transactions for an employee as CSV
router.get('/export', exportPaymentsCSV);

// Export collective bill records for an employee with date/trip range filter
router.get('/export-bills', exportBillRecords);

// Export payment transactions in yearly or monthly format
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { year, month } = req.query;
    
    if (!year) {
      return res.status(400).json({ error: 'Year parameter is required' });
    }
    
    const filter = { status: 'paid' };
    
    // Apply date filters based on format
    if (format === 'yearly') {
      const startYear = new Date(year, 0, 1);
      const endYear = new Date(year, 11, 31, 23, 59, 59, 999);
      filter['payment.processedAt'] = {
        $gte: startYear,
        $lte: endYear
      };
    } else if (format === 'monthly' && month) {
      const startMonth = new Date(year, month - 1, 1);
      const endMonth = new Date(year, month, 0, 23, 59, 59, 999);
      filter['payment.processedAt'] = {
        $gte: startMonth,
        $lte: endMonth
      };
    } else {
      return res.status(400).json({ error: 'Invalid format or missing month parameter' });
    }
    
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email userType')
      .populate('adminReview.reviewedBy', 'displayName email userType')
      .populate('managementDecision.decidedBy', 'displayName email userType')
      .populate('payment.processedBy', 'displayName email userType')
      .sort({ 'payment.processedAt': -1 });
      
    // Format data for CSV export
    const data = requests.map(r => ({
      id: r._id,
      title: r.title,
      employee: r.employee?.displayName,
      email: r.employee?.email,
      totalAmountRequested: r.totalAmountRequested,
      adminReviewedAmount: r.adminReview?.adjustedAmount || r.totalAmountRequested,
      adminReviewer: r.adminReview?.reviewedBy?.displayName || 'N/A',
      managementApprover: r.managementDecision?.decidedBy?.displayName || 'N/A',
      accountant: r.payment?.processedBy?.displayName || 'N/A',
      paymentMethod: r.payment?.method || 'N/A',
      transactionId: r.payment?.transactionId || 'N/A',
      paidAt: r.payment?.processedAt ? new Date(r.payment.processedAt).toLocaleDateString() : 'N/A',
      notes: r.payment?.notes || 'N/A'
    }));
    
    // Generate CSV
    const parser = new Parser();
    const csv = parser.parse(data);
    
    // Set up the response for CSV download
    const fileName = format === 'yearly' ? 
      `payments_${year}.csv` : 
      `payments_${year}_${month}.csv`;
      
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
    
  } catch (err) {
    res.status(500).json({ error: 'Failed to export payments', details: err.message });
  }
});

// Proxy/redirect to Google Drive file (updated for new system)
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Validate file access
    const validation = await validateFileAccess(fileId);
    
    if (!validation.isValid) {
      return res.status(404).json({ error: 'File not found or inaccessible' });
    }
    
    // Redirect to Google Drive direct link
    res.redirect(validation.directLink);
    
  } catch (error) {
    console.error('File access error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Get file info without redirecting
router.get('/file-info/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const validation = await validateFileAccess(fileId);
    res.json(validation);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get file info', 
      details: error.message 
    });
  }
});

export default router;