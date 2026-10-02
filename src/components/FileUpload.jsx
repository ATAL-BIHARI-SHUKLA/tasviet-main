import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdUploadFile, MdClose, MdReceipt } from 'react-icons/md';

export default function FileUpload({ 
  onFileSelect, 
  currentFile = null, 
  label = "Upload File", 
  accept = ".pdf,.jpg,.jpeg,.png", 
  required = true 
}) {
  const [preview, setPreview] = useState(currentFile?.preview || null);
  const [file, setFile] = useState(currentFile?.file || null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create a preview if it's an image
      if (selectedFile.type.includes('image')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
      
      // Call the parent component's handler
      onFileSelect(selectedFile);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    onFileSelect(null);
  };

  return (
    <div className="w-full">
      <label className="block text-xs sm:text-sm text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center">
        <label className="flex-1 cursor-pointer border border-dashed border-gray-300 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors">
          <input
            type="file"
            required={required && !file}
            onChange={handleFileChange}
            className="hidden"
            accept={accept}
          />
          <MdUploadFile className="h-6 w-6 mx-auto text-gray-400 mb-1" />
          <span className="text-xs sm:text-sm text-gray-500">
            {file ? "Change file" : "Choose a file"}
          </span>
          {file && (
            <div className="mt-1 text-xs text-gray-600 truncate max-w-full">
              {file.name}
            </div>
          )}
        </label>
        
        {file && (
          <div className="ml-3 p-2 border rounded-lg w-16 h-16 relative">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <MdReceipt className="h-8 w-8 text-[#7428dc]" />
              </div>
            )}
            <motion.button
              type="button"
              onClick={handleRemoveFile}
              className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MdClose className="h-3 w-3" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
