
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { MdEmail, MdLock, MdLogin } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Get the UnauthorizedError class from the default export
const { UnauthorizedError } = api;

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, role, isAuthenticated } = useUser();
  const navigate = useNavigate();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "management") {
        navigate("/management");
      } else if (role === "accountant") {
        navigate("/account/dashboard");
      } else if (role === "employee") {
        navigate("/user/dashboard");
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      // Login will now handle profile fetching internally
      const data = await login(email, password);
      
      // Get the user type directly from the response
      const userType = data.user?.userType;
      
      // Debug logging
      console.log("Login response:", data);
      console.log("User data:", data.user);
      console.log("User type:", userType);
      
      // Navigate based on the user type from response
      if (userType === "admin") {
        console.log("Redirecting to admin dashboard");
        navigate("/admin");
      } else if (userType === "management") {
        console.log("Redirecting to management dashboard");
        navigate("/management");
      } else if (userType === "accountant") {
        console.log("Redirecting to accountant dashboard");
        navigate("/account/dashboard");
      } else if (userType === "employee") {
        console.log("Redirecting to employee dashboard");
        navigate("/user/dashboard");
      } else {
        console.error("Unknown role after login:", data);
        setError("Login successful but role not recognized");
        navigate("/401");
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        console.error('Unauthorized error during login:', err.message);
        navigate('/unauthorized');
        return;
      }
      setError(err.message || "Invalid credentials. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-[#f5f2ff] px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="relative bg-white rounded-3xl shadow-lg p-8 md:p-10 overflow-hidden"
          variants={itemVariants}
        >
          {/* Decorative gradient elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7428dc]/10 to-[#670fdb]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-[#7428dc]/10 to-[#670fdb]/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          
          <motion.div
            className="relative z-10 mb-10 text-center"
            variants={itemVariants}
          >
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-[#7428dc] to-[#670fdb] mb-4">
              <MdLogin className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7428dc] to-[#670fdb] bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </motion.div>

          {error && (
            <motion.div 
              className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <motion.form 
            onSubmit={handleLogin} 
            className="space-y-5"
            variants={itemVariants}
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdEmail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7428dc] focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7428dc] focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full flex items-center justify-center bg-gradient-to-r from-[#7428dc] to-[#670fdb] text-white font-medium py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-70"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading || isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center">
                  <span>Sign in</span>
                  <MdLogin className="ml-2 h-5 w-5" />
                </span>
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            className="mt-8 text-center text-sm text-gray-500"
            variants={itemVariants}
          >
            © 2025 TasViet Enterprise Solutions
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
