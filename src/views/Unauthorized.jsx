import React from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const Unauthorized = () => {
  // Clear any stored auth tokens and reset redirect flag
  React.useEffect(() => {
    // Only clear tokens, don't trigger any API calls
    localStorage.removeItem("authToken");
    
    // Reset the redirect flag to prevent further redirects
    if (api.resetRedirectFlag) {
      api.resetRedirectFlag();
    }
  }, []);

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-5xl font-bold text-red-500 mb-4">401</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please log in with appropriate credentials.
        </p>
        <Link
          to="/"
          className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          // Use replace to prevent adding to history stack
          replace={true}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
