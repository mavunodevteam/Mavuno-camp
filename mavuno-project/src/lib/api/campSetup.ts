import { supabase } from "@/lib/supabase"
import { friendlyError } from "@/lib/errors"
import type { CampDetails, CampRow } from "@/lib/campSetup"

export interface EditionDb {
  id: string
  name: string
  is_open: boolean
  facilitator_fee: number | null
  facilitator_fee_updated_at: string | null
  facilitator_fee_updated_by_name: string | null
  created_at: string
}

/* The welcome page fields, in the shape the Welcome page card uses */
export type WelcomeValues = {
  myfDescription: string
  myfImage: string
  myfBring: string
  myfExpect: string
  myfKnow: string
  myaDescription: string
  myaImage: string
  myaBring: string
  myaExpect: string
  myaKnow: string
}

export async function loadCampSetup(): Promise<{
  camps: CampRow[]
  editions: EditionDb[]
  spots: Record<string, number>
}> {
  const [camps, editions, roster] = await Promise.all([
    supabase.from("camps").select("*"),
    supabase
      .from("editions")
      .select("id, name, is_open, facilitator_fee, facilitator_fee_updated_at, facilitator_fee_updated_by_name, created_at")
      .order("created_at", { ascending: false }),
    /* Everyone registered for a camp takes a spot, facilitators included */
    supabase.from("camper_roster").select("camp_id").limit(5000),
  ])
  if (camps.error) throw new Error(friendlyError(camps.error))
  if (editions.error) throw new Error(friendlyError(editions.error))
  if (roster.error) throw new Error(friendlyError(roster.error))

  const spots: Record<string, number> = {}
  for (const row of (roster.data ?? []) as { camp_id: string }[]) {
    spots[row.camp_id] = (spots[row.camp_id] ?? 0) + 1
  }
  return { camps: (camps.data ?? []) as CampRow[], editions: (editions.data ?? []) as EditionDb[], spots }
}

export async function saveCampDetails(campId: string, d: CampDetails): Promise<void> {
  const { error } = await supabase
    .from("camps")
    .update({
      start_date: d.startDate,
      end_date: d.endDate,
      camper_limit: d.camperLimit,
      fee_online: d.onlineFee,
      fee_walk_in: d.walkInFee,
      registration_opens: d.opens,
      registration_closes: d.closes,
    })
    .eq("id", campId)
  if (error) throw new Error(friendlyError(error))
}

export async function setCampRuns(campId: string, runs: boolean): Promise<void> {
  const { error } = await supabase.from("camps").update({ runs }).eq("id", campId)
  if (error) throw new Error(friendlyError(error))
}

export async function setCampPaused(campId: string, paused: boolean): Promise<void> {
  const { error } = await supabase.from("camps").update({ registration_paused: paused }).eq("id", campId)
  if (error) throw new Error(friendlyError(error))
}

/* A picture chosen on this computer is a temporary address; this uploads it and returns the public one */
async function uploadCampImage(campId: string, temporaryUrl: string): Promise<string> {
  const blob = await (await fetch(temporaryUrl)).blob()
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"
  const path = `${campId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from("camp-images").upload(path, blob, { contentType: blob.type })
  if (error) throw new Error(error.message)
  return supabase.storage.from("camp-images").getPublicUrl(path).data.publicUrl
}

export async function saveWelcomeContent(
  camps: { id: string; category: "myf" | "mya" }[],
  values: WelcomeValues
): Promise<WelcomeValues> {
  const saved: WelcomeValues = { ...values }

  for (const camp of camps) {
    const p = camp.category
    const imageKey = p === "myf" ? "myfImage" : "myaImage"
    let image = values[imageKey]
    if (image.startsWith("blob:")) image = await uploadCampImage(camp.id, image)
    saved[imageKey] = image

    const pick = (part: "Description" | "Bring" | "Expect" | "Know") =>
      values[`${p}${part}` as keyof WelcomeValues]

    const { error } = await supabase
      .from("camps")
      .update({
        welcome_description: pick("Description"),
        welcome_image_url: image === "" ? null : image,
        welcome_bring: pick("Bring"),
        welcome_expect: pick("Expect"),
        welcome_know: pick("Know"),
      })
      .eq("id", camp.id)
    if (error) throw new Error(friendlyError(error))
  }
  return saved
}

export async function createEdition(name: string): Promise<void> {
  const { error } = await supabase.rpc("create_edition", { p_name: name })
  if (error) throw new Error(friendlyError(error))
}

export async function reopenEdition(id: string): Promise<void> {
  const { error } = await supabase.rpc("reopen_edition", { p_id: id })
  if (error) throw new Error(friendlyError(error))
}

export async function closeEdition(id: string): Promise<void> {
  const { error } = await supabase.rpc("close_edition", { p_id: id })
  if (error) throw new Error(friendlyError(error))
}

export async function renameEdition(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("editions").update({ name: name.trim() }).eq("id", id)
  if (error) throw new Error(friendlyError(error))
}

export async function saveFacilitatorFee(editionId: string, fee: number): Promise<void> {
  const { error } = await supabase.from("editions").update({ facilitator_fee: fee }).eq("id", editionId)
  if (error) throw new Error(friendlyError(error))
}