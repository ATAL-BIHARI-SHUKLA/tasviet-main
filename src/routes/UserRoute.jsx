import ProtectedRoute from "../utils/ProtectedRoute";
import UserLayout from "../layouts/UserLayout";
import { Navigate } from "react-router-dom";
import Dashboard from "../views/user/Dashboard";
import Profile from "../views/user/Profile";
import MyRequests from "../views/user/MyRequests";
import CreateRequest from "../views/user/CreateRequest";
import RequestDetail from "../views/user/RequestDetail";

export const userRoute = [{
    path: "/user",
    element: (
        <ProtectedRoute
            user={<UserLayout />}
            admin={<Navigate to="/401" />}
            management={<Navigate to="/401" />}
            account={<Navigate to="/401" />}
        />
    ),
    children: [
        { path: "/user", element: <Navigate to="/user/dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "profile", element: <Profile /> },
        { path: "my-requests", element: <MyRequests /> },
        { path: "create-request", element: <CreateRequest /> },
        { path: "request/:requestId", element:<RequestDetail/> },
    ],
}];