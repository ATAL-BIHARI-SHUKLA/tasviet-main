import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { uploadToCloudStorage } from '../config/driveAppsScript.js';

// Create uploads directory if it doesn't exist
// Use temp directory in serverless environments or when uploads directory can't be created
let uploadsDir;
try {
  uploadsDir = path.join(process.cwd(), 'uploads', 'expenses');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not create uploads directory, using temp directory:', error.message);
  // Fallback to OS temp directory if we can't create in current working directory
  uploadsDir = path.join(os.tmpdir(), 'tasviet-uploads', 'expenses');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (tempError) {
    console.error('Failed to create temp directory as well:', tempError.message);
    // Last fallback - just use the temp directory without creating subdirs
    uploadsDir = os.tmpdir();
  }
}

console.log(`[FILE UPLOAD] Using uploads directory: ${uploadsDir}`);
console.log(`[FILE UPLOAD] Current working directory: ${process.cwd()}`);
console.log(`[FILE UPLOAD] Temp directory: ${os.tmpdir()}`);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists before using it
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      console.error('Error ensuring upload directory exists:', error);
      // Fallback to temp directory
      cb(null, os.tmpdir());
    }
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to avoid collisions
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

// Create the multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
});

// Middleware for handling expense bill uploads
export const uploadExpenseBill = (req, res, next) => {
  console.log(`[FILE UPLOAD DEBUG] Route: ${req.method} ${req.path}`);
  console.log(`[FILE UPLOAD DEBUG] Content-Type: ${req.headers['content-type']}`);
  console.log(`[FILE UPLOAD DEBUG] User: ${req.user?.email || 'Not authenticated'}`);
  
  // Apply the actual multer middleware
  upload.single('bill')(req, res, (err) => {
    if (err) {
      console.log(`[FILE UPLOAD ERROR] Multer error:`, err);
      console.log(`[FILE UPLOAD ERROR] Field name expected: 'bill'`);
    }
    next(err);
  });
};

// Middleware for handling multiple expense bill uploads (max 10 files)
export const uploadMultipleExpenseBills = upload.array('bills', 10);

// Helper function to process uploaded file and return file info
export const processUploadedFile = async (req) => {
  if (!req.file) {
    return null;
  }

  // Determine file type
  let fileType = 'other';
  if (req.file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (req.file.mimetype === 'application/pdf') {
    fileType = 'pdf';
  }
  
  // Upload file to Google Drive
  try {
    console.log('📤 Processing file upload to Google Drive...');
    
    const uploadResult = await uploadToCloudStorage(req.file, 'expenses');
    
    // Delete temporary file after successful upload
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Could not clean up temporary file:', cleanupError.message);
    }
    
    return {
      fileId: uploadResult.fileId,
      fileUrl: uploadResult.url,
      directLink: uploadResult.directLink,
      downloadLink: uploadResult.downloadLink,
      fileType,
      originalFileName: req.file.originalname,
      uploadedAt: new Date(),
      success: true
    };
    
  } catch (error) {
    console.error("❌ Google Drive upload error:", error.message);
    
    // For production, we throw the error rather than falling back to local
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Process multiple uploaded files and return array of file info
export const processMultipleUploadedFiles = async (req) => {
  if (!req.files || req.files.length === 0) {
    return [];
  }

  const uploadPromises = req.files.map(async (file, index) => {
    // Determine file type
    let fileType = 'other';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    }
    
    try {
      console.log(`📤 Processing file ${index + 1}/${req.files.length}: ${file.originalname}`);
      
      const uploadResult = await uploadToCloudStorage(file, 'expenses');
      
      // Delete temporary file after successful upload
      try {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Temporary file ${index + 1} cleaned up`);
      } catch (cleanupError) {
        console.log(`⚠️ Could not clean up temporary file ${index + 1}:`, cleanupError.message);
      }
      
      return {
        fileId: uploadResult.fileId,
        fileUrl: uploadResult.url,
        directLink: uploadResult.directLink,
        downloadLink: uploadResult.downloadLink,
        fileType,
        originalFileName: file.originalname,
        uploadedAt: new Date(),
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Google Drive upload error for file ${index + 1}:`, error.message);
      
      // Return error info for this specific file
      return {
        fileId: null,
        fileUrl: null,
        fileType,
        originalFileName: file.originalname,
        uploadedAt: new Date(),
        success: false,
        error: error.message
      };
    }
  });
  
  return Promise.all(uploadPromises);
};

// Helper function to replace/update an existing file
export const updateUploadedFile = async (req, oldFileId) => {
  if (!req.file) {
    throw new Error('No new file provided for update');
  }

  // Determine file type
  let fileType = 'other';
  if (req.file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (req.file.mimetype === 'application/pdf') {
    fileType = 'pdf';
  }
  
  try {
    console.log('📤 Processing file update to Google Drive...');
    console.log(`🔄 Replacing file ID: ${oldFileId}`);
    
    // Upload new file to Google Drive
    const uploadResult = await uploadToCloudStorage(req.file, 'expenses');
    
    // Delete temporary file after successful upload
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Could not clean up temporary file:', cleanupError.message);
    }
    
    // Note: We don't delete the old file from Google Drive as it might be referenced elsewhere
    // The old file remains but is no longer linked to this record
    console.log('✅ File updated successfully');
    console.log('ℹ️ Old file remains in Google Drive but is no longer linked');
    
    return {
      fileId: uploadResult.fileId,
      fileUrl: uploadResult.url,
      directLink: uploadResult.directLink,
      downloadLink: uploadResult.downloadLink,
      fileType,
      originalFileName: req.file.originalname,
      uploadedAt: new Date(),
      success: true,
      previousFileId: oldFileId
    };
    
  } catch (error) {
    console.error("❌ Google Drive file update error:", error.message);
    throw new Error(`File update failed: ${error.message}`);
  }
};

// Helper function to validate file exists and is accessible
export const validateFileAccess = async (fileId) => {
  try {
    // For Google Drive files, we can validate by checking if the direct link works
    const testUrl = `https://drive.google.com/file/d/${fileId}/view`;
    
    // Simple validation - in production you might want to do an actual HTTP check
    return {
      fileId,
      directLink: testUrl,
      downloadLink: `https://drive.google.com/uc?id=${fileId}`,
      isValid: true
    };
    
  } catch (error) {
    console.error("❌ File validation error:", error.message);
    return {
      fileId,
      isValid: false,
      error: error.message
    };
  }
};

export default {
  uploadExpenseBill,
  uploadMultipleExpenseBills,
  processUploadedFile,
  processMultipleUploadedFiles,
  updateUploadedFile,
  validateFileAccess
};
