import { Outlet } from "react-router"
import { RegistrationToastProvider } from "@/components/registration/RegistrationToastProvider"

export default function RootLayout() {
  return (
    <RegistrationToastProvider>
      <Outlet />
    </RegistrationToastProvider>
  )
}
