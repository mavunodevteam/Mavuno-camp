import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Minus, Plus } from "lucide-react"
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
import { PHONE_FORMAT_ERROR_MESSAGE } from "@/lib/registrationFormat"
import { registerFieldInputClasses } from "@/components/registration/registerFieldStyles"
import { cn } from "@/lib/utils"
import { useRegistrationToast } from "@/components/registration/RegistrationToastProvider"
import { REGISTRATION_TOAST_MESSAGES } from "@/components/registration/registrationToastMessages"
import {
  createEmptyEmergencyContact,
  getMyaAgeIssue,
  myaAgeFieldMessage,
  myaEmergencyFieldId,
  myaRegistrationFieldId,
  type EmergencyContactState,
  type EmergencyFieldErrors,
  validateMyaRegistration,
} from "@/lib/myaRegisterValidation"
import { scrollToRegistrationField } from "@/lib/scrollToRegistrationField"
import campRegistrationCompactImage from "@/assets/camp-registration-compact.png"
import campRegistrationImage from "@/assets/camp-registration.jpg"
import campFearlessLogo from "@/assets/camp-fearless-logo.png"
import iconBrackets from "@/assets/partner-icons/icon-brackets.png"
import iconCrosshatch from "@/assets/partner-icons/icon-crosshatch.png"
import iconRays from "@/assets/partner-icons/icon-rays.png"
import iconRings from "@/assets/partner-icons/icon-rings.png"
import iconSquares from "@/assets/partner-icons/icon-squares.png"
import iconSunburst from "@/assets/partner-icons/icon-sunburst.png"

const partnerIcons = [
  iconSquares,
  iconRays,
  iconSunburst,
  iconCrosshatch,
  iconRings,
  iconBrackets,
]

const REGISTRATION_FEE_KES = 1000

const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Legal Guardian",
  "Sibling",
  "Relative",
  "Other",
] as const

const selectChevronClass =
  "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#71717A]"

