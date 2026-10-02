import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the administration dashboard.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Users</h3>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold">24</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Total registered users in the system</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Employees</h3>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 font-semibold">18</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Active employees in the system</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Tasks</h3>
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 font-semibold">12</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Open tasks requiring attention</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">System Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Database</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Operational
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">API</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Operational
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Storage</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              80% Used
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
