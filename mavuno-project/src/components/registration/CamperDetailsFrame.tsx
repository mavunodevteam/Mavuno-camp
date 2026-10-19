import { useState } from "react"
import { ChevronDown, Trash2 } from "lucide-react"
import {
  FIELD_ERROR_MESSAGE,
  FieldError,
} from "@/components/registration/FieldError"
import {
  registerFieldInputClasses,
  registerFieldInvalidBorderClass,
  registerMedicalTextareaClasses,
} from "@/components/registration/registerFieldStyles"
import {
  countWords,
  limitToMaxWords,
  MAX_WORDS_ERROR_MESSAGE,
  MEDICAL_MAX_WORDS,
  PHONE_FORMAT_ERROR_MESSAGE,
} from "@/lib/registrationFormat"
import { myfRegistrationFieldId } from "@/lib/myfRegisterValidation"
import { cn } from "@/lib/utils"

// const MYF_AGES = [13, 14, 15, 16, 17] as const

/** Temporary until campuses load from dashboard / Supabase */
// const TEMP_MAVUNO_CAMPUS_OPTIONS = [
//   { value: "hillcity-multipliers", label: "HillCity (Multipliers Network)" },
// ] as const

const genderToggleClass =
  "inline-flex h-9 items-center justify-center rounded-[6px] border border-[#E4E4E7] bg-white px-4 py-2 text-sm font-medium leading-5 text-[#18181B] transition-transform hover:scale-[1.03] active:scale-100"

const toggleSelectedClass =
  "border-[#18181B] bg-[#18181B] text-white"

const selectChevronClass =
  "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#71717A]"

const medicalOptionTileClass =
  "flex w-full flex-col gap-4 rounded-2xl border border-[#E4E4E7] bg-[#F9FAFB] p-2 transition-transform transition-colors hover:scale-[1.01] active:scale-100"

const medicalRadioClass =
  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-[#E4E4E7] bg-white shadow-[0px_1px_2px_0px_#0000000F,0px_1px_3px_0px_#0000001A]"

export type CamperFormState = {
  id: string
  firstName: string
  lastName: string
  age: string
  phone: string
  campus: string
  otherChurch: string
  gender: "male" | "female" | null
  wantsBaptism: boolean | null
  fromMavuno: boolean
  hasMedicalCondition: boolean
  medicalConditionDetails: string
  hasSpecialNeeds: boolean
  specialNeedsDetails: string
}

export type CamperFieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "age"
    | "gender"
    | "phone"
    | "wantsBaptism"
    | "campusOrChurch"
    | "medicalConditionDetails"
    | "specialNeedsDetails",
    boolean
  >
>

export function createEmptyCamper(): CamperFormState {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    age: "",
    phone: "",
    campus: "",
    otherChurch: "",
    gender: null,
    wantsBaptism: null,
    fromMavuno: true,
    hasMedicalCondition: false,
    medicalConditionDetails: "",
    hasSpecialNeeds: false,
    specialNeedsDetails: "",
  }
}

type RegistrationFieldIdFn = (
  camperId: string,
  field: keyof CamperFieldErrors
) => string

type CamperDetailsFrameProps = {
  camper: CamperFormState
  index: number
  total: number
  onUpdate: (patch: Partial<CamperFormState>) => void
  onRemove?: () => void
  showFieldErrors?: boolean
  fieldErrors?: CamperFieldErrors
  /** Override default inline error copy (e.g. MYA age reasons). */
  fieldErrorMessages?: Partial<Record<keyof CamperFieldErrors, string>>
  /** MYF: age dropdown. MYA: typed numeric age. */
  ageInput?: "select" | "text"
  /** MYA: digits-only while typing. */
  ageDigitsOnly?: boolean
  onAgeBlur?: () => void
  /** Show age inline error before form submit (e.g. MYA blur validation). */
  ageShowError?: boolean
  registrationFieldId?: RegistrationFieldIdFn
  ageOptions?: readonly number[]
  campusOptions?: readonly { id: string; name: string }[]
}

