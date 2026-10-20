import { createBrowserRouter } from "react-router"
import RootLayout from "@/RootLayout"
import CampSelectionPage from "@/pages/CampSelectionPage"
import MyfRegisterPage from "@/pages/MyfRegisterPage"
import MyaRegisterPage from "@/pages/MyaRegisterPage"
import RegisterFacilitatorPage from "@/pages/RegisterFacilitatorPage"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import ReportsPage from "@/pages/ReportsPage"
import PortalLayout from "@/components/PortalLayout"
import WaiversPage from "@/pages/WaiversPage"
// import RegistrationPage from "@/pages/RegistrationPage"
import PaymentsPage from "@/pages/PaymentsPage"
import CampSetupPage from "@/pages/CampSetupPage"
import UsersPage from "@/pages/UsersPage"
import CampusesPage from "@/pages/CampusesPage"
import AuditLogPage from "@/pages/AuditLogPage"
// import { RequireRole } from "@/components/RequireRole"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"


export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <CampSelectionPage /> },
      { path: "/register/myf", element: <MyfRegisterPage /> },
      { path: "/register/mya", element: <MyaRegisterPage /> },
      { path: "/register-facilitator", element: <RegisterFacilitatorPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      {
        element: <PortalLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/waivers", element: <WaiversPage /> },
          { path: "/payments", element: <PaymentsPage /> },
          { path: "/camp-setup", element: <CampSetupPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/campuses", element: <CampusesPage /> },
          { path: "/audit-log", element: <AuditLogPage /> },
        ],
      },
    ],
  },
])