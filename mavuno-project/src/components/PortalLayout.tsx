import { Link, Outlet, useLocation, useNavigate } from "react-router"
import { LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/AuthProvider"
import { signOut } from "@/lib/api/auth"
import { titleFor, visibleSections } from "@/lib/nav"
import logo from "@/assets/camp-fearless-logo.png"

export default function PortalLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
    console.log("AUTH STATE", useAuth())

  const sections = visibleSections(profile?.access_level)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="print:hidden">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-3">
            <img src={logo} alt="Camp Fearless" className="h-8 w-auto" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {sections.map((section, index) => (
            <SidebarGroup key={section.label ?? index}>
              {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                        render={<Link to={item.url} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="px-2 py-1 text-sm">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-xs capitalize text-muted-foreground">{profile?.access_level}</p>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-base font-semibold">{titleFor(pathname)}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}