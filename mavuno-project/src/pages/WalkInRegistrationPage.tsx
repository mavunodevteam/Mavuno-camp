import { useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { useDesktopUp } from "@/hooks/use-desktop-up"
import { useWalkInPaymentAside } from "@/hooks/use-walk-in-payment-aside"
import {
  WalkInCampRegistrationForm,
  type WalkInCampCategory,
} from "@/components/registration/WalkInCampRegistrationForm"

/** Placeholder until camp capacity is loaded from the API. */
const CAPACITY_USED = 320
const CAPACITY_TOTAL = 1000

const WALK_IN_FEES: Record<WalkInCampCategory, number> = {
  myf: 2000,
  mya: 2000,
}

function CampTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium leading-5 transition-colors",
        active
          ? "bg-white text-[#18181B] shadow-sm"
          : "text-[#71717A] hover:text-[#18181B]"
      )}
    >
      {children}
    </button>
  )
}

export default function WalkInRegistrationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<WalkInCampCategory>("myf")

  useEffect(() => {
    const camp = searchParams.get("camp")
    if (camp === "myf" || camp === "mya") {
      setCategory(camp)
    }
  }, [searchParams])

  function selectCategory(next: WalkInCampCategory) {
    setCategory(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set("camp", next)
        return params
      },
      { replace: true }
    )
  }

  const spotsLeft = CAPACITY_TOTAL - CAPACITY_USED
  const desktopUp = useDesktopUp()
  const { state, isMobile } = useSidebar()
  const desktopSidebarOpen =
    desktopUp && !isMobile && state === "expanded"
  const paymentAside = useWalkInPaymentAside()

  const walkInHeader = (
    <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-4">
      <div
        role="tablist"
        aria-label="Camp category"
        className="inline-flex w-fit max-w-full shrink-0 rounded-lg bg-[#F4F4F5] p-1"
      >
        <CampTab
          active={category === "myf"}
          onClick={() => selectCategory("myf")}
        >
          MYF (14 – 17)
        </CampTab>
        <CampTab
          active={category === "mya"}
          onClick={() => selectCategory("mya")}
        >
          MYA (18+)
        </CampTab>
      </div>
      <p className="text-xs leading-5 text-[#71717A] tablet:text-sm">
        <span className="font-medium text-[#18181B]">
          {CAPACITY_USED.toLocaleString("en-KE")}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[#18181B]">
          {CAPACITY_TOTAL.toLocaleString("en-KE")}
        </span>{" "}
        camper spots used.{" "}
        <span className="font-medium text-[#18181B]">
          {spotsLeft.toLocaleString("en-KE")} left
        </span>
        .
      </p>
    </div>
  )

  return (
    <WalkInCampRegistrationForm
      key={category}
      category={category}
      feePerCamper={WALK_IN_FEES[category]}
      header={walkInHeader}
      paymentAside={paymentAside}
      frameClassName={cn(
        desktopSidebarOpen && "walk-in-form-frame--desktop-sidebar-open"
      )}
    />
  )
}
