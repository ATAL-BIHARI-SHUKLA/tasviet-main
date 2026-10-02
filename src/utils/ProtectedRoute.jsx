


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { verifyAuth, refreshToken } from '../lib/api';
import Unauthorized from '../views/Unauthorized';

// Get the UnauthorizedError class from the default export
const { UnauthorizedError } = api;

const ProtectedRoute = ({ admin, user, management, account, children }) => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try to get authentication from stored token
        const storedToken = localStorage.getItem("authToken");
        
        if (storedToken) {
          console.log("Found stored token, attempting to verify");
        }
        
        try {
          const data = await verifyAuth();
          
          if (data && (data.success || data.user)) {
            // Extract role from all possible locations in the response
            const userRole = data.user?.userType || 
                          data.role || 
                          data.userType || 
                          (data.user && (data.user.role || data.user.userType));
            
            if (userRole) {
              console.log("Authentication verified with role:", userRole);
              setRole(userRole);
              setIsAuthenticated(true);
              return; // Exit early if successful
            }
          }
          
          // Try to refresh token if verification didn't return a role
          try {
            console.log("Initial auth failed, attempting token refresh");
            const refreshData = await refreshToken();
            
            if (refreshData && refreshData.success) {
              // Try verifying again after refresh
              const newData = await verifyAuth();
              
              if (newData && (newData.success || newData.user)) {
                const userRole = newData.user?.userType || 
                              newData.role || 
                              newData.userType || 
                              (newData.user && (newData.user.role || newData.user.userType));
                
                if (userRole) {
                  console.log("Auth verified after token refresh with role:", userRole);
                  setRole(userRole);
                  setIsAuthenticated(true);
                  return; // Exit early if successful
                }
              }
            }
            
            // If we get here, authentication failed but without 401
            console.log("Authentication failed after token refresh");
            setRole(null);
            setIsAuthenticated(false);
          } catch (refreshError) {
            // Check if it's an unauthorized error from refresh
            if (refreshError instanceof UnauthorizedError) {
              console.error('Unauthorized during token refresh:', refreshError.message);
              setRole(null);
              setIsAuthenticated(false);
              setLoading(false);  // Make sure loading is set to false before navigating
              // Check we're not already on the unauthorized page to prevent loops
              if (window.location.pathname !== '/unauthorized') {
                navigate('/unauthorized', { replace: true });
              }
              return;
            }
            
            console.error('Error refreshing token:', refreshError);
            setRole(null);
            setIsAuthenticated(false);
          }
        } catch (verifyError) {
          // Check if it's an unauthorized error from verify
          if (verifyError instanceof UnauthorizedError) {
            console.error('Unauthorized during verification:', verifyError.message);
            setRole(null);
            setIsAuthenticated(false);
            setLoading(false);  // Make sure loading is set to false before navigating
            // Check we're not already on the unauthorized page to prevent loops
            if (window.location.pathname !== '/unauthorized') {
              navigate('/unauthorized', { replace: true });
            }
            return;
          }
          
          throw verifyError;
        }
      } catch (error) {
        // For any other errors
        console.error('Error during authentication check:', error);
        setRole(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth(); // Call the verification function on component mount
  }, []); // Empty dependency array to run only on mount

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, show the children (usually a login screen)
  if (!isAuthenticated) {
    return (
      <div className='h-screen flex justify-center items-center lg:text-7xl md:text-5xl text-3xl text-slate-500'>
        <div className='text-center'>
          {children}
        </div>
      </div>
    );
  }

  // Return the appropriate component based on role
  switch (role) {
    case 'employee':
      return user;
    case 'accountant':
      return account;
    case 'management':
      return management;
    case 'admin':
      return admin;
    default:
      // Fallback if role doesn't match any expected value
      return <Unauthorized />;
  }
};

export default ProtectedRoute;
