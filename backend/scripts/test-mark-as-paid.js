import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Login to get authentication cookie
async function login() {
  try {
    const response = await axios.post('https://tasviet.vercel.app/api/auth/login', {
      email: 'accountant@tasviet.com',
      password: '12345678'
    });
    
    return response.headers['set-cookie'][0];
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test the mark as paid functionality
async function testMarkAsPaid() {
  try {
    // First login to get cookie
    const cookie = await login();
    
    // Replace with actual request ID to test - we'll get an active request
    console.log('Getting a management_approved request to test with...');
    const requestsResponse = await axios.get(
      'https://tasviet.vercel.app/api/account/requests?status=management_approved&limit=1',
      { headers: { 'Cookie': cookie } }
    );
    
    if (!requestsResponse.data.data || requestsResponse.data.data.length === 0) {
      console.error('No management_approved requests found to test with');
      return;
    }
    
    const requestId = requestsResponse.data.data[0].id;
    console.log(`Found request ID: ${requestId} for testing`);
    
    // Create form data
    const formData = new FormData();
    formData.append('method', 'bank_transfer');
    formData.append('transactionId', 'TRANS-' + Date.now());
    formData.append('notes', 'Test payment from script');
    
    // Optional: Add a test file
    const testImagePath = path.join(process.cwd(), 'uploads', 'expenses', '1757922499961-e80fd833-92df-4257-ba08-d5198b0d35ba.png');
    if (fs.existsSync(testImagePath)) {
      console.log('Adding test image to the request');
      formData.append('bill', fs.createReadStream(testImagePath));
    } else {
      console.log('Test image not found at', testImagePath);
    }
    
    // Send the request
    console.log(`Marking request ${requestId} as paid...`);
    const response = await axios.post(
      `https://tasviet.vercel.app/api/account/requests/${requestId}/paid`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Cookie': cookie
        }
      }
    );
    
    console.log('Mark as paid response:', response.data);
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMarkAsPaid();