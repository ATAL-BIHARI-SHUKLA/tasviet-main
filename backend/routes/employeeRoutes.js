import express from 'express';
import { 
  createRequest, 
  getMyRequests, 
  getRequestDetails, 
  addExpenseItem,
  removeExpenseItem 
} from '../controllers/employeeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/verifyRole.js';
import { 
  uploadExpenseBill, 
  processUploadedFile, 
  uploadMultipleExpenseBills,
  processMultipleUploadedFiles,
  updateUploadedFile,
  validateFileAccess
} from '../utils/fileUpload.js';

const empRouter = express.Router();

// File upload endpoint - separate from request creation
empRouter.post(
  "/upload-file",
  authenticate,
  authorizeRoles(["employee", "accountant"]), // Allow both employees and accountants
  uploadExpenseBill,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const fileData = await processUploadedFile(req);
      res.json({ 
        message: 'File uploaded successfully',
        file: fileData 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'File upload failed', 
        details: error.message 
      });
    }
  }
);

// File update/replace endpoint
empRouter.put(
  "/update-file/:fileId",
  authenticate,
  authorizeRoles(["employee", "accountant"]), // Allow both employees and accountants
  uploadExpenseBill,
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No new file provided for update' });
      }
      
      const updatedFileData = await updateUploadedFile(req, fileId);
      res.json({ 
        message: 'File updated successfully',
        file: updatedFileData 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'File update failed', 
        details: error.message 
      });
    }
  }
);

// Validate file access endpoint
empRouter.get(
  "/validate-file/:fileId",
  authenticate,
  authorizeRoles(["employee", "accountant"]), // Allow both employees and accountants
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const validation = await validateFileAccess(fileId);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ 
        error: 'File validation failed', 
        details: error.message 
      });
    }
  }
);

// Multiple file upload endpoint
empRouter.post(
  "/upload-multiple-files",
  authenticate,
  authorizeRoles(["employee"]),
  uploadMultipleExpenseBills,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      const filesData = await processMultipleUploadedFiles(req);
      res.json({ 
        message: `${filesData.length} files processed`,
        files: filesData 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Multiple file upload failed', 
        details: error.message 
      });
    }
  }
);

// Regular request endpoints
// Create a request (now expects file data in JSON, not multipart)
empRouter.post(
  "/request",
  authenticate,
  authorizeRoles(["employee"]),
  createRequest
);

empRouter.get("/my-requests", authenticate, authorizeRoles(["employee"]), getMyRequests);
empRouter.get("/request/:requestId", authenticate, authorizeRoles(["employee"]), getRequestDetails);

empRouter.post(
  "/request/:requestId/expense",
  authenticate,
  authorizeRoles(["employee"]),
  uploadExpenseBill,
  async (req, res, next) => {
    try {
      if (req.file) {
        req.body.bill = await processUploadedFile(req);
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  addExpenseItem
);

empRouter.delete(
  "/request/:requestId/expense/:expenseId",
  authenticate,
  authorizeRoles(["employee"]),
  removeExpenseItem
);

export default empRouter;