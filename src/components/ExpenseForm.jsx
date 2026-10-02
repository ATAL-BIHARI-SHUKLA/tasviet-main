import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdClose } from 'react-icons/md';
import FileUpload from './FileUpload';

export default function ExpenseForm({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    serviceName: '',
    amount: '',
    description: '',
    bill: null
  });
  
  // Set initial data if editing an existing expense
  useEffect(() => {
    if (initialData) {
      setFormData({
        serviceName: initialData.serviceName || '',
        amount: initialData.amount || '',
        description: initialData.description || '',
        bill: initialData.bill || null
      });
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleFileChange = (file) => {
    setFormData({ ...formData, bill: file });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.serviceName || !formData.amount || !formData.bill) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Convert amount to number
    const expenseData = {
      ...formData,
      amount: Number(formData.amount)
    };
    
    onSubmit(expenseData);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-base">
          {initialData ? 'Edit Expense' : 'Add New Expense'}
        </h4>
        <motion.button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdClose className="w-5 h-5 text-gray-500" />
        </motion.button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-700 mb-1">
              Service Name<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="serviceName"
              required
              value={formData.serviceName}
              onChange={handleChange}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7428dc] focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm text-gray-700 mb-1">
              Amount (₹)<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7428dc] focus:border-transparent outline-none"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-xs sm:text-sm text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7428dc] focus:border-transparent outline-none"
          />
        </div>
        
        <div className="mb-5">
          <FileUpload
            onFileSelect={handleFileChange}
            currentFile={
              formData.bill ? { 
                file: formData.bill, 
                preview: formData.bill.type?.includes('image') ? URL.createObjectURL(formData.bill) : null 
              } : null
            }
            label="Upload Bill"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <motion.button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[#7428dc] text-white rounded-lg text-xs sm:text-sm hover:bg-[#670fdb] transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "Processing..." : initialData ? "Update Expense" : "Add Expense"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
