import Request from "../models/requestSchema.js";
import User from "../models/userModel.js";

// Employee creates a new request with multiple expenses
export const createRequest = async (req, res) => {
  try {
    const { title, description, expenses, location, tripStartDate, tripEndDate } = req.body;
    const employeeId = req.user.id; // cookie-based session uses id

    // Check if logged-in user is actually an employee
    if (req.user.userType !== "employee") {
      return res.status(403).json({ message: "Only employees can raise requests" });
    }

    // Validate trip dates (required)
    if (!tripStartDate || !tripEndDate) {
      return res.status(400).json({ 
        message: "Trip start date and end date are required" 
      });
    }

    const parsedTripStart = new Date(tripStartDate);
    const parsedTripEnd = new Date(tripEndDate);

    if (isNaN(parsedTripStart.getTime()) || isNaN(parsedTripEnd.getTime())) {
      return res.status(400).json({ 
        message: "Invalid trip date format. Use YYYY-MM-DD." 
      });
    }

    if (parsedTripEnd > new Date()) {
      return res.status(400).json({ 
        message: "Trip end date cannot be in the future" 
      });
    }

    if (parsedTripStart > parsedTripEnd) {
      return res.status(400).json({ 
        message: "Trip start date cannot be after end date" 
      });
    }

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
      
      // Validate expense date is within trip range
      if (item.expenseDate) {
        const expDate = new Date(item.expenseDate);
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({
            message: `Invalid expense date format for ${item.serviceName}. Use YYYY-MM-DD.`
          });
        }
        if (expDate < parsedTripStart || expDate > parsedTripEnd) {
          return res.status(400).json({
            message: `Expense date for "${item.serviceName}" must be within the trip date range`
          });
        }
      }
      
      // Bill is now optional - validate only if hasBill is true and bill data is provided
      if (item.hasBill && item.bill && !item.bill.fileId) {
        return res.status(400).json({
          message: "Expense marked as having a bill must include valid bill data with fileId"
        });
      }
    }

    // Calculate total requested amount from all expenses
    const totalAmountRequested = expenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
      0
    );

    // Create new request with multiple expenses
    const newRequest = new Request({
      employee: employeeId,
      title,
      description,
      expenses: expenses.map(exp => ({
        ...exp,
        expenseDate: exp.expenseDate ? new Date(exp.expenseDate) : parsedTripStart
      })),
      totalAmountRequested,
      location,
      tripStartDate: parsedTripStart,
      tripEndDate: parsedTripEnd,
      // Initialize workflow state objects with empty values
      adminReview: {},
      managementDecision: {},
      payment: {},
      // Add initial comment
      comments: [{
        user: employeeId,
        userType: "employee",
        comment: "Created a new expense reimbursement request",
        timestamp: new Date()
      }]
    });

    await newRequest.save();

    // Push reference into employee's requests array
    await User.findByIdAndUpdate(employeeId, {
      $push: { requests: newRequest._id },
    });

    // Return the newly created request with proper population
    const populatedRequest = await Request.findById(newRequest._id)
      .populate("employee", "displayName email")
      .populate("comments.user", "displayName email userType")
      .populate("statusHistory.changedBy", "displayName email userType");

    res.status(201).json({
      message: "Request created successfully",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Employee fetch all his/her requests with pagination
export const getMyRequests = async (req, res) => {
  try {
    // Get userId from authenticated user object
    const employeeId = req.user?.id;
    const { page = 1, limit = 10, status, search } = req.query;

    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized. User not authenticated." });
    }
    
    // Build query filter
    const filter = { employee: employeeId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Request.countDocuments(filter);
    
    const requests = await Request.find(filter)
      .populate("adminReview.reviewedBy", "displayName email")
      .populate("managementDecision.decidedBy", "displayName email")
      .populate("payment.processedBy", "displayName email")
      .populate("comments.user", "displayName email userType")
      .populate("statusHistory.changedBy", "displayName email userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
      
    // For employees, show both original and final amounts with trip date range
    const formattedRequests = requests.map(req => {
      const reqObj = req.toObject();
      // Backward compat: fall back to createdAt for legacy requests without trip dates
      const effectiveStart = req.tripStartDate || req.createdAt;
      const effectiveEnd = req.tripEndDate || req.createdAt;
      return {
        ...reqObj,
        // Keep original amount visible
        originalAmount: req.totalAmountRequested,
        // Show the final adjusted amount if admin has reviewed
        finalAmount: req.finalAmount || req.totalAmountRequested,
        // Show admin's adjustment if available
        adminAdjustment: req.adminReview?.adjustedAmount,
        // Include trip date range (fallback to createdAt for legacy requests)
        tripStartDate: effectiveStart,
        tripEndDate: effectiveEnd,
        // Calculate trip duration in days
        tripDuration: Math.ceil((new Date(effectiveEnd) - new Date(effectiveStart)) / (1000 * 60 * 60 * 24)) + 1
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({ 
      requests: formattedRequests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single request with all expense details
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const employeeId = req.user.id;

    // Find the request and verify it belongs to the employee
    const request = await Request.findOne({ 
      _id: requestId, 
      employee: employeeId 
    })
    .populate("adminReview.reviewedBy", "displayName email userType")
    .populate("managementDecision.decidedBy", "displayName email userType")
    .populate("payment.processedBy", "displayName email userType")
    .populate("comments.user", "displayName email userType")
    .populate("statusHistory.changedBy", "displayName email userType");

    if (!request) {
      return res.status(404).json({ message: "Request not found or unauthorized" });
    }

    // Backward compat: fall back to createdAt for legacy requests without trip dates
    const effectiveStart = request.tripStartDate || request.createdAt;
    const effectiveEnd = request.tripEndDate || request.createdAt;
    
    // Format the request to include both original and final amounts
    const formattedRequest = {
      ...request.toObject(),
      originalAmount: request.totalAmountRequested,
      finalAmount: request.finalAmount || request.totalAmountRequested,
      adminAdjustment: request.adminReview?.adjustedAmount,
      tripStartDate: effectiveStart,
      tripEndDate: effectiveEnd,
      tripDuration: Math.ceil((new Date(effectiveEnd) - new Date(effectiveStart)) / (1000 * 60 * 60 * 24)) + 1
    };
    
    res.status(200).json({ request: formattedRequest });
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add a new expense item to an existing request (if still in pending status)
export const addExpenseItem = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { serviceName, amount, description, bill } = req.body;
    const employeeId = req.user.id;

    // Validate required fields
    if (!serviceName || !amount || !bill?.fileUrl || !bill?.fileType) {
      return res.status(400).json({
        message: "Missing required fields: serviceName, amount, bill details"
      });
    }

    // Find the request and verify ownership and status
    const request = await Request.findOne({ 
      _id: requestId, 
      employee: employeeId,
      status: "pending" // Can only modify pending requests
    });

    if (!request) {
      return res.status(404).json({ 
        message: "Request not found, unauthorized, or cannot be modified in its current status" 
      });
    }

    // Create the new expense item
    const newExpense = {
      serviceName,
      amount: Number(amount),
      description,
      bill: {
        fileId: bill.fileId || null, // Google Drive fileId
        fileUrl: bill.fileUrl,
        fileType: bill.fileType,
        originalFileName: bill.originalFileName,
        uploadedAt: new Date()
      }
    };

    // Add to expenses array and update total
    request.expenses.push(newExpense);
    request.totalAmountRequested = request.expenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
      0
    );

    // Add a comment about the expense being added
    request.comments.push({
      user: employeeId,
      userType: "employee",
      comment: `Added new expense item: ${serviceName} - ₹${amount}`,
      timestamp: new Date()
    });

    await request.save();

    res.status(200).json({
      message: "Expense added successfully",
      request
    });
  } catch (error) {
    console.error("Error adding expense item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove an expense item (if request is still pending)
export const removeExpenseItem = async (req, res) => {
  try {
    const { requestId, expenseId } = req.params;
    const employeeId = req.user.id;

    // Find the request and verify ownership and status
    const request = await Request.findOne({ 
      _id: requestId, 
      employee: employeeId,
      status: "pending" // Can only modify pending requests
    });

    if (!request) {
      return res.status(404).json({ 
        message: "Request not found, unauthorized, or cannot be modified in its current status" 
      });
    }

    // Find the expense item to get its info for the comment
    const expenseToRemove = request.expenses.find(
      expense => expense._id.toString() === expenseId
    );
    
    if (!expenseToRemove) {
      return res.status(404).json({
        message: "Expense item not found in request"
      });
    }

    // Get expense information for the comment
    const expenseName = expenseToRemove.serviceName;
    const expenseAmount = expenseToRemove.amount;

    // Remove the expense item
    request.expenses = request.expenses.filter(
      expense => expense._id.toString() !== expenseId
    );

    // Update the total amount
    request.totalAmountRequested = request.expenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
      0
    );

    // If no expenses left, return an error
    if (request.expenses.length === 0) {
      return res.status(400).json({
        message: "Cannot remove all expenses. Request must have at least one expense item."
      });
    }

    // Add a comment about the expense being removed
    request.comments.push({
      user: employeeId,
      userType: "employee",
      comment: `Removed expense item: ${expenseName} - ₹${expenseAmount}`,
      timestamp: new Date()
    });

    await request.save();

    res.status(200).json({
      message: "Expense removed successfully",
      request
    });
  } catch (error) {
    console.error("Error removing expense item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
