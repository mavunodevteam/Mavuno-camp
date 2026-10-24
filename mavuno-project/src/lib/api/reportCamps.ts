import { supabase } from "@/lib/supabase"

export interface ReportCamp {
  id: string
  category: string
  edition_id: string | null
}

/* Every camp with its edition, so the Camp dropdown on Reports can show only the chosen edition's camps */
export async function fetchReportCamps(): Promise<ReportCamp[]> {
  const { data, error } = await supabase.from("camps").select("id, category, edition_id").order("category")
  if (error) throw new Error("Could not load the camps.")
  return (data ?? []) as ReportCamp[]
}