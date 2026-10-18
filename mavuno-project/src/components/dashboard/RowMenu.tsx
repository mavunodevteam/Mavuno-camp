import { MoreVertical } from "lucide-react"

const ITEM_CLASS = "block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"

/* The three dots menu on each roster row. Only shown to heads and admins. */
export function RowMenu({
  paymentStatus,
  onVerifyPayment,
  onApproveAssistance,
}: {
  paymentStatus: string | null
  onVerifyPayment: () => void
  onApproveAssistance: () => void
}) {
  const canVerify = paymentStatus === "pending"
  const canApprove = paymentStatus === "waiver_requested"

  if (!canVerify && !canApprove) {
    return <span className="text-xs text-muted-foreground">-</span>
  }

  /* Closes the menu, then runs the action */
  const run = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.closest("details")?.removeAttribute("open")
    action()
  }

  return (
    <details className="relative">
      <summary
        aria-label="More actions"
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md hover:bg-muted"
      >
        <MoreVertical className="size-4" />
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
        {canVerify && (
          <button type="button" className={ITEM_CLASS} onClick={run(onVerifyPayment)}>
            Verify payment
          </button>
        )}
        {canApprove && (
          <button type="button" className={ITEM_CLASS} onClick={run(onApproveAssistance)}>
            Approve assistance
          </button>
        )}
      </div>
    </details>
  )
}