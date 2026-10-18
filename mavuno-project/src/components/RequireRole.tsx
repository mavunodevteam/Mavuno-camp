import type { ReactNode } from "react"
import { useAuth } from "@/components/AuthProvider"
import { hasLevel, type AccessLevel } from "@/lib/nav"

/*
  Wrap a page so only people at a given level can open it.
  This hides the page; the database still decides what each person is allowed to do.
*/
export function RequireRole({ min, children }: { min: AccessLevel; children: ReactNode }) {
  const { loading, profile } = useAuth()

  if (loading) return <p className="p-6 text-muted-foreground">Loading...</p>
  if (!profile || !hasLevel(profile.access_level, min)) {
    return <p className="p-6">You do not have access to this page.</p>
  }
  return <>{children}</>
}