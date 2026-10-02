
import Request from '../models/requestSchema.js';
import User from '../models/userModel.js';
import { Parser } from 'json2csv';

// Get all admin-reviewed requests with filters (status, date, employee, etc.)
export const getRequests = async (req, res) => {
	try {
		const { status, employeeId, from, to, search, page = 1, limit = 10 } = req.query;
		const filter = { status: 'admin_reviewed' };
		if (status) filter.status = status;
		if (employeeId) filter.employee = employeeId;
		if (from || to) {
			filter.createdAt = {};
			if (from) filter.createdAt.$gte = new Date(from);
			if (to) filter.createdAt.$lte = new Date(to);
		}
		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}
		
		// Parse pagination params
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;
		
		// Get total count for pagination
		const total = await Request.countDocuments(filter);
		
		const requests = await Request.find(filter)
			.populate('employee', 'displayName email phone userType')
			.populate('adminReview.reviewedBy', 'displayName email phone')
			.populate('managementDecision.decidedBy', 'displayName email phone')
			.populate('payment.processedBy', 'displayName email phone')
			.populate('comments.user', 'displayName email userType')
			.populate('statusHistory.changedBy', 'displayName email userType')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum);
				
			// Transform requests to include only the adjusted amount (not original)
			// and include full contact information instead of reference IDs
			const result = requests.map(r => {
				const requestObj = r.toObject();
				
				// For management, only show the final adjusted amount
				const finalAmount = r.finalAmount || r.totalAmountRequested;
					
				return {
					...requestObj,
					// Keep original expenses for list view (bill count, expense count)
					expenses: requestObj.expenses,
					// Use only the final amount for management
					totalAmount: finalAmount, // Only show final amount
					totalAmountRequested: requestObj.totalAmountRequested,
					adjustedAmount: undefined,
					
					// Backward compat: fall back to createdAt for legacy requests without trip dates
					tripStartDate: r.tripStartDate || r.createdAt,
					tripEndDate: r.tripEndDate || r.createdAt,
					
					// Format user references to show complete contact information
					employee: r.employee ? {
						id: r.employee._id,
						name: r.employee.displayName,
						email: r.employee.email,
						phone: r.employee.phone || 'Not provided'
					} : null,
					
					adminReview: r.adminReview ? {
						...r.adminReview,
						reviewedBy: r.adminReview.reviewedBy ? {
							id: r.adminReview.reviewedBy._id,
							name: r.adminReview.reviewedBy.displayName,
							email: r.adminReview.reviewedBy.email,
							phone: r.adminReview.reviewedBy.phone || 'Not provided'
						} : null
					} : null,
					
					comments: r.comments?.map(c => ({
						...c,
						user: c.user ? {
							id: c.user._id,
							name: c.user.displayName,
							email: c.user.email,
							role: c.user.userType
						} : null
					}))
				};
			});
			
			// Calculate pagination metadata
			const totalPages = Math.ceil(total / limitNum);
			
			res.json({
				requests: result,
				pagination: {
					total,
					page: pageNum,
					limit: limitNum,
					pages: totalPages
				}
			});
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch requests', details: err.message });
	}
};

