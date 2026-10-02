import ProtectedRoute from "../utils/ProtectedRoute";
import AccountLayout from "../layouts/AccountLayout";
import { Navigate } from "react-router-dom";
import Dashboard from "../views/account/Dashboard";
import Requests from "../views/account/Requests";
import RequestDetail from "../views/account/RequestDetail";
import PaymentHistory from "../views/account/PaymentHistory";
import Profile from "../views/account/Profile";

export const accountRoute = [{
    path: "/account",
    element: <ProtectedRoute
        account={<AccountLayout />}
        user={<Navigate to="/401" />}
        admin={<Navigate to="/401" />}
        management={<Navigate to="/401" />}
    />,
    children: [
        {
            path: "/account", element: <Navigate to="/account/dashboard" replace /> 
        },
        { path: "dashboard", element: <Dashboard/> },
        { path: "requests", element: <Requests/> },
        { path: "requests/:requestId", element: <RequestDetail/> },
        {
            path: "payment-history",element: <PaymentHistory />
        },
        { path: "profile", element: <Profile/> },
    ]
}
]