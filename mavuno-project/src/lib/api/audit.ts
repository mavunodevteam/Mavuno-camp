import { supabase } from "@/lib/supabase"

export type AuditEntry = {
  id: string
  created_at: string
  user_name: string
  action: string
  area: string
  camp: "MYF" | "MYA" | null
  subject: string
  summary: string | null
  changes: { label: string; from: string; to: string }[] | null
  removed: boolean
}

export type AuditLogPayload = {
  action: string
  area: string
  subject: string
  camp?: "MYF" | "MYA" | null
  summary?: string
  changes?: { label: string; from: string; to: string }[]
  user_name?: string
  removed?: boolean
}

/**
 * Log a sensitive or important action.
 * Fails silently so a logging error never blocks the user's actual action.
 */
export async function logAction(payload: AuditLogPayload): Promise<void> {
  try {
    // Try to get the current user's name
    let userName = payload.user_name
    if (!userName) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
        userName = profile?.full_name ?? user.email ?? "System"
      } else {
        userName = "System"
      }
    }

    const { error } = await supabase.from("audit_logs").insert({
      user_name: userName,
      action: payload.action,
      area: payload.area,
      camp: payload.camp ?? null,
      subject: payload.subject,
      summary: payload.summary ?? null,
      changes: payload.changes ?? null,
      removed: payload.removed ?? false,
    })

    if (error) console.warn("Audit log write failed:", error.message)
  } catch (e) {
    // Never throw — logging is a side-effect
    console.warn("Audit log error:", e)
  }
}

/** Alias so call sites that import logAudit still work. */
export const logAudit = logAction

export async function fetchAuditLogs(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AuditEntry[]
}

export async function fetchEditions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("editions")
    .select("id, name")
    .order("name", { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}