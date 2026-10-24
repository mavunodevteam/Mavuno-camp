/* Turn cryptic Supabase/Postgres errors into user-friendly messages. */

type SupabaseError = {
  message?: string
  code?: string
  details?: string | null
  hint?: string | null
}

export function friendlyError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again."

  const e = error as SupabaseError
  const msg = e.message ?? ""
  const code = e.code ?? ""

  // Unique constraint violations (duplicate rows)
  if (code === "23505") {
    if (msg.includes("contacts_phone_contact_type_key")) {
      return "That phone number is already on file. Please use a different one or contact the office."
    }
    if (msg.includes("mpesa_receipt")) {
      return "That M-Pesa receipt code has already been used."
    }
    return "This entry already exists. Please check your details."
  }

  // Foreign key violations (linked row is missing)
  if (code === "23503") {
    return "A linked record is missing. Please refresh and try again."
  }

  // Row-level security (permission denied)
  if (code === "42501" || msg.includes("row-level security")) {
    return "You don't have permission to do that."
  }

  // Unique constraint (fallback)
  if (code === "23514") {
    return "Some of the entered details are not valid. Please review and try again."
  }

  // Auth errors
  if (msg.includes("Invalid login credentials")) {
    return "Incorrect email or password."
  }
  if (msg.includes("Email not confirmed")) {
    return "Please confirm your email before signing in."
  }

  // Network / offline
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Could not reach the server. Check your internet connection and try again."
  }

    if (msg.includes('editions_name_key')) return 'An edition with that name already exists.'
  if (msg.includes('Give the edition a name')) return 'Give the edition a name.'
  if (msg.includes('camps_registration_window_check')) return 'Registration must close on or after the day it opens.'

  // Fallback: return the raw message so we're not hiding the truth
  return msg || "Something went wrong. Please try again."
}