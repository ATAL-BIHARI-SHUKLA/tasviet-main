import axios from 'axios';

const API_BASE_URL = 'https://tasviet.vercel.app/api';

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API functions for employee request management
export const employeeAPI = {
  // Get all requests for the current employee
  getMyRequests: async () => {
    try {
      const response = await api.get('/employee/my-requests');
      return response.data.requests || [];
    } catch (error) {
      console.error("Error fetching requests:", error);
      throw error;
    }
  },

  // Get details of a specific request
  getRequestDetails: async (requestId) => {
    try {
      const response = await api.get(`/employee/request/${requestId}`);
      return response.data.request;
    } catch (error) {
      console.error("Error fetching request details:", error);
      throw error;
    }
  },

  // Create a new request with multiple expenses
  createRequest: async (requestData, files) => {
    try {
      // Upload files first if there are any
      const uploadedExpenses = await Promise.all(
        requestData.expenses.map(async (expense, index) => {
          // If there's a file to upload
          if (expense.bill && expense.bill instanceof File) {
            const fileInfo = await uploadFile(expense.bill);
            return {
              ...expense,
              bill: fileInfo
            };
          }
          return expense;
        })
      );

      // Create request with uploaded file information
      const requestPayload = {
        ...requestData,
        expenses: uploadedExpenses
      };

      const response = await api.post('/employee/create-request', requestPayload);
      return response.data;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  },

  // Add a new expense to an existing request
  addExpenseItem: async (requestId, expenseData) => {
    try {
      // Upload file first if present
      let processedExpense = { ...expenseData };
      
      if (expenseData.bill && expenseData.bill instanceof File) {
        const fileInfo = await uploadFile(expenseData.bill);
        processedExpense.bill = fileInfo;
      }

      const response = await api.post(`/employee/request/${requestId}/expense`, processedExpense);
      return response.data;
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  },

  // Remove an expense from a request
  removeExpenseItem: async (requestId, expenseId) => {
    try {
      const response = await api.delete(`/employee/request/${requestId}/expense/${expenseId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing expense:", error);
      throw error;
    }
  }
};

// File upload utility function
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE_URL}/upload`, 
      formData, 
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return {
      fileUrl: response.data.fileInfo.url,
      fileType: response.data.fileInfo.fileType,
      fileName: file.name
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export default api;