export function CamperDetailsFrame({
  camper,
  index,
  total,
  onUpdate,
  onRemove,
  showFieldErrors = false,
  fieldErrors = {},
  fieldErrorMessages = {},
  ageInput = "select",
  ageDigitsOnly = false,
  onAgeBlur,
  ageShowError = false,
  registrationFieldId = myfRegistrationFieldId,
  ageOptions = [13, 14, 15, 16, 17],
  campusOptions = [],
}: CamperDetailsFrameProps) {
  const fieldId = registrationFieldId
  const show = (key: keyof CamperFieldErrors) =>
    showFieldErrors && Boolean(fieldErrors[key])

  const showAgeError = show("age") || ageShowError

  function handleAgeInputChange(raw: string) {
    const next = ageDigitsOnly ? raw.replace(/\D/g, "") : raw
    onUpdate({ age: next })
  }

  const [medicalOverWordLimit, setMedicalOverWordLimit] = useState(false)
  const [specialNeedsOverWordLimit, setSpecialNeedsOverWordLimit] =
    useState(false)

  function handleMedicalDetailsChange(raw: string) {
    const limited = limitToMaxWords(raw, MEDICAL_MAX_WORDS)
    if (limited !== raw) setMedicalOverWordLimit(true)
    else if (countWords(limited) < MEDICAL_MAX_WORDS) {
      setMedicalOverWordLimit(false)
    }
    onUpdate({ medicalConditionDetails: limited })
  }

  function handleSpecialNeedsDetailsChange(raw: string) {
    const limited = limitToMaxWords(raw, MEDICAL_MAX_WORDS)
    if (limited !== raw) setSpecialNeedsOverWordLimit(true)
    else if (countWords(limited) < MEDICAL_MAX_WORDS) {
      setSpecialNeedsOverWordLimit(false)
    }
    onUpdate({ specialNeedsDetails: limited })
  }

  const medicalDetailsInvalid =
    show("medicalConditionDetails") || medicalOverWordLimit
  const specialNeedsDetailsInvalid =
    show("specialNeedsDetails") || specialNeedsOverWordLimit

  const genderInvalid = show("gender")
  const baptismInvalid = show("wantsBaptism")

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-[14px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold leading-7 text-[#18181B]">
              Camper details
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-sm font-normal leading-5 text-[#F05922]">
                Camper {index + 1}/{total}
              </p>
              {onRemove ? (
                <button
                  type="button"
                  aria-label={`Remove camper ${index + 1}`}
                  onClick={onRemove}
                  className="flex size-9 items-center justify-center rounded-md border border-[#E4E4E7] bg-white transition hover:border-[#18181B] hover:scale-[1.03] active:scale-100"
                >
                  <Trash2 className="size-4 text-[#F05922]" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>
          <p className="text-sm font-normal leading-5 text-[#71717A]">
            Fill in your details as per your legal documents
          </p>
        </div>

        <div className="flex w-full flex-col gap-[14px] desktop:max-w-[645px]">
          <div className="grid w-full grid-cols-2 gap-4 tablet:grid-cols-3">
            <label
              id={fieldId(camper.id, "firstName")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                First name
              </span>
              <input
                type="text"
                className={registerFieldInputClasses(show("firstName"))}
                value={camper.firstName}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
              />
              <FieldError show={show("firstName")} />
            </label>
            <label
              id={fieldId(camper.id, "lastName")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Last name
              </span>
              <input
                type="text"
                className={registerFieldInputClasses(show("lastName"))}
                value={camper.lastName}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
              />
              <FieldError show={show("lastName")} />
            </label>
            <label
              id={fieldId(camper.id, "age")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Age
              </span>
              {ageInput === "text" ? (
                <input
                  type="text"
                  inputMode="numeric"
                  className={registerFieldInputClasses(showAgeError)}
                  value={camper.age}
                  onChange={(e) => handleAgeInputChange(e.target.value)}
                  onBlur={onAgeBlur}
                />
              ) : (
                <div className="relative">
                  <select
                    className={cn(
                      registerFieldInputClasses(show("age")),
                      "appearance-none pr-11"
                    )}
                    value={camper.age}
                    onChange={(e) => onUpdate({ age: e.target.value })}
                  >
                    <option value="" disabled />
                    {ageOptions.map((age) => (
                      <option key={age} value={String(age)}>
                        {age}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={selectChevronClass}
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
              )}
              <FieldError
                show={showAgeError}
                message={fieldErrorMessages.age}
              />
            </label>
            <div
              id={fieldId(camper.id, "gender")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Gender
              </span>
              <div className="flex h-9 min-w-0 gap-2">
                <button
                  type="button"
                  aria-pressed={camper.gender === "male"}
                  onClick={() => onUpdate({ gender: "male" })}
                  className={cn(
                    genderToggleClass,
                    "w-[65px] shrink-0",
                    camper.gender === "male" && toggleSelectedClass,
                    genderInvalid &&
                      camper.gender !== "male" &&
                      registerFieldInvalidBorderClass
                  )}
                >
                  Male
                </button>
                <button
                  type="button"
                  aria-pressed={camper.gender === "female"}
                  onClick={() => onUpdate({ gender: "female" })}
                  className={cn(
                    genderToggleClass,
                    "w-20 shrink-0",
                    camper.gender === "female" && toggleSelectedClass,
                    genderInvalid &&
                      camper.gender !== "female" &&
                      registerFieldInvalidBorderClass
                  )}
                >
                  Female
                </button>
              </div>
              <FieldError show={show("gender")} />
            </div>
            <label
              id={fieldId(camper.id, "phone")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Phone number
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={registerFieldInputClasses(show("phone"))}
                value={camper.phone}
                onChange={(e) => onUpdate({ phone: e.target.value })}
              />
              <FieldError
                show={show("phone")}
                message={
                  show("phone")
                    ? camper.phone.trim()
                      ? PHONE_FORMAT_ERROR_MESSAGE
                      : FIELD_ERROR_MESSAGE
                    : undefined
                }
              />
            </label>
            <div
              id={fieldId(camper.id, "wantsBaptism")}
              className="flex min-w-0 flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Want to be baptised?
              </span>
              <div className="flex h-9 min-w-0 gap-2">
                <button
                  type="button"
                  aria-pressed={camper.wantsBaptism === true}
                  onClick={() => onUpdate({ wantsBaptism: true })}
                  className={cn(
                    genderToggleClass,
                    "w-[55px] shrink-0",
                    camper.wantsBaptism === true && toggleSelectedClass,
                    baptismInvalid &&
                      camper.wantsBaptism !== true &&
                      registerFieldInvalidBorderClass
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  aria-pressed={camper.wantsBaptism === false}
                  onClick={() => onUpdate({ wantsBaptism: false })}
                  className={cn(
                    genderToggleClass,
                    "w-[51px] shrink-0",
                    camper.wantsBaptism === false && toggleSelectedClass,
                    baptismInvalid &&
                      camper.wantsBaptism !== false &&
                      registerFieldInvalidBorderClass
                  )}
                >
                  No
                </button>
              </div>
              <FieldError show={show("wantsBaptism")} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 desktop:max-w-[679px]">
        <div className="flex flex-col gap-1 desktop:max-w-[647px]">
          <h2 className="text-lg font-bold leading-7 text-[#18181B]">
            Church campus
          </h2>
          <p className="text-sm font-normal leading-5 text-[#71717A]">
            Drives the campus and network breakdowns
          </p>
        </div>

        <div className="flex w-full flex-row gap-[14px] desktop:max-w-[647px]">
          <div className="flex min-w-0 flex-1 flex-col gap-2 tablet:w-[205px] tablet:flex-none tablet:shrink-0">
            <span className="text-sm font-medium leading-5 text-[#18181B]">
              Are you from Mavuno?
            </span>
            <div className="flex h-9 gap-2">
              <button
                type="button"
                aria-pressed={camper.fromMavuno}
                onClick={() => onUpdate({ fromMavuno: true })}
                className={cn(
                  genderToggleClass,
                  "w-[55px] shrink-0",
                  camper.fromMavuno
                    ? toggleSelectedClass
                    : "border-[#E4E4E7] bg-white text-[#18181B]"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                aria-pressed={!camper.fromMavuno}
                onClick={() => onUpdate({ fromMavuno: false })}
                className={cn(
                  genderToggleClass,
                  "w-[51px] shrink-0",
                  !camper.fromMavuno
                    ? toggleSelectedClass
                    : "border-[#E4E4E7] bg-white text-[#18181B]"
                )}
              >
                No
              </button>
            </div>
          </div>
          <label
            id={fieldId(camper.id, "campusOrChurch")}
            className="flex min-w-0 flex-1 flex-col gap-2 tablet:w-[205px] tablet:flex-none tablet:shrink-0"
          >
            <span className="text-sm font-medium leading-5 text-[#18181B]">
              {camper.fromMavuno ? "Select campus" : "Other church"}
            </span>
            {camper.fromMavuno ? (
              <div className="relative">
                <select
                  className={cn(
                    registerFieldInputClasses(show("campusOrChurch")),
                    "appearance-none pr-11"
                  )}
                  value={camper.campus}
                  onChange={(e) => onUpdate({ campus: e.target.value })}
                >
                  <option value="" disabled />
                  {campusOptions.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={selectChevronClass}
                  strokeWidth={2}
                  aria-hidden
                />
              </div>
            ) : (
              <input
                type="text"
                className={registerFieldInputClasses(show("campusOrChurch"))}
                value={camper.otherChurch}
                onChange={(e) => onUpdate({ otherChurch: e.target.value })}
              />
            )}
            <FieldError show={show("campusOrChurch")} />
          </label>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4">
        <h2 className="text-lg font-bold leading-7 text-[#18181B]">
          Medical and special needs
        </h2>

        <div
          className={cn(
            medicalOptionTileClass,
            camper.hasMedicalCondition && "border-[#18181B]"
          )}
        >
          <button
            type="button"
            aria-pressed={camper.hasMedicalCondition}
            onClick={() => {
              const next = !camper.hasMedicalCondition
              onUpdate({
                hasMedicalCondition: next,
                ...(next ? {} : { medicalConditionDetails: "" }),
              })
              if (!next) setMedicalOverWordLimit(false)
            }}
            className="flex w-full items-start gap-6 text-left"
          >
            <span
              className={cn(
                medicalRadioClass,
                camper.hasMedicalCondition && "border-[#18181B]"
              )}
              aria-hidden
            >
              {camper.hasMedicalCondition ? (
                <span className="size-2 rounded-full bg-[#18181B]" />
              ) : null}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Medical condition / Severe allergies
              </span>
              <span className="text-sm font-normal leading-5 text-[#71717A]">
                Check if this camper has acute health conditions requiring
                medical staff awareness.
              </span>
            </span>
          </button>
          {camper.hasMedicalCondition ? (
            <label
              id={fieldId(camper.id, "medicalConditionDetails")}
              className="flex w-full flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Specify medical condition (15 words)
              </span>
              <textarea
                className={registerMedicalTextareaClasses(medicalDetailsInvalid)}
                placeholder="e.g Asthma, Peanuts allergy, Epilepsy, Diabetes"
                rows={3}
                value={camper.medicalConditionDetails}
                onChange={(e) => handleMedicalDetailsChange(e.target.value)}
              />
              <FieldError
                show={medicalDetailsInvalid}
                message={
                  medicalOverWordLimit
                    ? MAX_WORDS_ERROR_MESSAGE
                    : show("medicalConditionDetails")
                      ? FIELD_ERROR_MESSAGE
                      : undefined
                }
              />
            </label>
          ) : null}
        </div>

        <div
          className={cn(
            medicalOptionTileClass,
            camper.hasSpecialNeeds && "border-[#18181B]"
          )}
        >
          <button
            type="button"
            aria-pressed={camper.hasSpecialNeeds}
            onClick={() => {
              const next = !camper.hasSpecialNeeds
              onUpdate({
                hasSpecialNeeds: next,
                ...(next ? {} : { specialNeedsDetails: "" }),
              })
              if (!next) setSpecialNeedsOverWordLimit(false)
            }}
            className="flex w-full items-start gap-6 text-left"
          >
            <span
              className={cn(
                medicalRadioClass,
                camper.hasSpecialNeeds && "border-[#18181B]"
              )}
              aria-hidden
            >
              {camper.hasSpecialNeeds ? (
                <span className="size-2 rounded-full bg-[#18181B]" />
              ) : null}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Special needs / Accessibility support
              </span>
              <span className="text-sm font-normal leading-5 text-[#71717A]">
                Check if this camper requires physical, sensory, or mobility
                accommodations.
              </span>
            </span>
          </button>
          {camper.hasSpecialNeeds ? (
            <label
              id={fieldId(camper.id, "specialNeedsDetails")}
              className="flex w-full flex-col gap-2"
            >
              <span className="text-sm font-medium leading-5 text-[#18181B]">
                Specify special needs and accommodations (15 words)
              </span>
              <textarea
                className={registerMedicalTextareaClasses(
                  specialNeedsDetailsInvalid
                )}
                placeholder="e.g Deaf, Autism spectrum, Anxiety"
                rows={3}
                value={camper.specialNeedsDetails}
                onChange={(e) =>
                  handleSpecialNeedsDetailsChange(e.target.value)
                }
              />
              <FieldError
                show={specialNeedsDetailsInvalid}
                message={
                  specialNeedsOverWordLimit
                    ? MAX_WORDS_ERROR_MESSAGE
                    : show("specialNeedsDetails")
                      ? FIELD_ERROR_MESSAGE
                      : undefined
                }
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  )
}
