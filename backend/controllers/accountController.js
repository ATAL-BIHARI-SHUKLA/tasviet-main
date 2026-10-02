
import Request from '../models/requestSchema.js';
import User from '../models/userModel.js';
import { Parser } from 'json2csv';
import { processUploadedFile } from '../utils/fileUpload.js';

// Get specific request details with populated fields
export const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id)
      .populate('employee', 'displayName email userType phone')
      .populate('adminReview.reviewedBy', 'displayName email userType')
      .populate('managementDecision.decidedBy', 'displayName email userType')
      .populate('payment.processedBy', 'displayName email userType')
      .populate('comments.user', 'displayName email userType phone')
      .populate('statusHistory.changedBy', 'displayName email userType');
      
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // For accountants, only show the final adjusted amount
    const formattedRequest = {
      id: request._id,
      title: request.title,
      description: request.description,
      employee: request.employee,
      expenses: request.adminReview?.editedExpenses || request.expenses, // Show admin edited expenses if available
      totalAmount: request.finalAmount || request.totalAmountRequested, // Only show final amount
      adminReview: {
        ...request.adminReview,
        adjustedAmount: undefined // Hide the original adjustment details
      },
      managementDecision: request.managementDecision,
      payment: request.payment,
      comments: request.comments,
      status: request.status,
      statusHistory: request.statusHistory,
      location: request.location,
      // Backward compat: fall back to createdAt for legacy requests without trip dates
      tripStartDate: request.tripStartDate || request.createdAt,
      tripEndDate: request.tripEndDate || request.createdAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
    
    res.json(formattedRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request details', details: err.message });
  }
};

// Get list of employees for filtering
export const getEmployeesList = async (req, res) => {
  try {
    const employees = await User.find({ userType: 'employee' })
      .select('_id displayName email')
      .sort({ displayName: 1 });
      
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees list', details: err.message });
  }
};


// Mark a request as paid (with file upload for proof)
export const markAsPaid = async (req, res) => {
	try {
		const { id } = req.params;
		const { method, transactionId, notes } = req.body;
		const request = await Request.findById(id);
		
		// Check if request exists and is in the right status
		if (!request || request.status !== 'management_approved') {
			return res.status(400).json({ error: 'Request not found or not eligible for payment' });
		}
		
		// Verify user authentication
		if (!req.user || !req.user.id) {
			return res.status(401).json({ error: 'Authentication required. User ID not found.' });
		}

		// Handle file upload (proof)
		let proof = null;
		if (req.file) {
			console.log("File received:", req.file.filename);
			proof = await processUploadedFile(req);
		}

		// Update request status and payment details
		request.status = 'paid';
		
		// Add to status history
		request.statusHistory.push({
			status: 'paid',
			changedBy: req.user.id, // Using req.user.id instead of req.user._id
			changedAt: new Date(),
			notes: `Payment processed via ${method}`
		});
		
		// Set payment information
		request.payment = {
			processedBy: req.user.id, // Using req.user.id instead of req.user._id
			processedAt: new Date(),
			method,
			transactionId,
			notes
		};
		
		// Add proof if available
		if (proof) {
			request.payment.proof = proof;
		}
		
		await request.save();
		res.json({ 
			message: 'Request marked as paid successfully', 
			request: {
				id: request._id,
				status: request.status,
				payment: request.payment
			} 
		});
	} catch (err) {
		console.error("Error in markAsPaid:", err);
		res.status(500).json({ error: 'Failed to mark as paid', details: err.message });
	}
};