// Approve a request (management)
export const approveRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const { notes, comment } = req.body;
		
		console.log('approveRequest called with:', {
			requestId: id,
			notes,
			comment,
			user: req.user
		});
			
		const request = await Request.findById(id);
		if (!request || request.status !== 'admin_reviewed') {
			return res.status(400).json({ error: 'Request not found or not eligible for approval' });
		}
			// Management approves the admin-adjusted amount (or original if not adjusted)
			const approvedAmount = request.adminReview?.adjustedAmount !== undefined
				? request.adminReview.adjustedAmount
				: request.totalAmountRequested;
			request.totalAmountRequested = approvedAmount;
			request.status = 'management_approved';
			request.managementDecision = {
				decidedBy: req.user.id, // Use req.user.id instead of req.user._id
				decidedAt: new Date(),
				notes
			};
			
			// Add comment if provided
			if (comment && comment.trim()) {
				// Ensure the user ID is set to the current user
				request.comments.push({
					user: req.user.id, // The authenticate middleware sets req.user.id, not req.user._id
					userType: 'management',
					comment: comment.trim(),
					timestamp: new Date()
				});
			}
			
			await request.save();
			
			// Populate all references before sending response
			await request.populate([
				{ path: 'employee', select: 'displayName email phone' },
				{ path: 'adminReview.reviewedBy', select: 'displayName email phone' },
				{ path: 'managementDecision.decidedBy', select: 'displayName email phone' },
				{ path: 'payment.processedBy', select: 'displayName email phone' },
				{ path: 'comments.user', select: 'displayName email userType' }
			]);
			
			res.json({ 
				message: 'Request approved', 
				request: {
					...request.toObject(),
					// Format for readability
					employee: request.employee ? {
						name: request.employee.displayName,
						email: request.employee.email,
						phone: request.employee.phone || 'Not provided'
					} : null,
					managementDecision: {
						...request.managementDecision.toObject(),
						decidedBy: request.managementDecision.decidedBy ? {
							name: request.managementDecision.decidedBy.displayName,
							email: request.managementDecision.decidedBy.email,
							phone: request.managementDecision.decidedBy.phone || 'Not provided'
						} : null
					}
				}
			});
	} catch (err) {
		res.status(500).json({ error: 'Failed to approve request', details: err.message });
	}
};

// Reject a request (management)
export const rejectRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const { notes, comment } = req.body;
		const request = await Request.findById(id);
		if (!request || request.status !== 'admin_reviewed') {
			return res.status(400).json({ error: 'Request not found or not eligible for rejection' });
		}
		request.status = 'management_rejected';
		request.managementDecision = {
			decidedBy: req.user.id, // Use req.user.id instead of req.user._id
			decidedAt: new Date(),
			notes
		};
		
			// Add comment if provided
			if (comment && comment.trim()) {
				console.log('Adding comment to request with user:', req.user);
				
				// First ensure comments array exists
				if (!request.comments) {
					request.comments = [];
				}
				
				// Create a new comment object with all required fields
				const newComment = {
					user: req.user.id, // The correct user ID from the auth middleware
					userType: 'management',
					comment: comment.trim(),
					timestamp: new Date()
				};
				
				console.log('New comment object:', newComment);
				
				// Add the comment to the array
				request.comments.push(newComment);
				
				console.log('Request comments array now:', request.comments);
			}
			
			try {
				console.log('Saving request with comments:', JSON.stringify(request.comments, null, 2));
				
				// Manually validate the request to get more detailed error messages
				const validationError = request.validateSync();
				if (validationError) {
					console.error('Validation error before save:', validationError);
					// Return detailed validation error
					return res.status(400).json({ 
						error: 'Validation failed', 
						details: validationError.message,
						errors: Object.values(validationError.errors).map(err => ({
							path: err.path,
							kind: err.kind,
							message: err.message
						}))
					});
				}
				
				await request.save();
				console.log('Request saved successfully');
			} catch (saveErr) {
				console.error('Error saving request:', saveErr);
				// Provide more detailed error information
				if (saveErr.name === 'ValidationError') {
					return res.status(400).json({
						error: 'Validation failed',
						details: saveErr.message,
						errors: Object.values(saveErr.errors).map(err => ({
							path: err.path,
							kind: err.kind,
							message: err.message
						}))
					});
				}
				throw saveErr;
			}		// Populate all references before sending response
		await request.populate([
			{ path: 'employee', select: 'displayName email phone' },
			{ path: 'adminReview.reviewedBy', select: 'displayName email phone' },
			{ path: 'managementDecision.decidedBy', select: 'displayName email phone' },
			{ path: 'comments.user', select: 'displayName email userType' }
		]);
		
		res.json({ 
			message: 'Request rejected', 
			request: {
				...request.toObject(),
				employee: request.employee ? {
					name: request.employee.displayName,
					email: request.employee.email,
					phone: request.employee.phone || 'Not provided'
				} : null,
				managementDecision: {
					...request.managementDecision.toObject(),
					decidedBy: request.managementDecision.decidedBy ? {
						name: request.managementDecision.decidedBy.displayName,
						email: request.managementDecision.decidedBy.email,
						phone: request.managementDecision.decidedBy.phone || 'Not provided'
					} : null
				}
			}
		});
	} catch (err) {
		res.status(500).json({ error: 'Failed to reject request', details: err.message });
	}
};

