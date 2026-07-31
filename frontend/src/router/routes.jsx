import { Navigate, createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";
import AdminPage from "../features/admin/AdminPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import BackupPage from "../features/backup/BackupPage.jsx";
import CategoriesPage from "../features/categories/CategoriesPage.jsx";
import CustomersPage from "../features/customers/CustomersPage.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import InvoicesPage from "../features/invoices/InvoicesPage.jsx";
import PosPage from "../features/pos/PosPage.jsx";
import ProductsPage from "../features/products/ProductsPage.jsx";
import ReportsPage from "../features/reports/ReportsPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "pos", element: <PosPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "invoices", element: <InvoicesPage /> },
          { path: "reports", element: <ReportsPage /> },
          {
            element: <RoleRoute allowedRoles={["admin"]} />,
            children: [
              { path: "admin", element: <AdminPage /> },
              { path: "backup", element: <BackupPage /> },
            ],
          },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default router;
