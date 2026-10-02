import React from 'react';
import { motion } from 'framer-motion';
import { MdDelete, MdReceipt, MdEdit } from 'react-icons/md';

export default function ExpenseList({ 
  expenses, 
  onRemove = null,
  onEdit = null,
  editable = false,
  showTotal = true
}) {
  // Calculate total amount
  const totalAmount = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-3 sm:p-4 border-b grid grid-cols-12 text-xs sm:text-sm font-medium text-gray-500">
        <div className="col-span-4 sm:col-span-5">Service Name</div>
        <div className="col-span-3 sm:col-span-2">Amount</div>
        <div className="col-span-3 sm:col-span-3">Bill</div>
        {editable && <div className="col-span-2 text-right">Actions</div>}
      </div>
      
      {/* Expense items */}
      {expenses && expenses.length > 0 ? (
        expenses.map((expense, index) => (
          <div 
            key={expense._id || index} 
            className="p-3 sm:p-4 border-b last:border-0 grid grid-cols-12 items-center text-xs sm:text-sm"
          >
            <div className="col-span-4 sm:col-span-5 font-medium">
              <div>{expense.serviceName}</div>
              {expense.description && (
                <div className="text-xs text-gray-500 mt-1 truncate">{expense.description}</div>
              )}
            </div>
            <div className="col-span-3 sm:col-span-2">₹{expense.amount}</div>
            <div className="col-span-3 sm:col-span-3">
              {expense.bill?.fileUrl ? (
                <a 
                  href={expense.bill.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 flex items-center"
                >
                  <MdReceipt className="mr-1" />
                  <span className="truncate">
                    {expense.bill.fileName || "View Bill"}
                  </span>
                </a>
              ) : expense.bill?.name ? (
                <div className="text-gray-600 flex items-center">
                  <MdReceipt className="mr-1" />
                  <span className="truncate">{expense.bill.name}</span>
                </div>
              ) : (
                <span className="text-gray-500 italic">No bill</span>
              )}
            </div>
            {editable && (
              <div className="col-span-2 text-right flex justify-end">
                {onEdit && (
                  <motion.button
                    onClick={() => onEdit(expense, index)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full mr-1"
                    title="Edit expense"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MdEdit className="w-4 h-4" />
                  </motion.button>
                )}
                {onRemove && (
                  <motion.button
                    onClick={() => onRemove(expense._id || index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                    title="Delete expense"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MdDelete className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="p-6 text-center text-gray-500">
          No expenses added yet
        </div>
      )}
      
      {/* Total row */}
      {showTotal && expenses.length > 0 && (
        <div className="bg-gray-50 p-3 sm:p-4 border-t grid grid-cols-12">
          <div className="col-span-4 sm:col-span-5 font-medium">Total</div>
          <div className="col-span-3 sm:col-span-2 font-bold">
            ₹{totalAmount.toFixed(2)}
          </div>
          <div className="col-span-5"></div>
        </div>
      )}
    </div>
  );
}
