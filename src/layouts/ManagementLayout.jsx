
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  MdDashboard, 
  MdPersonOutline, 
  MdLogout, 
  MdMenu, 
  MdClose, 
  MdAssignment, 
  MdBarChart
} from 'react-icons/md';

// Creating a management theme based on the admin theme
const managementTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7428dc', // Main purple
      light: '#8a4be3', // Lighter purple
      dark: '#670fdb', // Darker purple
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#670fdb', // Darker purple
      light: '#7f32e4',
      dark: '#5c00cb',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#000000', // Black for primary text
      secondary: '#555555', // Light black for less important text
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#000000',
    },
    h2: {
      fontWeight: 700,
      color: '#000000',
    },
    h3: {
      fontWeight: 600,
      color: '#000000',
    },
    h4: {
      fontWeight: 600,
      color: '#000000',
    },
    h5: {
      fontWeight: 500,
      color: '#000000',
    },
    h6: {
      fontWeight: 500,
      color: '#000000',
    },
    subtitle1: {
      fontWeight: 400,
      color: '#555555',
    },
    subtitle2: {
      fontWeight: 400,
      color: '#555555',
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          padding: '8px 16px',
          boxShadow: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7428dc 0%, #670fdb 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #670fdb 0%, #7428dc 100%)',
            boxShadow: '0px 4px 8px rgba(116, 40, 220, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '&.Mui-focused fieldset': {
              borderWidth: '1px',
            },
          },
        },
      },
    },
  },
});

const navItems = [
  { to: '/management/dashboard', label: 'Dashboard', icon: <MdDashboard className="text-xl" /> },
  { to: '/management/requests', label: 'Requests', icon: <MdAssignment className="text-xl" /> },
  { to: '/management/employee-stats', label: 'Employee Stats', icon: <MdBarChart className="text-xl" /> },
  { to: '/management/profile', label: 'Profile', icon: <MdPersonOutline className="text-xl" /> },
];


const ManagementLayout = () => {
  const { profile, logout } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleLogout = async () => {
    setShowModal(false);
    await logout();
    navigate('/');
  };

  return (
    <ThemeProvider theme={managementTheme}>
    <div className="min-h-screen bg-white flex flex-col md:flex-row md:overflow-hidden">
      {/* Mobile Hamburger */}
      <motion.button
        className="md:hidden fixed top-5 left-5 z-30 bg-white text-[#7428dc] rounded-full p-3 shadow-lg focus:outline-none"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
        style={{ boxShadow: '0 4px 20px rgba(116, 40, 220, 0.15)' }}
      >
        {sidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          className={`fixed z-20 top-0 left-0 h-screen w-72 bg-gradient-to-br from-[#7428dc] to-[#670fdb] text-white transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-all duration-300 ease-in-out flex-shrink-0 rounded-r-3xl md:rounded-r-none overflow-hidden`}
          initial={false}
          animate={{ 
            boxShadow: sidebarOpen ? '10px 0 30px rgba(0,0,0,0.2)' : 'none',
            x: sidebarOpen || window.innerWidth >= 768 ? 0 : -300
          }}
          style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        >
          {/* Sidebar content container with internal padding */}
          <div className="h-full flex flex-col p-6 relative overflow-y-auto custom-scrollbar overflow-x-hidden">
            {/* Logo and Management info */}
            <motion.div 
              className="mb-10 flex flex-col"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mr-3">
                  <MdDashboard className="w-6 h-6 text-[#7428dc]" />
                </div>
                <h1 className="font-bold text-xl text-white">Management Panel</h1>
              </div>
              {/* Management profile card */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                    <MdPersonOutline className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{profile?.displayName || 'Management'}</div>
                    <div className="text-white/70 text-sm">Management</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 flex-grow">
              <p className="text-white/60 text-xs uppercase tracking-wider font-medium px-3 mb-2">Navigation</p>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white text-[#7428dc] shadow-lg shadow-white/20' 
                          : 'text-white/90 hover:bg-white/10'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                    {item.to === location.pathname && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[#7428dc] ml-2"
                        layoutId="activeIndicator"
                      />
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            {/* Logout button */}
            <motion.button
              className="mt-6 w-full bg-white hover:bg-white/90 text-[#7428dc] font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <MdLogout className="w-5 h-5" />
              Logout
            </motion.button>

            {/* Decorative elements */}
            <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-white/5 -z-10"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5 z-0"></div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main 
        className="flex-1 min-h-screen pt-20 md:pt-6 px-4 md:px-8 pb-6 transition-all duration-300 overflow-y-auto md:ml-72"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Outlet />
      </motion.main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#7428dc]/10 flex items-center justify-center mb-5">
                  <MdLogout className="w-8 h-8 text-[#7428dc]" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Confirm Logout</h3>
                <p className="mb-8 text-gray-600 text-center">
                  Are you sure you want to end your session and logout?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-[#7428dc] text-white font-medium shadow-lg shadow-[#7428dc]/30 hover:shadow-[#7428dc]/40 hover:bg-[#670fdb] transition-all"
                    onClick={handleLogout}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    Confirm
                  </motion.button>
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all"
                    onClick={() => setShowModal(false)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ThemeProvider>
  );
};

export default ManagementLayout;