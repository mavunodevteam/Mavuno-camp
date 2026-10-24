import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FormSelect } from "@/components/FormSelect"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { fetchSpots, type Spots } from "@/lib/api/capacity"
import { fetchCamps, fetchCampuses } from "@/lib/api/lookups"
import { submitRegistration, type PersonInput, type Relationship } from "@/lib/api/registration"
import { fetchEditions } from "@/lib/api/reports"
import type { Camp } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { emptyCamper, validateWalkIn, type WalkInCamper } from "@/lib/walkInValidation"

type Category = "myf" | "mya"

const RELATIONSHIPS: Relationship[] = ["Parent", "Legal Guardian", "Sibling", "Relative", "Other"]
const MAX_CAMPERS = 10
const DETAILS_MAX = 40

/* "MYF (14 - 17)" and "MYA (18+)", taken from the camp's own age limits */
function tabLabel(camp: Camp | undefined, category: Category): string {
  const name = category.toUpperCase()
  if (!camp) return name
  return camp.max_age !== null ? `${name} (${camp.min_age} - ${camp.max_age})` : `${name} (${camp.min_age}+)`
}

function ToggleChoice<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {options.map((o) => (
          <Button
            key={String(o.value)}
            type="button"
            variant={value === o.value ? "default" : "outline"}
            className="h-9 px-4"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

/* A tick box card that opens a short details box when it is ticked */
function OptionCard({
  title,
  helper,
  detailsLabel,
  details,
  checked,
  onToggle,
  onDetails,
}: {
  title: string
  helper: string
  detailsLabel: string
  details: string
  checked: boolean
  onToggle: () => void
  onDetails: (value: string) => void
}) {
  return (
    <div className={cn("rounded-xl border p-4", checked ? "border-zinc-900 bg-background" : "bg-muted/20")}>
      <button type="button" aria-pressed={checked} onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        <Checkbox checked={checked} className="pointer-events-none mt-0.5" tabIndex={-1} aria-hidden />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{helper}</span>
        </span>
      </button>
      {checked && (
        <div className="mt-3 space-y-2 pl-7">
          <Label className="text-sm">{detailsLabel}</Label>
          <Textarea
            placeholder="Add brief details..."
            value={details}
            onChange={(e) => onDetails(e.target.value.slice(0, DETAILS_MAX))}
            maxLength={DETAILS_MAX}
            className="resize-none bg-background"
          />
          <p className="text-xs text-muted-foreground">
            {details.length} / {DETAILS_MAX} characters
          </p>
        </div>
      )}
    </div>
  )
}

export default function WalkInRegistrationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category>(searchParams.get("camp") === "mya" ? "mya" : "myf")

  const [camps, setCamps] = useState<Camp[]>([])
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])
  const [editionName, setEditionName] = useState<string | null>(null)
  const [spots, setSpots] = useState<Spots | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [campers, setCampers] = useState<WalkInCamper[]>(() => [emptyCamper()])
  const [guardianFirst, setGuardianFirst] = useState("")
  const [guardianLast, setGuardianLast] = useState("")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [relationship, setRelationship] = useState("")
  const [mpesaCode, setMpesaCode] = useState("")

  useEffect(() => {
    Promise.all([fetchCamps(), fetchCampuses(), fetchEditions()])
      .then(([campList, campusList, editionList]) => {
        setCamps(campList)
        setCampuses(campusList)
        setEditionName(editionList.find((e) => e.is_open)?.name ?? null)
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const camp = camps.find((c) => c.category === category)
  const campId = camp?.id

  useEffect(() => {
    if (!campId) return
    fetchSpots(campId)
      .then(setSpots)
      .catch(() => setSpots(null))
  }, [campId])

  function selectCategory(next: Category) {
    setCategory(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set("camp", next)
        return params
      },
      { replace: true }
    )
    /* The age limits change with the camp, so any age already chosen is cleared */
    setCampers((prev) => prev.map((c) => ({ ...c, age: "" })))
  }

  const updateCamper = (id: string, patch: Partial<WalkInCamper>) =>
    setCampers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const addCamper = () => setCampers((prev) => (prev.length >= MAX_CAMPERS ? prev : [...prev, emptyCamper()]))
  const removeCamper = (id: string) => setCampers((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)))
  const removeLast = () => setCampers((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)))

  const contactWord = category === "myf" ? "Guardian" : "Contact"
  const ageRange = { min: camp?.min_age ?? 0, max: camp?.max_age ?? null }
  const ageChoices =
    camp && camp.max_age !== null
      ? Array.from({ length: camp.max_age - camp.min_age + 1 }, (_, i) => String(camp.min_age + i))
      : null

  const problems = validateWalkIn(
    campers,
    { firstName: guardianFirst, lastName: guardianLast, phone: guardianPhone, relationship },
    mpesaCode,
    ageRange,
    contactWord
  )

  const count = campers.length
  const total = count * (camp?.fee_walk_in ?? 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!camp || problems.length > 0 || submitting) return
    setSubmitting(true)
    try {
      await submitRegistration({
        participant_type: "camper",
        camp_id: camp.id,
        contact_first_name: guardianFirst,
        contact_last_name: guardianLast,
        contact_phone: guardianPhone,
        relationship: relationship as Relationship,
        mpesa_receipt: mpesaCode,
        waiver_requested: false,
        campers: campers.map((c): PersonInput => {
          if (c.gender === null) throw new Error("Please choose a gender for every camper.")
          return {
            first_name: c.firstName,
            last_name: c.lastName,
            age: Number(c.age),
            gender: c.gender,
            phone: c.phone,
            wants_baptism: c.baptised === true,
            from_mavuno: c.fromMavuno,
            campus_id: c.fromMavuno ? c.campusId : null,
            church_name: c.fromMavuno ? null : c.churchName,
            has_medical_condition: c.hasMedical,
            medical_details: c.hasMedical ? c.medicalDetails : null,
            has_special_needs: c.hasSpecialNeeds,
            special_needs_details: c.hasSpecialNeeds ? c.specialNeedsDetails : null,
          }
        }),
      })
      toast.success(count === 1 ? "Walk-in registered and checked in" : `${count} walk-ins registered and checked in`)
      navigate("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!camp) {
    return <div className="p-8 text-center text-muted-foreground">We could not find the {category.toUpperCase()} camp.</div>
  }

  const spotsLeft = spots && spots.limit !== null ? Math.max(spots.limit - spots.used, 0) : 0

  return (
    <div className="flex w-full flex-col gap-4">
      {editionName && (
        <p className="text-sm text-muted-foreground">
          Edition: <strong className="text-foreground">{editionName}</strong>
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={(v) => selectCategory(String(v) as Category)} className="w-fit">
          <TabsList>
            <TabsTrigger value="myf">{tabLabel(camps.find((c) => c.category === "myf"), "myf")}</TabsTrigger>
            <TabsTrigger value="mya">{tabLabel(camps.find((c) => c.category === "mya"), "mya")}</TabsTrigger>
          </TabsList>
        </Tabs>
        {spots && spots.limit !== null && (
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">{spots.used.toLocaleString()} of {spots.limit.toLocaleString()}</span> camper
            spots used. <span className="tabular-nums">{spotsLeft.toLocaleString()}</span> left.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <form id="walk-in-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card className="shadow-none">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Select number of campers</p>
                <p className="text-sm text-muted-foreground">How many attendees are you registering in this batch?</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="icon" variant="secondary" aria-label="Remove one camper" disabled={count <= 1} onClick={removeLast}>
                  <Minus className="size-4" />
                </Button>
                <span className="flex h-9 min-w-10 items-center justify-center rounded-md border px-2 text-sm tabular-nums">{count}</span>
                <Button type="button" size="icon" aria-label="Add one camper" disabled={count >= MAX_CAMPERS} onClick={addCamper}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {campers.map((c, index) => (
            <Card key={c.id} className="shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <CardTitle className="text-base">Camper details</CardTitle>
                    <CardDescription>
                      Fill in the details as on their legal documents. Only medical and special needs are optional.
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="whitespace-nowrap text-sm text-orange-500">
                      Camper {index + 1}/{count}
                    </span>
                    {index > 0 && (
                      <Button type="button" variant="outline" size="icon" aria-label={`Remove camper ${index + 1}`} onClick={() => removeCamper(c.id)}>
                        <Trash2 className="size-4 text-orange-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input value={c.firstName} onChange={(e) => updateCamper(c.id, { firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input value={c.lastName} onChange={(e) => updateCamper(c.id, { lastName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    {ageChoices ? (
                      <FormSelect
                        label="Age"
                        placeholder="Choose age"
                        value={c.age}
                        onChange={(v) => updateCamper(c.id, { age: v })}
                        options={ageChoices.map((a) => ({ value: a, label: a }))}
                      />
                    ) : (
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={camp.min_age}
                        value={c.age}
                        onChange={(e) => updateCamper(c.id, { age: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ToggleChoice
                    label="Gender"
                    value={c.gender}
                    onChange={(v) => updateCamper(c.id, { gender: v })}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                  />
                  <div className="space-y-2">
                    <Label>Phone number</Label>
                    <Input type="tel" value={c.phone} onChange={(e) => updateCamper(c.id, { phone: e.target.value })} />
                  </div>
                  <ToggleChoice
                    label="Want to be baptised?"
                    value={c.baptised}
                    onChange={(v) => updateCamper(c.id, { baptised: v })}
                    options={[
                      { value: true, label: "Yes" },
                      { value: false, label: "No" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold">Church campus</h3>
                    <p className="text-sm text-muted-foreground">Drives the campus and network breakdowns</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <ToggleChoice
                      label="Are you from Mavuno?"
                      value={c.fromMavuno}
                      onChange={(v) => updateCamper(c.id, { fromMavuno: v, campusId: "", churchName: "" })}
                      options={[
                        { value: true, label: "Yes" },
                        { value: false, label: "No" },
                      ]}
                    />
                    {c.fromMavuno ? (
                      <div className="space-y-2">
                        <Label>Select campus</Label>
                        <FormSelect
                          label="Campus"
                          placeholder=""
                          value={c.campusId}
                          onChange={(v) => updateCamper(c.id, { campusId: v })}
                          options={campuses.map((campus) => ({ value: campus.id, label: campus.name }))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Other church</Label>
                        <Input value={c.churchName} onChange={(e) => updateCamper(c.id, { churchName: e.target.value })} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold">Medical and special needs</h3>
                    <p className="text-sm text-muted-foreground">
                      Only add brief information on what affects the camper during camp.
                    </p>
                  </div>
                  <OptionCard
                    title="Medical condition / Severe allergies"
                    helper="Check if this camper has acute health conditions requiring medical staff awareness."
                    detailsLabel="Specify medical condition"
                    details={c.medicalDetails}
                    checked={c.hasMedical}
                    onToggle={() => updateCamper(c.id, { hasMedical: !c.hasMedical, medicalDetails: "" })}
                    onDetails={(v) => updateCamper(c.id, { medicalDetails: v })}
                  />
                  <OptionCard
                    title="Special needs / Accessibility support"
                    helper="Check if this camper requires physical, sensory, or mobility accommodations."
                    detailsLabel="Specify special needs"
                    details={c.specialNeedsDetails}
                    checked={c.hasSpecialNeeds}
                    onToggle={() => updateCamper(c.id, { hasSpecialNeeds: !c.hasSpecialNeeds, specialNeedsDetails: "" })}
                    onDetails={(v) => updateCamper(c.id, { specialNeedsDetails: v })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Emergency contact</CardTitle>
              <CardDescription>Held in case of an emergency on site</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{contactWord} first name</Label>
                  <Input value={guardianFirst} onChange={(e) => setGuardianFirst(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{contactWord} last name</Label>
                  <Input value={guardianLast} onChange={(e) => setGuardianLast(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone number</Label>
                  <Input type="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Relationship to camper</Label>
                <FormSelect
                  label="Relationship"
                  placeholder=""
                  value={relationship}
                  onChange={setRelationship}
                  options={RELATIONSHIPS.map((r) => ({ value: r, label: r }))}
                />
              </div>
            </CardContent>
          </Card>
        </form>

        <Card className="shadow-none lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
            <CardDescription>
              Finish your registration by sending payment via M-Pesa. You&apos;ll get a confirmation code via SMS.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted/40 px-4 py-4 text-center">
              <div className="text-sm text-muted-foreground">Desk fee payment: Total amount due</div>
              <div className="py-1 text-2xl font-bold tabular-nums text-orange-500">KES {total.toLocaleString("en-KE")}</div>
              <div className="text-sm text-muted-foreground">
                for {count} participant{count === 1 ? "" : "s"}
              </div>
            </div>
            <div className="grid grid-cols-2 rounded-lg bg-muted/40 px-4 py-3 text-center text-sm">
              <div>
                <div className="font-medium">Paybill number</div>
                <div className="font-semibold tabular-nums text-orange-500">400200</div>
              </div>
              <div>
                <div className="font-medium">Account name</div>
                <div className="font-semibold text-orange-500">CAMPFEARLESS</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>M-Pesa confirmation code</Label>
              <Input
                placeholder="e.g UINKH7FJWL"
                maxLength={10}
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button type="submit" form="walk-in-form" className="w-full" disabled={problems.length > 0 || submitting}>
              {submitting ? "Registering..." : "Complete & auto check-in"}
            </Button>
            {problems.length > 0 && <p className="text-center text-xs text-muted-foreground">To continue: {problems[0]}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}