// Get payment history for an employee (with filters)
export const getPaymentHistory = async (req, res) => {
	try {
		const { employeeId, from, to, month, year, page = 1, limit = 10 } = req.query;
		const filter = { status: 'paid' };
		if (employeeId) filter.employee = employeeId;
		
		if (from || to || month || year) {
			filter['payment.processedAt'] = {};
			
			// Handle date range filter
			if (from) filter['payment.processedAt'].$gte = new Date(from);
			if (to) filter['payment.processedAt'].$lte = new Date(to);
			
			// Handle month/year filtering
			if (month && year) {
				const startMonth = new Date(year, month - 1, 1);
				const endMonth = new Date(year, month, 0, 23, 59, 59, 999);
				filter['payment.processedAt'].$gte = startMonth;
				filter['payment.processedAt'].$lte = endMonth;
			} else if (year) {
				const startYear = new Date(year, 0, 1);
				const endYear = new Date(year, 11, 31, 23, 59, 59, 999);
				filter['payment.processedAt'].$gte = startYear;
				filter['payment.processedAt'].$lte = endYear;
			}
		}
		
		// Convert string parameters to integers
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;
		
		// Get total count for pagination metadata
		const totalCount = await Request.countDocuments(filter);
		
		const requests = await Request.find(filter)
			.populate('employee', 'displayName email userType')
			.populate('adminReview.reviewedBy', 'displayName email userType')
			.populate('managementDecision.decidedBy', 'displayName email userType')
			.populate('payment.processedBy', 'displayName email userType')
			.sort({ 'payment.processedAt': -1 })
			.skip(skip)
			.limit(limitNum);
		
		// Format response for accountant UI
		const formatted = requests.map(r => ({
			id: r._id,
			title: r.title,
			description: r.description,
			employee: r.employee,
			expenses: r.expenses,
			totalAmountRequested: r.totalAmountRequested,
			adminReview: r.adminReview,
			managementDecision: r.managementDecision,
			payment: r.payment,
			status: r.status,
			createdAt: r.createdAt,
			paidAt: r.payment?.processedAt
		}));
		
		// Return data with pagination metadata
		res.json({
			data: formatted,
			pagination: {
				total: totalCount,
				page: pageNum,
				limit: limitNum,
				pages: Math.ceil(totalCount / limitNum)
			}
		});
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch payment history', details: err.message });
	}
};