// Get employee details with their requests
export const getEmployeeDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const { page = 1, limit = 10 } = req.query;
		
		// Get employee details
		const employee = await User.findById(id, 'displayName email phone department position hireDate _id userType');
		
		if (!employee) {
			return res.status(404).json({ error: 'Employee not found' });
		}
		
		// Parse pagination params
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;
		
		// Get total count for pagination
		const total = await Request.countDocuments({ employee: id });
		
		// Get employee's requests with pagination
		const requests = await Request.find({ employee: id })
			.populate('adminReview.reviewedBy', 'displayName email')
			.populate('managementDecision.decidedBy', 'displayName email')
			.populate('payment.processedBy', 'displayName email')
			.populate('comments.user', 'displayName email userType')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum);
			
		// Calculate statistics from full dataset (not paginated subset)
		const [pendingCount, approvedCount, rejectedCount, totalApprovedAmount] = await Promise.all([
			Request.countDocuments({ employee: id, status: 'admin_reviewed' }),
			Request.countDocuments({ employee: id, status: { $in: ['management_approved', 'payment_processed'] } }),
			Request.countDocuments({ employee: id, status: 'management_rejected' }),
			Request.aggregate([
				{ $match: { employee: employee._id, status: { $in: ['management_approved', 'payment_processed'] } } },
				{ $group: { _id: null, total: { $sum: { $ifNull: ['$adminReview.adjustedAmount', '$totalAmountRequested'] } } } }
			])
		]);
		
		const stats = {
			totalRequests: total,
			pendingRequests: pendingCount,
			approvedRequests: approvedCount,
			rejectedRequests: rejectedCount,
			totalApprovedAmount: totalApprovedAmount[0]?.total || 0
		};
		
		// Calculate pagination metadata
		const totalPages = Math.ceil(total / limitNum);
		
		res.json({
			employee,
			stats,
			requests,
			pagination: {
				total,
				page: pageNum,
				limit: limitNum,
				pages: totalPages
			}
		});
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch employee details', details: err.message });
	}
};

