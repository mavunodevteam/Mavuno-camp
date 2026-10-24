import { Link, Outlet, useLocation, useNavigate } from "react-router"
import { LogOut, MoreVertical } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/AuthProvider"
import { signOut } from "@/lib/api/auth"
import { titleFor, visibleSections } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { useWalkInPaymentAside } from "@/hooks/use-walk-in-payment-aside"
import logo from "@/assets/camp-fearless-logo.png"
import { ThemeToggle } from "@/components/theme-toggle"

/* The three access levels, as people read them. Super admins are created in Supabase, not invited. */
const LEVEL_LABELS: Record<string, string> = {
  admin: "Super admin",
  head: "Head",
  facilitator: "Facilitator",
}

const levelLabel = (level?: string | null) => (level ? (LEVEL_LABELS[level] ?? level) : "")

function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : ""
  return (first + last).toUpperCase()
}

function PortalLayoutInset({ pathname }: { pathname: string }) {
  const isWalkInRegistration = pathname === "/registration"
  const paymentAside = useWalkInPaymentAside()
  const walkInPaymentAside = isWalkInRegistration && paymentAside

  return (
    <SidebarInset className="flex min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 print:hidden">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1
          className={cn(
            "font-sans font-semibold tracking-normal",
            isWalkInRegistration
              ? "min-w-0 text-lg leading-6 tracking-tight tablet:text-[24px] tablet:leading-8 tablet:tracking-normal"
              : "text-base leading-none"
          )}
        >
          {titleFor(pathname)}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col px-4 pb-4",
          walkInPaymentAside ? "overflow-hidden" : "overflow-auto",
          isWalkInRegistration ? "gap-4 pt-8" : "gap-4 p-4"
        )}
      >
        <Outlet />
      </main>
    </SidebarInset>
  )
}

export default function PortalLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const sections = visibleSections(profile?.access_level)
  const role = levelLabel(profile?.access_level)
  const name = profile?.full_name ?? ""

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="print:hidden">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-3">
            {/* The logo artwork is light, so it sits on a dark tile that works in both light and dark mode */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 p-1">
              <img src={logo} alt="Camp Fearless" className="size-full object-contain" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold uppercase tracking-wide">Camp Fearless</span>
              <span className="truncate text-xs text-muted-foreground">{role}</span>
            </div>
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
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="h-12" />}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white">
                    {initialsOf(name).slice(0, 1)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                    <span className="truncate text-sm font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{role}</span>
                  </span>
                  <MoreVertical className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-64">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {initialsOf(name)}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-medium">{name}</span>
                      <span className="truncate text-xs text-muted-foreground">{role}</span>
                    </span>
                  </div>
                  <Separator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <PortalLayoutInset pathname={pathname} />
    </SidebarProvider>
  )
}