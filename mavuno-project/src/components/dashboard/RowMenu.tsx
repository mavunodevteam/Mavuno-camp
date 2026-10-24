import { MoreVertical, CheckCircle, HeartHandshake, Edit, Undo2, XCircle, DoorOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RowMenu({
  status,
  paymentStatus,
  onCheckIn,
  onExitPermit,
  onUndoCheckIn,
  onEdit,
  onCancel,
  onVerifyPayment,
  onApproveAssistance,
  isHead,
}: {
  status: "registered" | "checked_in" | "checked_out"
  paymentStatus: string | null
  onCheckIn: () => void
  onExitPermit: () => void
  onUndoCheckIn: () => void
  onEdit: () => void
  onCancel: () => void
  onVerifyPayment: () => void
  onApproveAssistance: () => void
  isHead: boolean
}) {
  const canVerify = paymentStatus === "pending"
  const canApprove = paymentStatus === "waiver_requested"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-accent">
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">

        {/* ---------- REGISTERED (not yet on site) ---------- */}
        {status === "registered" && (
          <>
            <DropdownMenuItem onClick={onCheckIn}>
              <CheckCircle className="mr-2 size-4" />
              Check in
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 size-4" />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
              <XCircle className="mr-2 size-4" />
              Cancel registration
            </DropdownMenuItem>

            {/* Payment actions only appear for registered campers */}
            {(canVerify || canApprove) && <DropdownMenuSeparator />}
            {canVerify && (
              <DropdownMenuItem onClick={onVerifyPayment}>
                <CheckCircle className="mr-2 size-4" />
                Verify payment
              </DropdownMenuItem>
            )}
            {canApprove && (
              <DropdownMenuItem onClick={onApproveAssistance}>
                <HeartHandshake className="mr-2 size-4" />
                Approve assistance
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* ---------- CHECKED IN (on site, not yet departed) ---------- */}
        {status === "checked_in" && (
          <>
            {isHead && (
              <>
                <DropdownMenuItem onClick={onExitPermit}>
                  <DoorOpen className="mr-2 size-4" />
                  Issue exit permit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onUndoCheckIn}>
              <Undo2 className="mr-2 size-4" />
              Undo check-in
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 size-4" />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
              <XCircle className="mr-2 size-4" />
              Cancel registration
            </DropdownMenuItem>
          </>
        )}

        {/* ---------- CHECKED OUT (exit permit already issued) ---------- */}
        {status === "checked_out" && (
          <>
            <DropdownMenuItem onClick={onUndoCheckIn}>
              <Undo2 className="mr-2 size-4" />
              Undo check-in
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 size-4" />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
              <XCircle className="mr-2 size-4" />
              Cancel registration
            </DropdownMenuItem>
          </>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  )
}