// Get employee stats (total requests, total bill, total sanctioned, etc.)
export const getEmployeeStats = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;
		
		// Parse pagination params
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;
		
		// Get total count for pagination
		const total = await User.countDocuments({ userType: 'employee' });
		
		// Get ALL employees for aggregate totals (no pagination)
		const allEmployees = await User.find({ userType: 'employee' })
			.select('requests')
			.populate({
				path: 'requests',
				select: 'totalAmountRequested status adminReview.adjustedAmount',
			});
		
		// Compute aggregate totals across ALL employees
		let aggTotalRequests = 0;
		let aggTotalBill = 0;
		let aggTotalSanctioned = 0;
		for (const emp of allEmployees) {
			aggTotalRequests += emp.requests.length;
			for (const r of emp.requests) {
				const amount = r.adminReview?.adjustedAmount !== undefined 
					? r.adminReview.adjustedAmount 
					: r.totalAmountRequested;
				aggTotalBill += (amount || 0);
				if (r.status === 'paid') {
					aggTotalSanctioned += (amount || 0);
				}
			}
		}
		
		const employees = await User.find({ userType: 'employee' })
			.select('displayName email phone requests')
			.populate({
				path: 'requests',
				select: 'totalAmountRequested status adminReview.adjustedAmount',
			})
			.skip(skip)
			.limit(limitNum);
		const stats = employees.map(emp => {
			const totalRequests = emp.requests.length;
			
			// Use adjusted amount for management view
			const totalBill = emp.requests.reduce((sum, r) => {
				const amount = r.adminReview?.adjustedAmount !== undefined 
					? r.adminReview.adjustedAmount 
					: r.totalAmountRequested;
				return sum + (amount || 0);
			}, 0);
			
			const totalSanctioned = emp.requests
				.filter(r => r.status === 'paid')
				.reduce((sum, r) => {
					const amount = r.adminReview?.adjustedAmount !== undefined 
						? r.adminReview.adjustedAmount 
						: r.totalAmountRequested;
					return sum + (amount || 0);
				}, 0);
				
			const totalPending = emp.requests
				.filter(r => r.status === 'management_approved')
				.reduce((sum, r) => {
					const amount = r.adminReview?.adjustedAmount !== undefined 
						? r.adminReview.adjustedAmount 
						: r.totalAmountRequested;
					return sum + (amount || 0);
				}, 0);
				
			return {
				employeeId: emp._id,
				displayName: emp.displayName,
				email: emp.email,
				phone: emp.phone || 'Not provided',
				totalRequests,
				totalBill,
				totalSanctioned,
				totalPending
			};
		});
		
		// Calculate pagination metadata
		const totalPages = Math.ceil(total / limitNum);
		
		res.json({
			stats,
			aggregates: {
				totalEmployees: total,
				totalRequests: aggTotalRequests,
				totalBill: aggTotalBill,
				totalSanctioned: aggTotalSanctioned,
			},
			pagination: {
				total,
				page: pageNum,
				limit: limitNum,
				pages: totalPages
			}
		});
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch employee stats', details: err.message });
	}
};

// Get employee details and their requests
// export const getEmployeeDetails = async (req, res) => {
// 	try {
// 		const { id } = req.params;
		
// 		// Get employee details
// 		const employee = await User.findById(id)
// 			.select('displayName email phone userType createdAt');
			
// 		if (!employee || employee.userType !== 'employee') {
// 			return res.status(404).json({ error: 'Employee not found' });
// 		}
		
// 		// Get employee's requests that have been at least admin-reviewed
// 		const requests = await Request.find({ 
// 			employee: id,
// 			status: { $in: ['admin_reviewed', 'management_approved', 'management_rejected', 'payment_pending', 'paid'] } 
// 		})
// 		.sort({ createdAt: -1 })
// 		.populate('adminReview.reviewedBy', 'displayName')
// 		.populate('managementDecision.decidedBy', 'displayName')
// 		.populate('payment.processedBy', 'displayName');
		
// 		// Calculate summary statistics
// 		const stats = {
// 			totalRequests: requests.length,
// 			totalAmountRequested: 0,
// 			totalAmountApproved: 0,
// 			pendingApproval: 0,
// 			approved: 0,
// 			rejected: 0,
// 			paid: 0
// 		};
		
// 		const formattedRequests = requests.map(req => {
// 			// Always use the admin-adjusted amount if available for management view
// 			const amount = req.adminReview?.adjustedAmount !== undefined 
// 				? req.adminReview.adjustedAmount 
// 				: req.totalAmountRequested;
			
// 			// Update stats
// 			stats.totalAmountRequested += amount;
			
// 			if (req.status === 'admin_reviewed') {
// 				stats.pendingApproval++;
// 			} else if (req.status === 'management_approved' || req.status === 'payment_pending') {
// 				stats.approved++;
// 				stats.totalAmountApproved += amount;
// 			} else if (req.status === 'management_rejected') {
// 				stats.rejected++;
// 			} else if (req.status === 'paid') {
// 				stats.paid++;
// 				stats.totalAmountApproved += amount;
// 			}
			
