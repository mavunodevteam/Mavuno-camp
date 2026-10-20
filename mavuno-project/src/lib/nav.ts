import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  ScrollText,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"

export type AccessLevel = "facilitator" | "head" | "admin"

const RANK: Record<AccessLevel, number> = { facilitator: 0, head: 1, admin: 2 }

export function hasLevel(level: string | null | undefined, min: AccessLevel): boolean {
  if (!level || !(level in RANK)) return false
  return RANK[level as AccessLevel] >= RANK[min]
}

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  min: AccessLevel
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, min: "facilitator" },
    ],
  },
  {
    label: "Camps",
    items: [
      { title: "Camp setup", url: "/camp-setup", icon: CalendarDays, min: "admin" },
    ],
  },
  {
    label: "Registration",
    items: [
      { title: "Registration", url: "/registration", icon: UserPlus, min: "facilitator" },
      { title: "Reports", url: "/reports", icon: FileText, min: "facilitator" },
      { title: "Waivers", url: "/waivers", icon: HandCoins, min: "head" },
      { title: "Payments", url: "/payments", icon: CreditCard, min: "head" },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users and roles", url: "/users", icon: Users, min: "admin" },
      { title: "Campuses and networks", url: "/campuses", icon: Building2, min: "admin" },
      { title: "Audit log", url: "/audit-log", icon: ScrollText, min: "admin" },
    ],
  },
]

export function visibleSections(level: string | null | undefined): NavSection[] {
  return NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasLevel(level, item.min)),
  })).filter((section) => section.items.length > 0)
}

export function titleFor(pathname: string): string {
  if (pathname === "/registration") {
    return "Walk-in camper registration"
  }
  for (const section of NAV) {
    for (const item of section.items) {
      if (pathname === item.url || pathname.startsWith(item.url + "/")) return item.title
    }
  }
  return ""
}