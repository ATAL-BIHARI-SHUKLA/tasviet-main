import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Google Apps Script Web App URL - Replace with your actual URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgPrc4ji_Wyx-MwDma3w_pLdPcPDWbtvmk3314XyZVzsSGjNROYtQ2yjbVzNj6o-MyuQ/exec';

// Upload file to Google Drive via Google Apps Script proxy
async function uploadToCloudStorage(fileObject, folderPath = '') {
  try {
    console.log('🚀 Starting Google Apps Script upload...');
    
    // Prepare file for upload
    const fileName = fileObject.originalname || path.basename(fileObject.path);
    console.log(`📄 Uploading file: ${fileName}`);
    
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(fileObject.path);
    const fileContent = fileBuffer.toString('base64');
    
    // Prepare payload
    const payload = {
      fileName: fileName,
      fileContent: fileContent,
      mimeType: fileObject.mimetype || 'application/octet-stream',
      folderPath: folderPath
    };
    
    console.log(`📂 Upload location: ${folderPath || 'root'}`);
    
    // Send to Google Apps Script
    console.log('📡 Sending request to Google Apps Script...');
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText.substring(0, 200) + '...');
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('❌ Response was:', responseText);
      throw new Error(`Invalid JSON response from Google Apps Script: ${parseError.message}`);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    console.log(`✅ File uploaded successfully!`);
    console.log(`📁 File ID: ${result.fileId}`);
    console.log(`🔗 File URL: ${result.directLink}`);
    
    return {
      success: true,
      fileId: result.fileId,
      url: result.url,
      directLink: result.directLink,
      downloadLink: result.downloadLink,
      fileName: result.fileName,
      uploadLocation: result.uploadLocation
    };
    
  } catch (error) {
    console.error('❌ Google Apps Script upload failed:', error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

export { uploadToCloudStorage };
