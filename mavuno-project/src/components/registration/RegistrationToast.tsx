import { AlertCircle, Check, X } from "lucide-react"
import { Link } from "react-router"
import { cn } from "@/lib/utils"

export type RegistrationToastVariant = "success" | "error"

export type RegistrationToastAction = {
  label: string
  href: string
}

export type RegistrationToastItem = {
  id: string
  variant: RegistrationToastVariant
  message: string
  action?: RegistrationToastAction
}

type RegistrationToastProps = {
  toast: RegistrationToastItem
  onDismiss: (id: string) => void
}

export function RegistrationToast({ toast, onDismiss }: RegistrationToastProps) {
  const isSuccess = toast.variant === "success"

  return (
    <div
      role="status"
      className={cn(
        "relative w-full max-w-[420px] rounded-lg border px-4 py-3 pl-[52px] pr-3 shadow-md",
        isSuccess
          ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
          : "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
      )}
    >
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-full border shadow-sm",
          isSuccess
            ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
            : "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
        )}
      >
        <X className="size-3.5" strokeWidth={2.5} />
      </button>

      <span
        className={cn(
          "absolute left-3 top-3 flex size-8 items-center justify-center rounded-full",
          isSuccess ? "bg-[#16A34A]" : "bg-[#DC2626]"
        )}
        aria-hidden
      >
        {isSuccess ? (
          <Check className="size-4 text-white" strokeWidth={2.5} />
        ) : (
          <AlertCircle className="size-4 text-white" strokeWidth={2.5} />
        )}
      </span>

      <p className="text-sm font-normal leading-5">{toast.message}</p>
      {toast.action ? (
        <Link
          to={toast.action.href}
          onClick={() => onDismiss(toast.id)}
          className={cn(
            "mt-2 inline-block text-sm font-semibold underline underline-offset-2",
            isSuccess ? "text-[#166534]" : "text-[#991B1B]"
          )}
        >
          {toast.action.label}
        </Link>
      ) : null}
    </div>
  )
}
