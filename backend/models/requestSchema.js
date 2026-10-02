import mongoose from "mongoose";

// Define expense item schema for individual expenses
const expenseItemSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  // Date when this specific expense occurred (within the trip date range)
  expenseDate: { type: Date },
  // Flag to indicate if this expense has a bill attached
  hasBill: { type: Boolean, default: false },
  // Bill is now optional - only required when hasBill is true
  bill: {
    fileId: { type: String }, // Google Drive file ID (not required)
    fileUrl: { type: String },
    fileType: { type: String, enum: ["image", "pdf", "other"] },
    originalFileName: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }
});

const requestSchema = new mongoose.Schema(
  {
    // Employee who created the request
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    
    // Array of expense items
    expenses: [expenseItemSchema],
    
    // Total amount is calculated from all expenses
    totalAmountRequested: { type: Number, required: true },
    
    // Final amount after admin review (adjusted or original)
    finalAmount: { type: Number },
    
    // Optional location field for travel-related expenses
    location: { type: String },
    
    // Trip date range - start and end dates for business trip/expense period
    // Not required for backward compatibility with legacy requests that lack trip dates
    tripStartDate: { type: Date },
    tripEndDate: { type: Date },

    // Request status flow
    status: {
      type: String,
      enum: ["pending", "admin_reviewed", "management_approved", "management_rejected", "payment_pending", "paid"],
      default: "pending",
    },
    
    // Admin review step
    adminReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who reviewed
      reviewedAt: { type: Date },
      adjustedAmount: { type: Number }, // If admin adjusted the amount
      notes: { type: String }
    },
    
    // Management approval/rejection step
    managementDecision: {
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Management who approved/rejected
      decidedAt: { type: Date },
      notes: { type: String }
    },
    
    // Payment processing by accountant
    payment: {
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Accountant who processed
      processedAt: { type: Date },
      method: { type: String, enum: ["cash", "upi", "bank_transfer", "check", "other"] },
      transactionId: { type: String },
      notes: { type: String },
      
      // Payment proof (required for UPI/bank transfers)
      proof: {
        fileId: { type: String }, // Google Drive file ID
        fileUrl: { type: String },
        fileType: { 
          type: String, 
          enum: ["image", "pdf"] 
        },
        originalFileName: { type: String },
        uploadedAt: { type: Date }
      }
    },
    
    // For any comments on the entire request from any role
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      userType: { type: String, required: true }, // To identify which role made the comment
      comment: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    
    // Track status changes for audit
    statusHistory: [{
      status: { type: String, required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      changedAt: { type: Date, default: Date.now },
      notes: { type: String }
    }]
  },
  { timestamps: true }
);

// Pre-save middleware to update the final amount and track status changes
requestSchema.pre('save', function(next) {
  // If this is a new document, calculate the total requested amount from expenses
  if (this.isNew && this.expenses && this.expenses.length > 0) {
    this.totalAmountRequested = this.expenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
      0
    );
  }
  
  // Set the final amount based on admin review status
  if (this.adminReview && this.adminReview.adjustedAmount !== undefined && this.adminReview.adjustedAmount !== null) {
    // If admin has reviewed and adjusted the amount, use that as final amount
    this.finalAmount = this.adminReview.adjustedAmount;
    // Make sure the finalAmount is used everywhere by explicitly setting it again
    this.markModified('finalAmount');
  } else {
    // Otherwise, use the original requested amount
    this.finalAmount = this.totalAmountRequested;
  }
  
  // If this is a new document, no need for status tracking
  if (this.isNew) {
    // Add first status history entry
    this.statusHistory = [{
      status: this.status,
      changedBy: this.employee, // Initial status set by employee
      notes: "Request created"
    }];
    return next();
  }
  
  // Check if status has changed
  if (this.isModified('status')) {
    // Get the last user who modified the document based on workflow step
    let changedBy;
    let notes = "";
    
    switch(this.status) {
      case "admin_reviewed":
        changedBy = this.adminReview?.reviewedBy;
        notes = "Reviewed by admin";
        break;
      case "management_approved":
      case "management_rejected":
        changedBy = this.managementDecision?.decidedBy;
        notes = this.status === "management_approved" ? "Approved by management" : "Rejected by management";
        break;
      case "payment_pending":
        changedBy = this.managementDecision?.decidedBy;
        notes = "Marked for payment";
        break;
      case "paid":
        changedBy = this.payment?.processedBy;
        notes = `Paid via ${this.payment?.method || 'unknown method'}`;
        break;
      default:
        // Try to determine who made the change
        changedBy = this.payment?.processedBy || this.managementDecision?.decidedBy || this.adminReview?.reviewedBy;
        notes = "Status updated";
    }
    
    // Only add history if we have a user reference
    if (changedBy) {
      if (!this.statusHistory) {
        this.statusHistory = [];
      }
      
      this.statusHistory.push({
        status: this.status,
        changedBy: changedBy,
        changedAt: new Date(),
        notes: notes
      });
    }
  }
  
  next();
});

const Request = mongoose.model("Request", requestSchema);
export default Request;
