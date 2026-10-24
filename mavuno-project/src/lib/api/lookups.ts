import { supabase } from "@/lib/supabase"
import type { Camp, Campus, FacilitatorRole, DepartureReason } from "./types"
import { friendlyError } from "../errors"

export async function fetchCamps(): Promise<Camp[]> {
  const { data, error } = await supabase
    .from("camps")
    .select("*, editions!inner(is_open)")
    .eq("editions.is_open", true)
    .eq("runs", true)
    .order("start_date")
  if (error) throw new Error(friendlyError(error))
  return (data ?? []) as Camp[]
}


export async function fetchCampById(id: string): Promise<Camp | null> {
  const { data, error } = await supabase
    .from("camps")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Camp | null
}

// CORRECT
export async function fetchCampByCategory(category: "myf" | "mya"): Promise<Camp | null> {
  const { data, error } = await supabase
    .from("camps")
    .select("*, editions!inner(is_open)")
    .eq("editions.is_open", true)
    .eq("runs", true)
    .eq("category", category)
    .maybeSingle()
  if (error) throw new Error(friendlyError(error))
  return (data as Camp | null) ?? null
}

export async function fetchCampuses(): Promise<Campus[]> {
  const { data, error } = await supabase
    .from("campuses")
    .select("*")
    .order("name")

  if (error) throw new Error(error.message)
  return data as Campus[]
}

export async function fetchFacilitatorRoles(): Promise<FacilitatorRole[]> {
  const { data, error } = await supabase
    .from("facilitator_roles")
    .select("*")
    .order("name")

  if (error) throw new Error(error.message)
  return data as FacilitatorRole[]
}

export async function fetchDepartureReasons(): Promise<DepartureReason[]> {
  const { data, error } = await supabase
    .from("departure_reasons")
    .select("*")
    .order("name")

  if (error) throw new Error(error.message)
  return data as DepartureReason[]
}

export async function fetchAllCamps(): Promise<Camp[]> {
  const { data, error } = await supabase.from("camps").select("*").order("start_date")
  if (error) throw new Error(friendlyError(error))
  return (data ?? []) as Camp[]
}