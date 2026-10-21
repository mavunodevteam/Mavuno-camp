import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronDown, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  CamperDetailsFrame,
  createEmptyCamper,
  type CamperFieldErrors,
  type CamperFormState,
} from "@/components/registration/CamperDetailsFrame"
import {
  FIELD_ERROR_MESSAGE,
  FieldError,
} from "@/components/registration/FieldError"
import { useRegistrationToast } from "@/components/registration/RegistrationToastProvider"
import { REGISTRATION_TOAST_MESSAGES } from "@/components/registration/registrationToastMessages"
import { PHONE_FORMAT_ERROR_MESSAGE } from "@/lib/registrationFormat"
import { ageOptions } from "@/lib/registrationMapping"
import { registerFieldInputClasses } from "@/components/registration/registerFieldStyles"
import { cn } from "@/lib/utils"
import {
  createEmptyEmergencyContact,
  myfEmergencyFieldId,
  validateMyfRegistration,
  type EmergencyContactState,
  type EmergencyFieldErrors,
} from "@/lib/myfRegisterValidation"
import {
  getMyaAgeIssue,
  myaAgeFieldMessage,
  myaEmergencyFieldId,
  myaRegistrationFieldId,
  validateMyaRegistration,
} from "@/lib/myaRegisterValidation"
import { scrollToRegistrationField } from "@/lib/scrollToRegistrationField"
import { useDesktopUp } from "@/hooks/use-desktop-up"

const MAX_CAMPERS = 10

const MYF_RELATIONSHIP_OPTIONS = [
  "Parent",
  "Legal Guardian",
  "Sibling",
  "Relative",
  "Other",
] as const

const MYA_RELATIONSHIP_OPTIONS = [
  "Parent",
  "Legal Guardian",
  "Sibling",
  "Relative",
  "Other",
] as const

const WALK_IN_UI_CAMPUSES = [
  { id: "campus-hillcity", name: "HillCity (Multipliers Network)" },
  { id: "campus-langata", name: "Mavuno Langata" },
  { id: "campus-westlands", name: "Mavuno Westlands" },
] as const

const selectChevronClass =
  "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#71717A]"

export type WalkInCampCategory = "myf" | "mya"

type WalkInCampRegistrationFormProps = {
  category: WalkInCampCategory
  feePerCamper: number
  /** Tabs + capacity row rendered inside the form frame. */
  header?: ReactNode
  frameClassName?: string
  /** Desktop sidebar collapsed: payment panel outside the form frame. */
  paymentAside?: boolean
}