export default function MyaRegisterPage() {
  const { showRegistrationToast } = useRegistrationToast()
  const [campers, setCampers] = useState<CamperFormState[]>(() => [
    createEmptyCamper(),
  ])
  const [emergency, setEmergency] = useState<EmergencyContactState>(() =>
    createEmptyEmergencyContact()
  )
  const [mpesaCode, setMpesaCode] = useState("")
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [ageBlurredCamperIds, setAgeBlurredCamperIds] = useState<Set<string>>(
    () => new Set()
  )
  const [invalidScrollTick, setInvalidScrollTick] = useState(0)
  const scrollTargetFieldIdRef = useRef<string | null>(null)

  const camperCount = campers.length
  const totalDue = camperCount * REGISTRATION_FEE_KES

  const { camperErrorsById, emergencyErrors } = useMemo(() => {
    if (!validationAttempted) {
      return {
        camperErrorsById: {} as Record<string, CamperFieldErrors>,
        emergencyErrors: {} as EmergencyFieldErrors,
      }
    }
    return validateMyaRegistration(campers, emergency, mpesaCode)
  }, [validationAttempted, campers, emergency, mpesaCode])

  function shouldShowMyaAgeError(camper: CamperFormState): boolean {
    if (getMyaAgeIssue(camper.age) === null) return false
    if (validationAttempted && camperErrorsById[camper.id]?.age) return true
    if (ageBlurredCamperIds.has(camper.id)) return true
    return false
  }

  function markAgeBlurred(camperId: string) {
    setAgeBlurredCamperIds((prev) => new Set(prev).add(camperId))
  }

  function showEmergencyError(key: keyof EmergencyFieldErrors): boolean {
    return validationAttempted && Boolean(emergencyErrors[key])
  }

  function handleCompleteRegistration() {
    setValidationAttempted(true)
    const { isValid, firstInvalidFieldId, hasUnder18Age } =
      validateMyaRegistration(campers, emergency, mpesaCode)
    if (isValid) {
      // Submit when backend is wired
      return
    }
    if (hasUnder18Age) {
      showRegistrationToast({
        variant: "error",
        message: REGISTRATION_TOAST_MESSAGES.myaAgeMismatch,
        action: {
          label: REGISTRATION_TOAST_MESSAGES.myfRegisterLinkLabel,
          href: "/register/myf",
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
    setCampers((prev) => [...prev, createEmptyCamper()])
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

  return (
    <main className="min-h-svh bg-white px-4 py-3 desktop:h-svh desktop:overflow-hidden desktop:p-4">
      <div className="mx-auto grid h-full min-h-0 w-full grid-cols-1 gap-4 desktop:max-w-[1448px] desktop:grid-cols-[minmax(0,735fr)_minmax(0,681fr)] desktop:gap-8 desktop:overflow-hidden">
        <section className="w-full shrink-0 overflow-hidden rounded-2xl desktop:max-w-none">
          <div
            className="myf-compact-hero relative box-border flex w-full overflow-hidden rounded-2xl bg-cover bg-center text-white desktop:hidden"
            style={{
              backgroundImage: `url(${campRegistrationCompactImage})`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-black/25"
              aria-hidden
            />
            <div className="relative z-10 myf-compact-hero__outer">
              <div className="myf-compact-hero__top-row">
                <img
                  src={campFearlessLogo}
                  alt="Camp Fearless"
                  className="myf-compact-hero__logo"
                />
                <h1 className="myf-compact-hero__title-phone">
                  Camper Registration
                </h1>
                <div className="myf-compact-hero__text-col">
                  <h1 className="myf-compact-hero__title-tablet">
                    Camper Registration
                  </h1>
                  <p className="myf-compact-hero__body-tablet">
                    Select the number of campers you are registering, provide a
                    shared emergency contact, and enter individual details and
                    medical notes for each person.
                  </p>
                  <p className="myf-compact-hero__terms-tablet">
                    <span className="myf-compact-hero__terms-semibold">
                      Terms and Conditions
                    </span>
                    <span className="myf-compact-hero__terms-regular"> and </span>
                    <span className="myf-compact-hero__terms-semibold">
                      Policy statement
                    </span>
                  </p>
                </div>
              </div>
              <div className="myf-compact-hero__phone-stack">
                <p className="myf-compact-hero__body-phone">
                  Select the number of campers you are registering, provide a
                  shared emergency contact, and enter individual details and
                  medical notes for each person.
                </p>
                <p className="myf-compact-hero__terms-phone">
                  <span className="myf-compact-hero__terms-semibold">
                    Terms and Conditions
                  </span>
                  <span className="myf-compact-hero__terms-regular"> and </span>
                  <span className="myf-compact-hero__terms-semibold">
                    Policy statement
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div
            className="myf-desktop-hero relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-2xl bg-cover bg-center text-white desktop:flex desktop:h-full"
            style={{
              backgroundImage: `url(${campRegistrationImage})`,
              backgroundPosition: "50% 32%",
            }}
          >
            <div className="myf-desktop-hero__top-scrim" aria-hidden />
            <div className="myf-desktop-hero__mid-scrim" aria-hidden />

            <header className="relative z-[2] flex flex-col items-center text-center text-white myf-desktop-hero__header">
              <div className="myf-desktop-hero__content myf-desktop-hero__content-stack">
                <img
                  src={campFearlessLogo}
                  alt="Camp Fearless"
                  className="myf-desktop-hero__logo"
                />

                <div className="myf-desktop-hero__copy-stack">
                  <h1 className="myf-desktop-hero__title">
                    Camper Registration
                  </h1>

                  <p className="myf-desktop-hero__body">
                    Select the number of campers you are registering, provide a
                    shared emergency contact, and enter individual details and
                    medical notes for each person.
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1" aria-hidden />

            <footer className="relative z-[2] mx-auto flex w-full shrink-0 flex-col items-center text-center text-white myf-desktop-hero__footer">
              <div
                className="myf-desktop-hero__partners flex items-center justify-center"
                aria-hidden
              >
                {partnerIcons.map((icon) => (
                  <img
                    key={icon}
                    src={icon}
                    alt=""
                    className="myf-desktop-hero__partner-icon w-auto shrink-0 object-contain"
                  />
                ))}
              </div>

              <p className="myf-desktop-hero__footer-terms">
                <span className="myf-desktop-hero__footer-terms-semibold">
                  Terms and Conditions
                </span>
                <span className="myf-desktop-hero__footer-terms-regular">
                  {" "}
                  and{" "}
                </span>
                <span className="myf-desktop-hero__footer-terms-semibold">
                  Policy statement
                </span>
              </p>
            </footer>
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 w-full flex-col gap-4 desktop:h-full desktop:overflow-y-auto desktop:overscroll-y-contain desktop:pr-1">
          <div className="flex min-h-[86px] w-full flex-col items-start gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-4 tablet:flex-row tablet:items-center tablet:justify-between desktop:max-w-[681px]">
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
                className="flex h-9 w-9 items-center justify-center rounded-md bg-[#18181B] text-white shadow-sm transition hover:scale-[1.03] hover:bg-zinc-700 active:scale-100"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {campers.map((camper, index) => (
            <div
              key={camper.id}
              className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 desktop:max-w-[681px]"
            >
              <CamperDetailsFrame
                camper={camper}
                index={index}
                total={camperCount}
                onUpdate={(patch) => updateCamper(camper.id, patch)}
                onRemove={
                  index > 0 ? () => removeCamper(camper.id) : undefined
                }
                showFieldErrors={validationAttempted}
                fieldErrors={camperErrorsById[camper.id]}
                ageShowError={shouldShowMyaAgeError(camper)}
                fieldErrorMessages={
                  shouldShowMyaAgeError(camper)
                    ? { age: myaAgeFieldMessage(camper.age) }
                    : undefined
                }
                ageInput="text"
                ageDigitsOnly
                onAgeBlur={() => markAgeBlurred(camper.id)}
                registrationFieldId={myaRegistrationFieldId}
              />
            </div>
          ))}

          <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 desktop:max-w-[681px]">
            <div className="flex flex-col gap-4">
              <div className="flex w-full flex-col gap-1 desktop:max-w-[646.5px]">
                <h2 className="text-lg font-bold leading-7 text-[#18181B]">
                  Emergency contact
                </h2>
                <p className="text-sm font-normal leading-5 text-[#71717A]">
                  Held in case of an emergency on site
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-4 tablet:grid-cols-3 desktop:max-w-[646.5px]">
                <label
                  id={myaEmergencyFieldId("guardianFirstName")}
                  className="flex min-w-0 flex-col gap-2"
                >
                  <span className="text-sm font-medium leading-5 text-[#18181B]">
                    Contact first name
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
                  id={myaEmergencyFieldId("guardianLastName")}
                  className="flex min-w-0 flex-col gap-2"
                >
                  <span className="text-sm font-medium leading-5 text-[#18181B]">
                    Contact last name
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
                  id={myaEmergencyFieldId("guardianPhone")}
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
                id={myaEmergencyFieldId("relationship")}
                className="flex w-full flex-col gap-2 desktop:max-w-[646.5px]"
              >
                <span className="text-sm font-medium leading-5 text-[#18181B]">
                  Relationship to camper(s)
                </span>
                <div className="relative">
                  <select
                    className={cn(
                      registerFieldInputClasses(
                        showEmergencyError("relationship")
                      ),
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
                    {RELATIONSHIP_OPTIONS.map((relationship) => (
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

          <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 desktop:max-w-[681px]">
            <div className="flex flex-col gap-4">
              <div className="flex w-full flex-col gap-1 desktop:max-w-[646.5px]">
                <h2 className="text-lg font-bold leading-7 text-[#18181B]">
                  Payment
                </h2>
                <p className="text-sm font-normal leading-5 text-[#71717A]">
                  Finish your registration by sending payment via M-Pesa.
                  You&apos;ll get a confirmation code via SMS.
                </p>
              </div>

              <div className="flex w-full flex-col items-center rounded-lg bg-[#F9F9F9] p-4 desktop:max-w-[646.5px]">
                <div className="flex w-full max-w-[614.5px] flex-col items-center gap-2 text-center">
                  <p className="text-sm font-normal leading-5 text-[#71717A]">
                    Total amount due
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

              <div className="flex w-full justify-center gap-4 rounded-lg bg-[#F9F9F9] p-4 desktop:max-w-[646.5px]">
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
                id={myaEmergencyFieldId("mpesaCode")}
                className="flex w-full flex-col gap-2 desktop:max-w-[646.5px]"
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

              <button
                type="button"
                onClick={handleCompleteRegistration}
                className="flex h-9 w-full items-center justify-center rounded-[6px] bg-[#18181B] px-4 py-2 text-sm font-medium leading-5 text-[#FAFAFA] shadow-[0px_1px_2px_0px_#0000000D] transition-transform hover:scale-[1.03] hover:bg-zinc-800 active:scale-100 desktop:max-w-[646.5px]"
              >
                Complete registration
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
