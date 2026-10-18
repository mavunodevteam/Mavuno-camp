import { supabase } from "@/lib/supabase"
import { friendlyError } from "@/lib/errors"

/* Facilitator heads and admins only. The database refuses anyone else. */
export async function approveWaiver(batchId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_waiver", { p_batch_id: batchId })
  if (error) throw new Error(friendlyError(error))
}

/* Marks an M-Pesa code as checked against the Paybill statement */
export async function verifyPayment(batchId: string): Promise<void> {
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "success" })
    .eq("batch_id", batchId)
    .eq("status", "pending")
    .select("id")

  if (error) throw new Error(friendlyError(error))
  if (!data || data.length === 0) {
    throw new Error("Nothing was changed. The payment may already be verified, or you may not have permission.")
  }
}