export function WalkInCampRegistrationForm({
  category,
  feePerCamper,
  header,
  frameClassName,
  paymentAside = false,
}: WalkInCampRegistrationFormProps) {
  const isMyf = category === "myf"
  const desktopUp = useDesktopUp()
  const { showRegistrationToast } = useRegistrationToast()

  const [campers, setCampers] = useState<CamperFormState[]>(() => [
    createEmptyCamper(),
  ])
  const [emergency, setEmergency] = useState<EmergencyContactState>(() =>
    createEmptyEmergencyContact()
  )
  const [mpesaCode, setMpesaCode] = useState("")
  const [waiverRequested, setWaiverRequested] = useState(false)
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [ageBlurredCamperIds, setAgeBlurredCamperIds] = useState<Set<string>>(
    () => new Set()
  )
  const [invalidScrollTick, setInvalidScrollTick] = useState(0)
  const scrollTargetFieldIdRef = useRef<string | null>(null)

  const camperCount = campers.length
  const totalDue = camperCount * feePerCamper
  const myfAges = ageOptions(14, 17)
  const emergencyFieldId = isMyf ? myfEmergencyFieldId : myaEmergencyFieldId
  const relationshipOptions = isMyf
    ? MYF_RELATIONSHIP_OPTIONS
    : MYA_RELATIONSHIP_OPTIONS

  const { camperErrorsById, emergencyErrors } = useMemo(() => {
    if (!validationAttempted) {
      return {
        camperErrorsById: {} as Record<string, CamperFieldErrors>,
        emergencyErrors: {} as EmergencyFieldErrors,
      }
    }
    if (isMyf) {
      return validateMyfRegistration(campers, emergency, mpesaCode)
    }
    return validateMyaRegistration(campers, emergency, mpesaCode)
  }, [validationAttempted, campers, emergency, mpesaCode, isMyf])

  function shouldShowMyaAgeError(camper: CamperFormState): boolean {
    if (getMyaAgeIssue(camper.age) === null) return false
    if (validationAttempted && camperErrorsById[camper.id]?.age) return true
    if (ageBlurredCamperIds.has(camper.id)) return true
    return false
  }

  function showEmergencyError(key: keyof EmergencyFieldErrors): boolean {
    return validationAttempted && Boolean(emergencyErrors[key])
  }

  function handleCompleteRegistration() {
    setValidationAttempted(true)
    if (isMyf) {
      const { isValid, firstInvalidFieldId } = validateMyfRegistration(
        campers,
        emergency,
        mpesaCode
      )
      if (!isValid) {
        if (firstInvalidFieldId) {
          scrollTargetFieldIdRef.current = firstInvalidFieldId
          setInvalidScrollTick((tick) => tick + 1)
        }
        return
      }
      toast.success("Walk-in registration ready to submit (backend not connected).")
      return
    }

    const { isValid, firstInvalidFieldId, hasUnder18Age } =
      validateMyaRegistration(campers, emergency, mpesaCode)
    if (isValid) {
      toast.success("Walk-in registration ready to submit (backend not connected).")
      return
    }
    if (hasUnder18Age) {
      showRegistrationToast({
        variant: "error",
        message: REGISTRATION_TOAST_MESSAGES.myaAgeMismatch,
        action: {
          label: REGISTRATION_TOAST_MESSAGES.myfRegisterLinkLabel,
          href: "/registration?camp=myf",
        },
      })
    }
    if (firstInvalidFieldId) {
      scrollTargetFieldIdRef.current = firstInvalidFieldId
      setInvalidScrollTick((tick) => tick + 1)
    }
  }

  useEffect(() => {
    if (invalidScrollTick === 0) return
    const fieldId = scrollTargetFieldIdRef.current
    if (!fieldId) return
    scrollToRegistrationField(fieldId)
  }, [invalidScrollTick])

  function addCamper() {
    setCampers((prev) =>
      prev.length >= MAX_CAMPERS ? prev : [...prev, createEmptyCamper()]
    )
  }

  function removeLastCamper() {
    setCampers((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)))
  }

  function removeCamper(id: string) {
    setCampers((prev) =>
      prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)
    )
  }

  function updateCamper(id: string, patch: Partial<CamperFormState>) {
    setCampers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    )
  }

  const emergencyFirstLabel = isMyf ? "Guardian first name" : "Contact first name"
  const emergencyLastLabel = isMyf ? "Guardian last name" : "Contact last name"

  const formFields = (
    <>
      <div className="flex min-h-[86px] w-full flex-col items-start gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="min-w-0 w-full tablet:w-auto">
          <h2 className="text-lg font-bold leading-7 text-[#18181B]">
            Select number of campers
          </h2>
          <p className="text-sm leading-5 text-[#71717A]">
            How many attendees are you registering in this batch?
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Remove one camper"
            disabled={camperCount <= 1}
            onClick={removeLastCamper}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[#18181B] text-white transition hover:scale-[1.03] hover:bg-zinc-700 active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <Minus size={16} />
          </button>
          <span
            aria-live="polite"
            className="flex h-9 min-w-9 items-center justify-center rounded-md border border-[#E4E4E7] bg-white px-2 text-base font-medium text-[#18181B]"
          >
            {camperCount}
          </span>
          <button
            type="button"
            aria-label="Add one camper"
            onClick={addCamper}
            disabled={camperCount >= MAX_CAMPERS}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[#18181B] text-white shadow-sm transition hover:scale-[1.03] hover:bg-zinc-700 active:scale-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {campers.map((camper, index) => (
        <div
          key={camper.id}
          className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4"
        >
          <CamperDetailsFrame
            camper={camper}
            index={index}
            total={camperCount}
            onUpdate={(patch) => updateCamper(camper.id, patch)}
            onRemove={index > 0 ? () => removeCamper(camper.id) : undefined}
            showFieldErrors={validationAttempted}
            fieldErrors={camperErrorsById[camper.id]}
            ageOptions={isMyf ? myfAges : undefined}
            campusOptions={WALK_IN_UI_CAMPUSES}
            ageInput={isMyf ? "select" : "text"}
            ageDigitsOnly={!isMyf}
            onAgeBlur={
              isMyf
                ? undefined
                : () =>
                    setAgeBlurredCamperIds((prev) =>
                      new Set(prev).add(camper.id)
                    )
            }
            ageShowError={!isMyf && shouldShowMyaAgeError(camper)}
            fieldErrorMessages={
              !isMyf && shouldShowMyaAgeError(camper)
                ? { age: myaAgeFieldMessage(camper.age) }
                : undefined
            }
            registrationFieldId={isMyf ? undefined : myaRegistrationFieldId}
            layout={desktopUp ? "portal" : "public"}
          />
        </div>
      ))}

      <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4">
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1">
            <h2 className="text-lg font-bold leading-7 text-[#18181B]">
              Emergency contact
            </h2>
            <p className="text-sm font-normal leading-5 text-[#71717A]">
              Held in case of an emergency on site
            </p>
          </div>

          <div
            className={cn(
              "grid w-full grid-cols-2 gap-4 tablet:grid-cols-3",
              desktopUp && "walk-in-reg-grid"
            )}
          >
            <label
              id={emergencyFieldId("guardianFirstName")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                {emergencyFirstLabel}
              </span>
              <input
                type="text"
                className={registerFieldInputClasses(
                  showEmergencyError("guardianFirstName")
                )}
                value={emergency.guardianFirstName}
                onChange={(e) =>
                  setEmergency((prev) => ({
                    ...prev,
                    guardianFirstName: e.target.value,
                  }))
                }
              />
              <FieldError show={showEmergencyError("guardianFirstName")} />
            </label>
            <label
              id={emergencyFieldId("guardianLastName")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                {emergencyLastLabel}
              </span>
              <input
                type="text"
                className={registerFieldInputClasses(
                  showEmergencyError("guardianLastName")
                )}
                value={emergency.guardianLastName}
                onChange={(e) =>
                  setEmergency((prev) => ({
                    ...prev,
                    guardianLastName: e.target.value,
                  }))
                }
              />
              <FieldError show={showEmergencyError("guardianLastName")} />
            </label>
            <label
              id={emergencyFieldId("guardianPhone")}
              className="col-span-2 flex min-w-0 flex-col gap-2 tablet:col-span-1"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Phone number
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={registerFieldInputClasses(
                  showEmergencyError("guardianPhone")
                )}
                value={emergency.guardianPhone}
                onChange={(e) =>
                  setEmergency((prev) => ({
                    ...prev,
                    guardianPhone: e.target.value,
                  }))
                }
              />
              <FieldError
                show={showEmergencyError("guardianPhone")}
                message={
                  showEmergencyError("guardianPhone")
                    ? emergency.guardianPhone.trim()
                      ? PHONE_FORMAT_ERROR_MESSAGE
                      : FIELD_ERROR_MESSAGE
                    : undefined
                }
              />
            </label>
          </div>

          <label
            id={emergencyFieldId("relationship")}
            className="flex w-full flex-col gap-2"
          >
            <span className="text-sm font-medium leading-5 text-[#18181B]">
              Relationship to camper(s)
            </span>
            <div className="relative">
              <select
                className={cn(
                  registerFieldInputClasses(showEmergencyError("relationship")),
                  "appearance-none pr-11"
                )}
                value={emergency.relationship}
                onChange={(e) =>
                  setEmergency((prev) => ({
                    ...prev,
                    relationship: e.target.value,
                  }))
                }
              >
                <option value="" disabled />
                {relationshipOptions.map((relationship) => (
                  <option key={relationship} value={relationship}>
                    {relationship}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={selectChevronClass}
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <FieldError show={showEmergencyError("relationship")} />
          </label>
        </div>
      </div>
    </>
  )

  const paymentPanel = (
      <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4">
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1">
            <h2 className="text-lg font-bold leading-7 text-[#18181B]">
              Payment
            </h2>
            <p className="text-sm font-normal leading-5 text-[#71717A]">
              Finish your registration by sending payment via M-Pesa. You&apos;ll
              get a confirmation code via SMS.
            </p>
          </div>

          <div className="flex w-full flex-col items-center rounded-lg bg-[#F9F9F9] p-4">
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <p className="text-sm font-normal leading-5 text-[#71717A]">
                Desk fee payment: Total amount due
              </p>
              <p className="text-[30px] font-bold leading-9 text-[#F05922]">
                Ksh {totalDue.toLocaleString("en-KE")}
              </p>
              <p className="text-sm font-normal leading-5 text-[#71717A]">
                for {camperCount} participant
                {camperCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex w-full justify-center gap-4 rounded-lg bg-[#F9F9F9] p-4">
            <div className="flex w-32 flex-col items-center gap-1 text-center">
              <p className="text-sm font-medium leading-5 text-[#18181B]">
                Paybill number
              </p>
              <p className="text-sm font-semibold leading-5 text-[#F05922]">
                400200
              </p>
            </div>
            <div className="flex w-32 flex-col items-center gap-1 text-center">
              <p className="text-sm font-medium leading-5 text-[#18181B]">
                Account name
              </p>
              <p className="text-sm font-semibold leading-5 text-[#F05922]">
                CAMPFEARLESS
              </p>
            </div>
          </div>

          <label
            id={emergencyFieldId("mpesaCode")}
            className="flex w-full flex-col gap-2"
          >
            <span className="text-sm font-medium leading-5 text-[#18181B]">
              M-Pesa confirmation code
            </span>
            <input
              type="text"
              className={registerFieldInputClasses(
                showEmergencyError("mpesaCode")
              )}
              placeholder="e.g UINKH7FJWL"
              autoComplete="off"
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value)}
            />
            <FieldError show={showEmergencyError("mpesaCode")} />
          </label>

          <label className="flex cursor-pointer gap-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3">
            <input
              type="checkbox"
              checked={waiverRequested}
              onChange={(e) => setWaiverRequested(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-[#E4E4E7]"
            />
            <span className="flex flex-col gap-1 text-sm leading-5">
              <span className="font-medium text-[#18181B]">
                Request for financial assistance
              </span>
              <span className="text-[#71717A]">
                An administrator will review your request before check-in is
                finalized.
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleCompleteRegistration}
            className="flex h-10 w-full items-center justify-center rounded-[6px] bg-[#18181B] px-4 text-sm font-medium leading-5 text-[#FAFAFA] shadow-[0px_1px_2px_0px_#0000000D] transition-transform hover:scale-[1.02] hover:bg-zinc-800 active:scale-100"
          >
            Complete &amp; auto Check-in
          </button>
        </div>
      </div>
  )

  const formFrame = (
    <div
      className={cn(
        "walk-in-form-frame flex min-w-0 flex-col gap-4",
        frameClassName
      )}
    >
      {header}
      <div className="walk-in-form-layout">{formFields}</div>
    </div>
  )

  if (paymentAside) {
    return (
      <div className="walk-in-registration-page-layout walk-in-registration-page-layout--payment-aside min-h-0 flex-1">
        <div className="walk-in-registration-form-scroll">{formFrame}</div>
        <aside className="walk-in-registration-payment">{paymentPanel}</aside>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "walk-in-form-frame flex min-w-0 flex-col gap-4",
        frameClassName
      )}
    >
      {header}
      <div className="walk-in-form-layout">
        {formFields}
        {paymentPanel}
      </div>
    </div>
  )
}