// Get all management-approved requests (with filters)
export const getRequests = async (req, res) => {
  try {
    const { status, employeeId, from, to, search, month, year, page = 1, limit = 10 } = req.query;
    const filter = { status: 'management_approved' };
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    if (from || to || month || year) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
      if (month && year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        filter.createdAt.$gte = start;
        filter.createdAt.$lte = end;
      } else if (year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        filter.createdAt.$gte = start;
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Convert string parameters to integers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination metadata
    const totalCount = await Request.countDocuments(filter);
    
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email userType')
      .populate('adminReview.reviewedBy', 'displayName email userType')
      .populate('managementDecision.decidedBy', 'displayName email userType')
      .populate('payment.processedBy', 'displayName email userType')
      .populate('comments.user', 'displayName email userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Format response for accountant UI
    const formatted = requests.map(r => ({
      id: r._id,
      title: r.title,
      description: r.description,
      employee: r.employee,
      expenses: r.expenses,
      totalAmountRequested: r.totalAmountRequested,
      adminReview: r.adminReview,
      managementDecision: r.managementDecision,
      payment: r.payment,
      comments: r.comments,
      status: r.status,
      statusHistory: r.statusHistory,
      // Backward compat: fall back to createdAt for legacy requests without trip dates
      tripStartDate: r.tripStartDate || r.createdAt,
      tripEndDate: r.tripEndDate || r.createdAt,
      createdAt: r.createdAt,
    }));

    // Return data with pagination metadata
    res.json({
      data: formatted,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests', details: err.message });
  }
};

// Export employee bill records for a date/trip range as CSV (includes bill URLs)
export const exportBillRecords = async (req, res) => {
  try {
    const { employeeId, from, to, month, year, status: statusFilter } = req.query;

    // Build filter – include management_approved and paid requests
    const filter = { status: { $in: ['management_approved', 'paid'] } };
    if (statusFilter) filter.status = statusFilter;
    if (employeeId) filter.employee = employeeId;

    // Date range filtering on tripStartDate / tripEndDate
    if (from || to || month || year) {
      if (from || to) {
        // Trip range overlaps the query range if tripStart <= to AND tripEnd >= from
        if (from) filter.tripEndDate = { ...(filter.tripEndDate || {}), $gte: new Date(from) };
        if (to) filter.tripStartDate = { ...(filter.tripStartDate || {}), $lte: new Date(to) };
      } else if (month && year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        filter.tripEndDate = { ...(filter.tripEndDate || {}), $gte: start };
        filter.tripStartDate = { ...(filter.tripStartDate || {}), $lte: end };
      } else if (year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        filter.tripEndDate = { ...(filter.tripEndDate || {}), $gte: start };
        filter.tripStartDate = { ...(filter.tripStartDate || {}), $lte: end };
      }
    }

    const requests = await Request.find(filter)
      .populate('employee', 'displayName email userType')
      .populate('adminReview.reviewedBy', 'displayName email userType')
      .populate('managementDecision.decidedBy', 'displayName email userType')
      .populate('payment.processedBy', 'displayName email userType')
      .sort({ tripStartDate: -1, createdAt: -1 });

    // Flatten: one row per expense (so each bill gets its own row)
    const rows = [];
    for (const r of requests) {
      const expenses = r.adminReview?.editedExpenses?.length ? r.adminReview.editedExpenses : r.expenses;
      for (const exp of (expenses || [])) {
        rows.push({
          RequestId: r._id,
          Title: r.title,
          Employee: r.employee?.displayName || '',
          Email: r.employee?.email || '',
          TripStart: r.tripStartDate ? new Date(r.tripStartDate).toLocaleDateString() : '',
          TripEnd: r.tripEndDate ? new Date(r.tripEndDate).toLocaleDateString() : '',
          Service: exp.serviceName,
          ExpenseDate: exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : '',
          OriginalAmount: exp.amount,
          Description: exp.description || '',
          BillURL: exp.bill?.fileUrl || '',
          Status: r.status,
          PaidAt: r.payment?.processedAt ? new Date(r.payment.processedAt).toLocaleDateString() : '',
          PaymentMethod: r.payment?.method || '',
          TransactionId: r.payment?.transactionId || '',
        });
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No records found for the given filters' });
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    const empName = requests[0]?.employee?.displayName?.replace(/\s+/g, '_') || 'employee';
    const fileName = `bill_records_${empName}_${from || 'all'}_to_${to || 'all'}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export bill records', details: err.message });
  }
};

// Export payment transactions for an employee as CSV (monthly/yearly filter)
export const exportPaymentsCSV = async (req, res) => {
  try {
    const { employeeId, from, to, month, year, preview, page = 1, limit = 10 } = req.query;
    const filter = { status: 'paid' };
    if (employeeId) filter.employee = employeeId;
    if (from || to || month || year) {
      filter['payment.processedAt'] = {};
      if (from) filter['payment.processedAt'].$gte = new Date(from);
      if (to) filter['payment.processedAt'].$lte = new Date(to);
      if (month && year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        filter['payment.processedAt'].$gte = start;
        filter['payment.processedAt'].$lte = end;
      } else if (year) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        filter['payment.processedAt'].$gte = start;
        filter['payment.processedAt'].$lte = end;
      }
    }
    // Only export requests that are admin reviewed/edited and management approved
    filter['adminReview.reviewedBy'] = { $exists: true, $ne: null };
    filter['managementDecision.decidedBy'] = { $exists: true, $ne: null };

    // For preview mode with pagination
    if (preview === 'true') {
      // Convert string parameters to integers
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      // Get total count for pagination metadata
      const totalCount = await Request.countDocuments(filter);
      
      const requests = await Request.find(filter)
        .populate('employee', 'displayName email userType')
        .populate('adminReview.reviewedBy', 'displayName email userType')
        .populate('managementDecision.decidedBy', 'displayName email userType')
        .populate('payment.processedBy', 'displayName email userType')
        .sort({ 'payment.processedAt': -1 })
        .skip(skip)
        .limit(limitNum);

      const previewData = requests.map(r => ({
        id: r._id,
        title: r.title,
        employee: r.employee?.displayName,
        email: r.employee?.email,
        tripStartDate: r.tripStartDate || r.createdAt,
        tripEndDate: r.tripEndDate || r.createdAt,
        totalAmountRequested: r.totalAmountRequested,
        adminReviewedAmount: r.adminReview?.adjustedAmount,
        managementApprovedAmount: r.managementDecision?.notes,
        status: r.status,
        paymentMethod: r.payment?.method,
        transactionId: r.payment?.transactionId,
        paidAt: r.payment?.processedAt,
        notes: r.payment?.notes
      }));

      // Return data with pagination metadata
      return res.json({
        data: previewData,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    }

    // For actual export - no pagination, get all data
    const requests = await Request.find(filter)
      .populate('employee', 'displayName email userType')
      .populate('adminReview.reviewedBy', 'displayName email userType')
      .populate('managementDecision.decidedBy', 'displayName email userType')
      .populate('payment.processedBy', 'displayName email userType')
      .sort({ 'payment.processedAt': -1 });

    const data = requests.map(r => ({
      id: r._id,
      title: r.title,
      employee: r.employee?.displayName,
      email: r.employee?.email,
      tripStartDate: r.tripStartDate || r.createdAt,
      tripEndDate: r.tripEndDate || r.createdAt,
      totalAmountRequested: r.totalAmountRequested,
      adminReviewedAmount: r.adminReview?.adjustedAmount,
      managementApprovedAmount: r.managementDecision?.notes,
      status: r.status,
      managementApprover: r.managementDecision?.decidedBy?.displayName,
      managementApproverEmail: r.managementDecision?.decidedBy?.email,
      accountant: r.payment?.processedBy?.displayName,
      accountantEmail: r.payment?.processedBy?.email,
      paymentMethod: r.payment?.method,
      transactionId: r.payment?.transactionId,
      paidAt: r.payment?.processedAt,
      notes: r.payment?.notes
    }));

    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('payments.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export payments CSV', details: err.message });
  }
};