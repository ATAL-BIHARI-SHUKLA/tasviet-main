

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 13.5A2.25 2.25 0 015.25 11.25h1.5A2.25 2.25 0 019 13.5v5.25A2.25 2.25 0 016.75 21H5.25A2.25 2.25 0 013 18.75V13.5zM10.5 5.25A2.25 2.25 0 0112.75 3h1.5A2.25 2.25 0 0116.5 5.25v13.5A2.25 2.25 0 0114.25 21h-1.5A2.25 2.25 0 0110.5 18.75V5.25zM18 9.75A2.25 2.25 0 0120.25 7.5h1.5A2.25 2.25 0 0124 9.75v9A2.25 2.25 0 0121.75 21h-1.5A2.25 2.25 0 0118 18.75v-9z" />
      </svg>
    )
  },
  {
    to: '/admin/requests',
    label: 'Requests',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.5 3.75A2.25 2.25 0 012.25 6v12A2.25 2.25 0 004.5 20.25h15a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0019.5 3.75h-15zm0 1.5h15A.75.75 0 0120.25 6v.75h-16.5V6a.75.75 0 01.75-.75zm-.75 3v9.75c0 .414.336.75.75.75h15a.75.75 0 00.75-.75V6.75h-16.5zm3.75 3a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm4.5 0a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    to: '/admin/employees',
    label: 'Employees',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    to: '/admin/profile',
    label: 'Profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
      </svg>
    )
  },
];

const AdminLayout = () => {
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
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
            {/* Logo and Admin info */}
            <motion.div 
              className="mb-10 flex flex-col"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7428dc" className="w-6 h-6">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 1.5a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5zm0 2.25a6 6 0 110 12 6 6 0 010-12z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="font-bold text-xl text-white">Admin Panel</h1>
              </div>
              {/* Admin profile card */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">{profile?.displayName || 'Admin'}</div>
                    <div className="text-white/70 text-sm">Administrator</div>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7428dc" className="w-8 h-8">
                    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
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
  );
};

export default AdminLayout;