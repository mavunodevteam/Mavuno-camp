import { useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Shows "Show" instead of the text. Clicking reveals it and records "<what> viewed" in the audit log.
 * Save as src/components/dashboard/SensitiveCell.tsx
 */
export function SensitiveCell({
  registrationId,
  has,
  details,
  what,
}: {
  registrationId: string
  has: boolean
  details: string | null
  what: "Medical details" | "Special needs"
}) {
  const [shown, setShown] = useState(false)

  if (!has) return <>-</>
  if (shown) return <>{details ?? "Yes"}</>

  return (
    <button
      type="button"
      className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
      onClick={() => {
        setShown(true)
        // Fire and forget: failing to log should not block the person from seeing the details.
        supabase.rpc("log_sensitive_view", { p_registration: registrationId, p_what: what }).then(({ error }) => {
          if (error) console.error("Audit log failed", error)
        })
      }}
    >
      Show
    </button>
  )
}

/*
In RosterTable.tsx, add:
  import { SensitiveCell } from "./SensitiveCell"

and replace the two cells

  <TableCell>{row.has_medical_condition ? (row.medical_details ?? "Yes") : "-"}</TableCell>
  <TableCell>{row.has_special_needs ? (row.special_needs_details ?? "Yes") : "-"}</TableCell>

with

  <TableCell>
    <SensitiveCell registrationId={row.registration_id} has={row.has_medical_condition}
      details={row.medical_details} what="Medical details" />
  </TableCell>
  <TableCell>
    <SensitiveCell registrationId={row.registration_id} has={row.has_special_needs}
      details={row.special_needs_details} what="Special needs" />
  </TableCell>
*/