import { createBrowserRouter } from "react-router-dom";

import { userRoute } from "./UserRoute";
import { managementRoute } from "./ManagementRoute";
import { accountRoute } from "./AccountRoute";
import { adminRoutes } from "./AdminRoute";
import { lazy } from "react";
import NotFound from "../views/NotFound";
import Unauthorized from "../views/Unauthorized";
import CookiePolicy from "../views/CookiePolicy";
import AppLayout from "../layouts/AppLayout";

const MainPage = lazy(()=>import("../views/index"))

const authRoutes = [
    {
        path: "/",
        element: <MainPage/>
    },
    {
        path: "/401",
        element: <Unauthorized />
    },
    {
        path: "/unauthorized",
        element: <Unauthorized />
    },
    {
        path: "/cookie-policy",
        element: <CookiePolicy />
    },
    {
        path:"*",
        element: <NotFound/>
    }
];

export const routes = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            ...userRoute,
            ...managementRoute,
            ...accountRoute,
            ...adminRoutes,
            ...authRoutes
        ]
    }
]);