// 			return {
// 				id: req._id,
// 				title: req.title,
// 				description: req.description,
// 				createdAt: req.createdAt,
// 				status: req.status,
// 				amount: amount,
// 				adminReviewedBy: req.adminReview?.reviewedBy?.displayName || 'Not reviewed',
// 				adminReviewedAt: req.adminReview?.reviewedAt || null,
// 				managementDecidedBy: req.managementDecision?.decidedBy?.displayName || null,
// 				managementDecidedAt: req.managementDecision?.decidedAt || null,
// 				paidBy: req.payment?.processedBy?.displayName || null,
// 				paidAt: req.payment?.processedAt || null
// 			};
// 		});
		
// 		res.json({
// 			employee: {
// 				id: employee._id,
// 				name: employee.displayName,
// 				email: employee.email,
// 				phone: employee.phone || 'Not provided',
// 				userType: employee.userType,
// 				joinedAt: employee.createdAt
// 			},
// 			stats,
// 			requests: formattedRequests
// 		});
// 	} catch (err) {
// 		res.status(500).json({ error: 'Failed to fetch employee details', details: err.message });
// 	}
// };

// Export requests or stats as CSV
export const exportRequestsCSV = async (req, res) => {
	try {
		const { type } = req.query;
		let data;
		if (type === 'stats') {
			// Export employee stats
			const employees = await User.find({ userType: 'employee' })
				.select('displayName email phone requests')
				.populate({
					path: 'requests',
					select: 'totalAmountRequested status adminReview.adjustedAmount',
				});
			data = employees.map(emp => ({
				displayName: emp.displayName,
				email: emp.email,
				phone: emp.phone || 'Not provided',
				totalRequests: emp.requests.length,
				// For management, we only show adjusted amounts
				totalBill: emp.requests.reduce((sum, r) => {
					// Use adjusted amount if available, otherwise use totalAmountRequested
					const amount = r.adminReview?.adjustedAmount !== undefined 
						? r.adminReview.adjustedAmount 
						: r.totalAmountRequested;
					return sum + (amount || 0);
				}, 0),
				totalSanctioned: emp.requests.filter(r => r.status === 'paid').reduce((sum, r) => {
					const amount = r.adminReview?.adjustedAmount !== undefined 
						? r.adminReview.adjustedAmount 
						: r.totalAmountRequested;
					return sum + (amount || 0);
				}, 0),
				totalPending: emp.requests.filter(r => r.status === 'management_approved').reduce((sum, r) => {
					const amount = r.adminReview?.adjustedAmount !== undefined 
						? r.adminReview.adjustedAmount 
						: r.totalAmountRequested;
					return sum + (amount || 0);
				}, 0)
			}));
		} else {
			// Export filtered requests
			const { status, employeeId, from, to } = req.query;
			// Default filter to include all relevant stages (admin_reviewed, management_approved, payment_pending, paid)
			const filter = {};
			
			// If status specified, filter by it, otherwise include all stages of interest
			if (status) {
				filter.status = status;
			} else {
				filter.status = { $in: ['admin_reviewed', 'management_approved', 'management_rejected', 'payment_pending', 'paid'] };
			}
			
			if (employeeId) filter.employee = employeeId;
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
				
			data = requests.map(r => {
				// Get services details
				const servicesDetails = r.expenses?.map(exp => 
					`${exp.serviceName}: ₹${exp.amount} (${exp.description || 'No description'})`
				).join(' | ') || 'No services details';
				
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
					tripStartDate: r.tripStartDate ? new Date(r.tripStartDate).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString(),
					tripEndDate: r.tripEndDate ? new Date(r.tripEndDate).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString(),
					requestDate: new Date(r.createdAt).toLocaleString(),
					lastUpdated: new Date(r.updatedAt).toLocaleString()
				};
			});
		}
		const parser = new Parser();
		const csv = parser.parse(data);
		res.header('Content-Type', 'text/csv');
		res.attachment('export.csv');
		return res.send(csv);
	} catch (err) {
		res.status(500).json({ error: 'Failed to export CSV', details: err.message });
	}
};
