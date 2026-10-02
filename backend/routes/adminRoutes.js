import express from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/verifyRole.js';
import { 
  reviewRequest, 
  managementDecision, 
  markPaymentStatus, 
  getAllEmployees, 
  getAllRequests, 
  getRequestsByStatus, 
  exportRequestsCsv,
  getRequestById
} from '../controllers/adminController.js';
// Get all employees with their requests
const adminRouter = express.Router();
import { getEmployeeRequests, exportEmployeeRequestsCsv } from '../controllers/adminController.js';
// Get all requests for a specific employee
adminRouter.get(
  '/employee/:employeeId/requests',
  authenticate,
  authorizeRoles(['admin']),
  getEmployeeRequests
);

// Export all requests for a specific employee as CSV
adminRouter.get(
  '/employee/:employeeId/requests/export/csv',
  authenticate,
  authorizeRoles(['admin']),
  exportEmployeeRequestsCsv
);
adminRouter.get(
  '/employees',
  authenticate,
  authorizeRoles(['admin']),
  getAllEmployees
);

// Get all requests with filters
adminRouter.get(
  '/requests',
  authenticate,
  authorizeRoles(['admin']),
  getAllRequests
);

// Get a specific request by ID
adminRouter.get(
  '/request/:requestId',
  authenticate,
  authorizeRoles(['admin']),
  getRequestById
);

// Add a comment to a request
adminRouter.post(
  '/request/:requestId/comment',
  authenticate,
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { comment } = req.body;
      
      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: 'Comment text is required' });
      }
      
      const request = await Request.findById(requestId);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      // Add comment
      request.comments.push({
        user: req.user._id,
        userType: 'admin',
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
  }
);

// Get requests by status (pending, management_approved, paid, etc.)
adminRouter.get(
  '/requests/status/:status',
  authenticate,
  authorizeRoles(['admin']),
  getRequestsByStatus
);

// Export requests as CSV
adminRouter.get(
  '/requests/export/csv',
  authenticate,
  authorizeRoles(['admin']),
  exportRequestsCsv
);


// Admin reviews/edits and passes to management
adminRouter.patch(
  '/request/:requestId/review',
  authenticate,
  authorizeRoles(['admin']),
  reviewRequest
);

// Management approves/rejects
adminRouter.patch(
  '/request/:requestId/decision',
  authenticate,
  authorizeRoles(['management']),
  managementDecision
);

// Accounts marks payment status
adminRouter.patch(
  '/request/:requestId/payment',
  authenticate,
  authorizeRoles(['accounts']),
  markPaymentStatus
);

export default adminRouter;
