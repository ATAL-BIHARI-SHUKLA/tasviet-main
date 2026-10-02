import express from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeRoles } from '../middlewares/verifyRole.js';
import { 
  uploadExpenseBill, 
  uploadMultipleExpenseBills,
  processUploadedFile, 
  processMultipleUploadedFiles,
  updateUploadedFile,
  validateFileAccess
} from '../utils/fileUpload.js';

const fileRouter = express.Router();

// All file routes require authentication
fileRouter.use(authenticate);

// Single file upload (for all user types)
fileRouter.post(
  "/upload",
  uploadExpenseBill,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded' 
        });
      }
      
      const fileData = await processUploadedFile(req);
      res.json({ 
        success: true,
        message: 'File uploaded successfully',
        data: fileData 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'File upload failed', 
        details: error.message 
      });
    }
  }
);

// Multiple file upload (for all user types)
fileRouter.post(
  "/upload-multiple",
  uploadMultipleExpenseBills,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No files uploaded' 
        });
      }
      
      const filesData = await processMultipleUploadedFiles(req);
      const successful = filesData.filter(file => file.success);
      const failed = filesData.filter(file => !file.success);
      
      res.json({ 
        success: true,
        message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: {
          successful,
          failed,
          total: filesData.length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Multiple file upload failed', 
        details: error.message 
      });
    }
  }
);

// Update/replace existing file (for all user types)
fileRouter.put(
  "/update/:fileId",
  uploadExpenseBill,
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No new file provided for update' 
        });
      }
      
      const updatedFileData = await updateUploadedFile(req, fileId);
      res.json({ 
        success: true,
        message: 'File updated successfully',
        data: updatedFileData 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'File update failed', 
        details: error.message 
      });
    }
  }
);

// Validate file access and get file info (for all user types)
fileRouter.get(
  "/validate/:fileId",
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({ 
          success: false,
          error: 'File ID is required' 
        });
      }
      
      const validation = await validateFileAccess(fileId);
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'File validation failed', 
        details: error.message 
      });
    }
  }
);

// Get file info and redirect to view (for all user types)
fileRouter.get(
  "/view/:fileId",
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const validation = await validateFileAccess(fileId);
      
      if (!validation.isValid) {
        return res.status(404).json({ 
          success: false,
          error: 'File not found or inaccessible' 
        });
      }
      
      // Redirect to Google Drive view link
      res.redirect(validation.directLink);
      
    } catch (error) {
      console.error('File view error:', error);
      res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }
  }
);

// Get direct download link (for all user types)
fileRouter.get(
  "/download/:fileId",
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const validation = await validateFileAccess(fileId);
      
      if (!validation.isValid) {
        return res.status(404).json({ 
          success: false,
          error: 'File not found or inaccessible' 
        });
      }
      
      // Redirect to Google Drive download link
      res.redirect(validation.downloadLink);
      
    } catch (error) {
      console.error('File download error:', error);
      res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }
  }
);

// Get file metadata without redirecting (for API usage)
fileRouter.get(
  "/info/:fileId",
  async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const validation = await validateFileAccess(fileId);
      
      res.json({
        success: true,
        data: {
          fileId,
          isValid: validation.isValid,
          viewUrl: validation.directLink,
          downloadUrl: validation.downloadLink,
          ...(validation.error && { error: validation.error })
        }
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to get file info', 
        details: error.message 
      });
    }
  }
);

export default fileRouter;
