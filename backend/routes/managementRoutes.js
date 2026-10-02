
import express from 'express';
import { 
  getRequests, 
  approveRequest, 
  rejectRequest, 
  getEmployeeStats,
  getEmployeeDetails, 
  exportRequestsCSV 
} from '../controllers/managementController.js';
import {authenticate} from '../middlewares/authenticate.js';
import {authorizeRoles} from '../middlewares/verifyRole.js';
import Request from '../models/requestSchema.js';

const router = express.Router();

// All routes require management role
router.use(authenticate, authorizeRoles(['management']));

// Get all requests (with filters)
router.get('/requests', getRequests);

// Get specific request with full details
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('employee', 'displayName email phone')
      .populate('adminReview.reviewedBy', 'displayName email phone')
      .populate('managementDecision.decidedBy', 'displayName email phone')
      .populate('payment.processedBy', 'displayName email phone')
      .populate('comments.user', 'displayName email userType')
      .populate('statusHistory.changedBy', 'displayName email userType');
      
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Format for management view — expose full expense details including bills
    const result = {
      ...request.toObject(),
      // Backward compat: fall back to createdAt for legacy requests without trip dates
      tripStartDate: request.tripStartDate || request.createdAt,
      tripEndDate: request.tripEndDate || request.createdAt,
      adjustedAmount: request.adminReview?.adjustedAmount !== undefined 
        ? request.adminReview.adjustedAmount 
        : request.totalAmountRequested,
      // Format user references
      employee: request.employee ? {
        name: request.employee.displayName,
        email: request.employee.email,
        phone: request.employee.phone || 'Not provided'
      } : null,
      adminReview: request.adminReview ? {
        ...request.adminReview,
        reviewedBy: request.adminReview.reviewedBy ? {
          name: request.adminReview.reviewedBy.displayName,
          email: request.adminReview.reviewedBy.email,
          phone: request.adminReview.reviewedBy.phone || 'Not provided'
        } : null
      } : null
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch request', details: error.message });
  }
});

// Add a comment to request
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
    
    // Ensure comments array exists
    if (!request.comments) {
      request.comments = [];
    }
    
    // Create a new comment with all required fields
    const newComment = {
      user: req.user.id, // The correct user ID from auth middleware
      userType: 'management',
      comment: comment.trim(),
      timestamp: new Date()
    };
    
    console.log('Adding comment in route handler:', newComment);
    
    // Add to comments array
    request.comments.push(newComment);
    
    try {
      // Manually validate before saving
      const validationError = request.validateSync();
      if (validationError) {
        console.error('Validation error before save:', validationError);
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationError.message 
        });
      }
      
      await request.save();
      console.log('Comment saved successfully');
      await request.populate('comments.user', 'displayName email userType phone');
    } catch (saveErr) {
      console.error('Error saving comment:', saveErr);
      if (saveErr.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: saveErr.message
        });
      }
      throw saveErr;
    }
    
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

// Approve a request
router.post('/requests/:id/approve', approveRequest);

// Reject a request
router.post('/requests/:id/reject', rejectRequest);

// Get employee stats
router.get('/employee-stats', getEmployeeStats);

// Get employee details with requests
router.get('/employees/:id', getEmployeeDetails);

// Export requests or stats as CSV
router.get('/export', exportRequestsCSV);

export default router;
