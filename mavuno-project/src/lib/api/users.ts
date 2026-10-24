import type { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { friendlyError } from "@/lib/errors"
import type { PermissionId } from "@/lib/permissions"

export type CampAccess = "both" | "myf" | "mya"

export const CAMP_ACCESS_LABELS: Record<CampAccess, string> = {
  both: "Both",
  myf: "MYF only",
  mya: "MYA only",
}

export interface RoleRow {
  id: string
  name: string
  description: string | null
  can_sign_in: boolean
  is_locked: boolean
  permissions: PermissionId[]
}

export interface StaffRow {
  id: string
  email: string
  full_name: string | null
  role_id: string | null
  camp_access: CampAccess
  is_active: boolean
  invite_pending: boolean
  is_me: boolean
}

/* Our own rules raise plain English messages, so those are shown as they are */
function fail(error: PostgrestError): never {
  if (error.code === "P0001") throw new Error(error.message)
  if (error.code === "23505") throw new Error("A role with that name already exists.")
  if (error.code === "23503") throw new Error("That is still in use, so it cannot be removed.")
  if (error.code === "23514") throw new Error("A role without system access cannot hold permissions.")
  if (error.code === "42501") throw new Error("You do not have permission to do that.")
  throw new Error(friendlyError(error))
}

export async function loadUsersAndRoles(): Promise<{ staff: StaffRow[]; roles: RoleRow[]; counts: Record<string, number> }> {
  const [directory, roles, overview] = await Promise.all([
    supabase.rpc("staff_directory"),
    supabase.from("roles").select("id, name, description, can_sign_in, is_locked, permissions"),
    supabase.rpc("roles_overview"),
  ])
  if (directory.error) fail(directory.error)
  if (roles.error) fail(roles.error)
  if (overview.error) fail(overview.error)

  const counts: Record<string, number> = {}
  for (const row of (overview.data ?? []) as { role_id: string; users: number | string }[]) {
    counts[row.role_id] = Number(row.users)
  }
  return {
    staff: (directory.data ?? []) as StaffRow[],
    roles: (roles.data ?? []) as RoleRow[],
    counts,
  }
}

export async function setUserRole(userId: string, roleId: string): Promise<void> {
  const { error } = await supabase.from("staff_profiles").update({ role_id: roleId }).eq("id", userId)
  if (error) fail(error)
}

export async function setUserCampAccess(userId: string, access: CampAccess): Promise<void> {
  const { error } = await supabase.from("staff_profiles").update({ camp_access: access }).eq("id", userId)
  if (error) fail(error)
}

export async function renameUser(userId: string, fullName: string): Promise<void> {
  const { error } = await supabase.from("staff_profiles").update({ full_name: fullName.trim() }).eq("id", userId)
  if (error) fail(error)
}

/* Switching a user off is enforced by the database at once. The sign in block is added through the server function. */
export async function setUserActive(userId: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("staff_profiles").update({ is_active: active }).eq("id", userId)
  if (error) fail(error)
  try {
    await callManageUsers({ action: "set_active", userId, active })
  } catch {
    /* The sign in block is a second layer. The switch itself has already taken effect. */
  }
}

export async function createRole(input: { name: string; description: string; canSignIn: boolean }): Promise<void> {
  const { error } = await supabase.from("roles").insert({
    name: input.name.trim(),
    description: input.description.trim() === "" ? null : input.description.trim(),
    can_sign_in: input.canSignIn,
  })
  if (error) fail(error)
}

export async function updateRole(id: string, input: { name: string; description: string; canSignIn: boolean }): Promise<void> {
  const { error } = await supabase
    .from("roles")
    .update({
      name: input.name.trim(),
      description: input.description.trim() === "" ? null : input.description.trim(),
      can_sign_in: input.canSignIn,
    })
    .eq("id", id)
  if (error) fail(error)
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await supabase.from("roles").delete().eq("id", id)
  if (error) fail(error)
}

export async function setRolePermission(roleId: string, permission: PermissionId, granted: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_role_permission", { p_role: roleId, p_permission: permission, p_granted: granted })
  if (error) fail(error)
}

/* Inviting needs the server side function, because creating a login needs a key that must never be in the browser */
type ManageUsersBody =
  | { action: "invite"; fullName: string; email: string; roleId: string; campAccess: CampAccess; redirectTo: string }
  | { action: "resend"; userId: string; redirectTo: string }
  | { action: "cancel"; userId: string }
  | { action: "set_active"; userId: string; active: boolean }

async function callManageUsers(body: ManageUsersBody): Promise<void> {
  const { error } = await supabase.functions.invoke("manage-users", { body })
  if (!error) return
  let message = "The invite service is not available. Please try again, or ask the person who set up the app."
  const context = (error as { context?: Response }).context
  if (context && typeof context.json === "function") {
    try {
      const parsed = (await context.json()) as { error?: string }
      if (parsed.error) message = parsed.error
    } catch {
      /* keep the general message */
    }
  }
  throw new Error(message)
}

export const inviteUser = (input: { fullName: string; email: string; roleId: string; campAccess: CampAccess }) =>
  callManageUsers({ action: "invite", ...input, redirectTo: `${window.location.origin}/reset-password` })

export const resendInvite = (userId: string) =>
  callManageUsers({ action: "resend", userId, redirectTo: `${window.location.origin}/reset-password` })

export const cancelInvite = (userId: string) => callManageUsers({ action: "cancel", userId })