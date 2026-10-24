import { supabase } from "@/lib/supabase"

export interface Spots {
  used: number
  limit: number | null /* null when no limit has been set for the camp */
}

/*
  How full a camp is. Everyone registered for the camp counts, facilitators included.
  If the camper_limit column has not been added yet, the limit is null and the page hides the line.
*/
export async function fetchSpots(campId: string): Promise<Spots> {
  const [usedResult, limitResult] = await Promise.all([
    supabase.from("camper_roster").select("*", { count: "exact", head: true }).eq("camp_id", campId),
    supabase.from("camps").select("camper_limit").eq("id", campId).maybeSingle(),
  ])
  if (usedResult.error) throw new Error(usedResult.error.message)

  const row = limitResult.error ? null : (limitResult.data as { camper_limit: number | null } | null)
  return { used: usedResult.count ?? 0, limit: row?.camper_limit ?? null }
}