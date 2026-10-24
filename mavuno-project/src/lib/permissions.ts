/* The 13 things a role can be allowed to do, in the groups the Permissions by role table shows */
export type PermissionId =
  | "register"
  | "check-in"
  | "check-out"
  | "issue-waivers"
  | "verify-payments"
  | "view-records"
  | "print-records"
  | "export-records"
  | "view-medical"
  | "edit-camp-setup"
  | "manage-campuses"
  | "manage-users"
  | "view-audit-log"

export type PermissionSpec = { id: PermissionId; label: string; sensitive?: boolean }

export const PERMISSION_GROUPS: { label: string; permissions: PermissionSpec[] }[] = [
  {
    label: "Campers",
    permissions: [
      { id: "register", label: "Register campers" },
      { id: "check-in", label: "Check in campers" },
      { id: "check-out", label: "Check out campers" },
    ],
  },
  {
    label: "Waivers and payments",
    permissions: [
      { id: "issue-waivers", label: "Issue waivers" },
      { id: "verify-payments", label: "Verify payments" },
    ],
  },
  {
    label: "Records",
    permissions: [
      { id: "view-records", label: "View records" },
      { id: "print-records", label: "Print records", sensitive: true },
      { id: "export-records", label: "Export records", sensitive: true },
      { id: "view-medical", label: "View medical details", sensitive: true },
    ],
  },
  {
    label: "Administration",
    permissions: [
      { id: "edit-camp-setup", label: "Edit camp setup" },
      { id: "manage-campuses", label: "Manage campuses and networks" },
      { id: "manage-users", label: "Manage users" },
      { id: "view-audit-log", label: "View audit log", sensitive: true },
    ],
  },
]

export const PERMISSION_COUNT = PERMISSION_GROUPS.reduce((total, group) => total + group.permissions.length, 0)