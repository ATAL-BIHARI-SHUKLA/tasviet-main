

import ManagementLayout from "../layouts/ManagementLayout";
import ProtectedRoute from "../utils/ProtectedRoute";
import { Navigate } from "react-router-dom";
import Dashboard from "../views/management/Dashboard";
import Requests from "../views/management/Requests";
import RequestDetails from "../views/management/RequestDetails";
import EmployeeStats from "../views/management/EmployeeStats";
import EmployeeDetails from "../views/management/EmployeeDetails";
import Profile from "../views/management/Profile";

export const managementRoute = [{
    path: "/management",
    element: <ProtectedRoute management={<ManagementLayout />} user={<Navigate to="/401" />} />,
    children: [
        {
            path: "dashboard",
            element: <Dashboard />
        },
        {
            path: "requests",
            element: <Requests />
        },
        {
            path: "requests/:id",
            element: <RequestDetails />
        },
        {
            path: "employee-stats",
            element: <EmployeeStats />
        },
        {
            path: "employees/:id",
            element: <EmployeeDetails />
        },
        {
            path: "profile",
            element: <Profile />
        },
        {
            path: "",
            element: <Dashboard />
        }
    ]
}];