// Get all requests for a specific employee (with filters)
import Request from "../models/requestSchema.js";
import User from "../models/userModel.js";
import { Parser as Json2csvParser } from 'json2csv';

// Helper function to format user references consistently
const formatUserReference = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    name: user.displayName,
    email: user.email,
    phone: user.phone || 'Not provided'
  };
};
export const getEmployeeRequests = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, from, to, page = 1, limit = 10 } = req.query;
    const filter = { employee: employeeId };
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Request.countDocuments(filter);
    
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email')
      .populate('adminReview.reviewedBy', 'displayName email')
      .populate('managementDecision.decidedBy', 'displayName email')
      .populate('payment.processedBy', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
      
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({ 
      requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export all requests for a specific employee as CSV
export const exportEmployeeRequestsCsv = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, from, to } = req.query;
    const filter = { employee: employeeId };
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email')
      .sort({ createdAt: -1 });
    const data = requests.map(r => ({
      id: r._id,
      employee: r.employee?.displayName || '',
      email: r.employee?.email || '',
      status: r.status,
      originalAmount: r.totalAmountRequested || '',
      adjustedAmount: r.adminReview?.adjustedAmount !== undefined ? r.adminReview.adjustedAmount : '',
      finalAmount: r.finalAmount || r.totalAmountRequested,
      tripStartDate: r.tripStartDate || r.createdAt,
      tripEndDate: r.tripEndDate || r.createdAt,
      createdAt: r.createdAt,
      ...((r.payment && r.payment.method) ? { paymentMethod: r.payment.method } : {}),
    }));
    const parser = new Json2csvParser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('employee_requests.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Admin reviews and edits request, then passes to management
export const reviewRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
  const { editedAmount, adminComment, editedExpenses } = req.body;
    const adminId = req.user.id;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request is not pending" });

    // If admin provides edited expenses, update them and recalculate total
    let adjustedAmount = request.totalAmountRequested;
    if (Array.isArray(editedExpenses) && editedExpenses.length === request.expenses.length) {
      // Create edited expenses separately without changing the original expenses
      const originalExpenses = [...request.expenses];
      const updatedExpenses = editedExpenses.map((exp, idx) => ({
        ...request.expenses[idx]._doc,
        ...exp,
        amount: Number(exp.amount) || 0
      }));
      
      // Calculate the adjusted amount based on edited expenses
      adjustedAmount = updatedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      
      request.adminReview = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adjustedAmount: adjustedAmount,
        notes: adminComment || "Reviewed and passed to management",
        editedExpenses: updatedExpenses.map(e => ({
          serviceName: e.serviceName,
          amount: e.amount,
          description: e.description,
          bill: e.bill
        }))
      };
    } else if (editedAmount !== undefined && editedAmount !== "") {
      adjustedAmount = Number(editedAmount);
      request.adminReview = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adjustedAmount: adjustedAmount,
        notes: adminComment || "Reviewed and passed to management"
      };
    } else {
      request.adminReview = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adjustedAmount: undefined,
        notes: adminComment || "Reviewed and passed to management"
      };
    }
    // Explicitly set the finalAmount to match the admin's adjustment
    request.finalAmount = request.adminReview.adjustedAmount;
    
    request.status = "admin_reviewed";
    request.statusHistory.push({
      status: request.status,
      changedBy: adminId,
      changedAt: new Date(),
      notes: adminComment || "Reviewed and passed to management"
    });
    // Add comment if provided
    if (adminComment && adminComment.trim()) {
      request.comments.push({
        user: adminId,
        userType: 'admin',
        comment: adminComment,
        timestamp: new Date()
      });
    }
    
    await request.save();
    
    // Populate all user references for response
    await request.populate([
      { path: 'employee', select: 'displayName email phone' },
      { path: 'adminReview.reviewedBy', select: 'displayName email phone' },
      { path: 'managementDecision.decidedBy', select: 'displayName email phone' },
      { path: 'payment.processedBy', select: 'displayName email phone' },
      { path: 'comments.user', select: 'displayName email userType' },
      { path: 'statusHistory.changedBy', select: 'displayName email userType' }
    ]);
    
    // Format the response for better readability
    const formattedRequest = {
      ...request.toObject(),
      employee: request.employee ? {
        id: request.employee._id,
        name: request.employee.displayName,
        email: request.employee.email,
        phone: request.employee.phone || 'Not provided'
      } : null,
      adminReview: request.adminReview ? {
        ...request.adminReview.toObject(),
        reviewedBy: request.adminReview.reviewedBy ? {
          id: request.adminReview.reviewedBy._id,
          name: request.adminReview.reviewedBy.displayName,
          email: request.adminReview.reviewedBy.email,
          phone: request.adminReview.reviewedBy.phone || 'Not provided'
        } : null
      } : null,
      comments: request.comments?.map(c => ({
        ...c.toObject(),
        user: c.user ? {
          id: c.user._id,
          name: c.user.displayName,
          email: c.user.email,
          role: c.user.userType
        } : null
      }))
    };
    
    res.json({ message: "Request reviewed and passed to management", request: formattedRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
// Export requests as CSV (with filters)
export const exportRequestsCsv = async (req, res) => {
  try {
    const { status, employee, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    
    // Populate all relevant fields for the export
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email phone department position')
      .populate('adminReview.reviewedBy', 'displayName email phone')
      .populate('managementDecision.decidedBy', 'displayName email phone')
      .populate('payment.processedBy', 'displayName email phone')
      .sort({ createdAt: -1 });
      
    // Flatten data for CSV, include comprehensive details
    const data = requests.map(r => {
      // Get services details
      const servicesDetails = r.expenses?.map(exp => 
        `${exp.serviceName}: ₹${exp.amount} (${exp.description || 'No description'})`
      ).join(' | ') || 'No services details';
      
      // Calculate original amount from expenses
      const originalAmount = r.expenses && r.expenses.length > 0
        ? r.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
        : 0;
        
      // Format trip details
      const tripDetails = r.location ? `Location: ${r.location}` : 'No trip details';
      
      // Payment status
      const paymentStatus = r.status === 'paid' ? 'Paid' : 
        (r.status === 'payment_pending' ? 'Pending Payment' : 'Not Ready for Payment');
      
      return {
        requestId: r._id,
        title: r.title,
        description: r.description,
        servicesDetails: servicesDetails,
        tripDetails: tripDetails,
        
        // Employee details
        employeeName: r.employee?.displayName || 'Unknown',
        employeeEmail: r.employee?.email || 'Unknown',
        employeePhone: r.employee?.phone || 'Not provided',
        employeeDepartment: r.employee?.department || 'Not specified',
        employeePosition: r.employee?.position || 'Not specified',
        
        // Request amounts
        originalAmount: originalAmount,
        amountRequested: r.totalAmountRequested,
        amountAdjusted: r.adminReview?.adjustedAmount !== undefined 
          ? r.adminReview.adjustedAmount 
          : 'No adjustment',
        finalAmount: r.adminReview?.adjustedAmount !== undefined 
          ? r.adminReview.adjustedAmount 
          : r.totalAmountRequested,
        
        // Admin review details
        adminReviewerName: r.adminReview?.reviewedBy?.displayName || 'Not reviewed',
        adminReviewerEmail: r.adminReview?.reviewedBy?.email || 'Not available',
        adminReviewNotes: r.adminReview?.notes || 'No notes',
        adminReviewDate: r.adminReview?.reviewedAt ? new Date(r.adminReview.reviewedAt).toLocaleString() : 'Not reviewed',
        
        // Management decision details
        managementDecisionBy: r.managementDecision?.decidedBy?.displayName || 'No decision',
        managementDecisionEmail: r.managementDecision?.decidedBy?.email || 'Not available',
        managementDecisionNotes: r.managementDecision?.notes || 'No notes',
        managementDecisionDate: r.managementDecision?.decidedAt ? new Date(r.managementDecision.decidedAt).toLocaleString() : 'No decision',
        
        // Payment details
        paymentStatus: paymentStatus,
        paymentProcessedBy: r.payment?.processedBy?.displayName || 'Not processed',
        paymentProcessedByEmail: r.payment?.processedBy?.email || 'Not available',
        paymentMethod: r.payment?.method || 'Not specified',
        paymentTransactionId: r.payment?.transactionId || 'Not available',
        paymentNotes: r.payment?.notes || 'No notes',
        paymentDate: r.payment?.processedAt ? new Date(r.payment.processedAt).toLocaleString() : 'Not processed',
        
        // Request metadata
        status: r.status,
        requestDate: new Date(r.createdAt).toLocaleString(),
        lastUpdated: new Date(r.updatedAt).toLocaleString()
      };
    });
    
    const parser = new Json2csvParser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('admin-requests-export.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// import { Parser as Json2csvParser } from 'json2csv';

// Get a specific request by ID
export const getRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId)
      .populate('employee', 'displayName email phone')
      .populate('adminReview.reviewedBy', 'displayName email phone')
      .populate('managementDecision.decidedBy', 'displayName email phone')
      .populate('payment.processedBy', 'displayName email phone')
      .populate('comments.user', 'displayName email userType')
      .populate('statusHistory.changedBy', 'displayName email userType');
      
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Format the response with better user information
    const formattedRequest = {
      ...request.toObject(),
      // Backward compat: fall back to createdAt for legacy requests without trip dates
      tripStartDate: request.tripStartDate || request.createdAt,
      tripEndDate: request.tripEndDate || request.createdAt,
      employee: request.employee ? {
        id: request.employee._id,
        name: request.employee.displayName,
        email: request.employee.email,
        phone: request.employee.phone || 'Not provided'
      } : null,
      adminReview: request.adminReview ? {
        ...request.adminReview,
        reviewedBy: request.adminReview.reviewedBy ? {
          id: request.adminReview.reviewedBy._id,
          name: request.adminReview.reviewedBy.displayName,
          email: request.adminReview.reviewedBy.email,
          phone: request.adminReview.reviewedBy.phone || 'Not provided'
        } : null
      } : null,
      managementDecision: request.managementDecision ? {
        ...request.managementDecision,
        decidedBy: request.managementDecision.decidedBy ? {
          id: request.managementDecision.decidedBy._id,
          name: request.managementDecision.decidedBy.displayName,
          email: request.managementDecision.decidedBy.email,
          phone: request.managementDecision.decidedBy.phone || 'Not provided'
        } : null
      } : null,
      payment: request.payment ? {
        ...request.payment,
        processedBy: request.payment.processedBy ? {
          id: request.payment.processedBy._id,
          name: request.payment.processedBy.displayName,
          email: request.payment.processedBy.email,
          phone: request.payment.processedBy.phone || 'Not provided'
        } : null
      } : null,
      comments: request.comments?.map(c => ({
        ...c.toObject(),
        user: c.user ? {
          id: c.user._id,
          name: c.user.displayName,
          email: c.user.email,
          role: c.user.userType,
          phone: c.user.phone || 'Not provided'
        } : null
      })),
      statusHistory: request.statusHistory?.map(h => ({
        ...h.toObject(),
        changedBy: h.changedBy ? {
          id: h.changedBy._id,
          name: h.changedBy.displayName,
          email: h.changedBy.email,
          role: h.changedBy.userType
        } : null
      }))
    };
    
    res.json({ request: formattedRequest });
  } catch (error) {
    console.error('Error fetching request by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch all employees with their info and request stats
export const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await User.countDocuments({ userType: 'employee' });
    
    const employees = await User.find({ userType: 'employee' })
      .select('-password')
      .populate({
        path: 'requests',
        select: 'status totalAmountRequested createdAt',
      })
      .skip(skip)
      .limit(limitNum);
      
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({ 
      employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch all requests with filters (status, employee, date range) and pagination
export const getAllRequests = async (req, res) => {
  try {
    const { status, employee, from, to, _id, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    // Support filtering by _id (specific request)
    if (_id) {
      try {
        filter._id = _id;
      } catch (e) {
        console.error("Invalid _id format:", e);
        return res.status(400).json({ message: 'Invalid request ID format' });
      }
    }
    
    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Request.countDocuments(filter);
    
    // Get paginated data
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email phone')
      .populate('adminReview.reviewedBy', 'displayName email phone')
      .populate('managementDecision.decidedBy', 'displayName email phone')
      .populate('payment.processedBy', 'displayName email phone')
      .populate('comments.user', 'displayName email userType phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    // Format all references to show names/emails
    const formatted = requests.map(r => ({
      ...r.toObject(),
      employee: r.employee ? { displayName: r.employee.displayName, email: r.employee.email } : null,
      adminReview: r.adminReview && r.adminReview.reviewedBy ? {
        ...r.adminReview,
        reviewedBy: {
          displayName: r.adminReview.reviewedBy.displayName,
          email: r.adminReview.reviewedBy.email
        }
      } : r.adminReview,
      managementDecision: r.managementDecision && r.managementDecision.decidedBy ? {
        ...r.managementDecision,
        decidedBy: {
          displayName: r.managementDecision.decidedBy.displayName,
          email: r.managementDecision.decidedBy.email
        }
      } : r.managementDecision,
      payment: r.payment && r.payment.processedBy ? {
        ...r.payment,
        processedBy: {
          displayName: r.payment.processedBy.displayName,
          email: r.payment.processedBy.email
        }
      } : r.payment
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    // Return paginated data with pagination metadata
    res.json({ 
      requests: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch requests by status (pending, management_approved, paid, unpaid)
export const getRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { from, to, employee, page = 1, limit = 10 } = req.query;
    const filter = { status };
    if (employee) filter.employee = employee;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Request.countDocuments(filter);
    
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email')
      .populate('adminReview.reviewedBy', 'displayName email')
      .populate('managementDecision.decidedBy', 'displayName email')
      .populate('payment.processedBy', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    // Format all references to show names/emails
    const formatted = requests.map(r => ({
      ...r.toObject(),
      employee: r.employee ? { displayName: r.employee.displayName, email: r.employee.email } : null,
      adminReview: r.adminReview && r.adminReview.reviewedBy ? {
        ...r.adminReview,
        reviewedBy: {
          displayName: r.adminReview.reviewedBy.displayName,
          email: r.adminReview.reviewedBy.email
        }
      } : r.adminReview,
      managementDecision: r.managementDecision && r.managementDecision.decidedBy ? {
        ...r.managementDecision,
        decidedBy: {
          displayName: r.managementDecision.decidedBy.displayName,
          email: r.managementDecision.decidedBy.email
        }
      } : r.managementDecision,
      payment: r.payment && r.payment.processedBy ? {
        ...r.payment,
        processedBy: {
          displayName: r.payment.processedBy.displayName,
          email: r.payment.processedBy.email
        }
      } : r.payment
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    // Return paginated data with pagination metadata
    res.json({ 
      requests: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// Management approves or rejects
export const managementDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, managementComment } = req.body; // decision: 'approved' | 'rejected'
    const managementId = req.user.id;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "under_management_review") return res.status(400).json({ message: "Request is not under management review" });

    request.managementDecision = {
      decidedBy: managementId,
      decidedAt: new Date(),
      decision,
      comment: managementComment || (decision === "approved" ? "Approved" : "Rejected")
    };
    request.status = decision === "approved" ? "approved" : "rejected";
    request.statusHistory.push({
      status: request.status,
      changedBy: managementId,
      changedAt: new Date(),
      comment: managementComment || (decision === "approved" ? "Approved" : "Rejected")
    });
    await request.save();
    res.json({ message: `Request ${decision} by management`, request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
// End of file
// Accounts marks payment status
export const markPaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paid, paymentMethod, paymentProofUrl, accountsComment } = req.body;
    const accountsId = req.user.id;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "approved") return res.status(400).json({ message: "Request is not approved for payment" });

    request.payment = {
      processedBy: accountsId,
      processedAt: new Date(),
      paid: !!paid,
      paymentMethod: paid ? paymentMethod : undefined,
      paymentProofUrl: paid && paymentMethod === "upi" ? paymentProofUrl : undefined,
      comment: accountsComment || (paid ? "Marked as paid" : "Marked as unpaid")
    };
    request.status = paid ? "paid" : "approved";
    request.statusHistory.push({
      status: request.status,
      changedBy: accountsId,
      changedAt: new Date(),
      comment: accountsComment || (paid ? "Marked as paid" : "Marked as unpaid")
    });
    await request.save();
    res.json({ message: paid ? "Request marked as paid" : "Payment status updated", request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
// End of file
