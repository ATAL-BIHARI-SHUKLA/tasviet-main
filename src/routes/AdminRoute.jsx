import ProtectedRoute from "../utils/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import { Navigate } from "react-router-dom";
import Dashboard from "../views/admin/Dashboard";
import Requests from "../views/admin/Requests";
import RequestDetails from "../views/admin/RequestDetails";
import Employees from "../views/admin/Employees";
import EmployeeDetails from "../views/admin/EmployeeDetails";
import Profile from "../views/admin/Profile";  
export const adminRoutes = [{
    path:"/admin",
    element: <ProtectedRoute
    admin={<AdminLayout/>}
    user = {<Navigate to="/401"/>}
    management={<Navigate to="/401" />}
    account={<Navigate to="/401" />}
    />,
    children:[
        
            { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
            { path: "dashboard", element: <Dashboard/> },
            { path: "profile", element: <Profile/> },
            { path: "requests", element: <Requests/> },
            { path: "requests/:requestId", element: <RequestDetails/> },
            { path: "employees", element: <Employees/> },
            { path: "employees/:id", element: <EmployeeDetails/> },
        
    ]
}]