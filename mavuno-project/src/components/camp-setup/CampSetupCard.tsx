import type { ReactNode } from "react"
import { Copy, Info, Pause, Play } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { SetupCard, type FieldSpec } from "@/components/camp-setup/SetupCard"
import {
  campOverlap,
  canSwitchOff,
  datesSet,
  detailsValid,
  formatMoney,
  formatYmd,
  linkHint,
  linkStatus,
  type CampDetails,
  type CampRecord,
  type Ymd,
} from "@/lib/campSetup"

const campFields: FieldSpec<CampDetails>[] = [
  { key: "startDate", label: "Camp start", format: (v: Ymd) => formatYmd(v) },
  { key: "endDate", label: "Camp end", format: (v: Ymd) => formatYmd(v) },
  { key: "camperLimit", label: "Camper limit", format: (v: number) => v.toLocaleString("en-KE") },
  { key: "onlineFee", label: "Online registration", format: (v: number) => formatMoney(v) },
  { key: "walkInFee", label: "Walk-in (desk) registration", format: (v: number) => formatMoney(v) },
  { key: "opens", label: "Registration opens", format: (v: Ymd) => formatYmd(v) },
  { key: "closes", label: "Registration closes", format: (v: Ymd) => formatYmd(v) },
]

/* The grey box that shows a saved value when the card is not being edited */
function ValueBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 min-w-0 items-center rounded-md border bg-muted/20 px-3 text-sm font-normal tabular-nums">
      <span className="truncate">{children}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function DateField({ label, value, editing, onChange, min }: { label: string; value: Ymd; editing: boolean; onChange: (v: Ymd) => void; min?: string }) {
  return (
    <Field label={label}>
      {editing ? (
        <Input type="date" min={min} className="bg-muted/40" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)} />
      ) : (
        <ValueBox>{formatYmd(value)}</ValueBox>
      )}
    </Field>
  )
}

function NumberField({ label, value, editing, money, onChange }: { label: string; value: number; editing: boolean; money?: boolean; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      {editing ? (
        <div className="relative">
          {money && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>}
          <Input
            inputMode="numeric"
            className={`bg-muted/40 tabular-nums ${money ? "pl-12" : ""}`}
            value={value.toLocaleString("en-KE")}
            onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "").slice(0, 9)) || 0)}
          />
        </div>
      ) : (
        <ValueBox>{money ? formatMoney(value) : value.toLocaleString("en-KE")}</ValueBox>
      )}
    </Field>
  )
}

function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={label} className="size-5 text-muted-foreground" />}>
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">{children}</PopoverContent>
    </Popover>
  )
}

export function CampSetupCard({
  camp,
  other,
  editionOpen,
  canEdit,
  siteUrl,
  onSave,
  onToggleRuns,
  onTogglePause,
}: {
  camp: CampRecord
  other: CampRecord | undefined
  editionOpen: boolean
  canEdit: boolean
  siteUrl: string
  onSave: (details: CampDetails) => Promise<void>
  onToggleRuns: (next: boolean) => void
  onTogglePause: () => void
}) {
  const name = camp.category.toUpperCase()
  const status = linkStatus(camp, editionOpen)
  const link = `${siteUrl.replace(/^https?:\/\//, "")}/register/${camp.category}`

  const overlapMessage = (d: CampDetails): string | null => {
    if (!other || !other.runs || !camp.runs) return null
    const overlap = campOverlap(d, other.details)
    return overlap
      ? `MYF and MYA overlap from ${formatYmd(overlap.start)} to ${formatYmd(overlap.end)}. Camps should not run at the same time.`
      : null
  }

  function handleRunsChange(next: boolean) {
    if (!next) {
      const check = canSwitchOff(camp.spotsUsed, other?.runs ?? false)
      if (!check.ok) {
        toast.error(`Can't switch off ${name}. ${check.reason}`)
        return
      }
    }
    onToggleRuns(next)
  }

  return (
    <SetupCard<CampDetails>
      title={`${name} setup`}
      description={camp.category === "myf" ? "Mavuno Young and Fearless, ages 14 to 17" : "Mavuno Young Adults, age 18 and above"}
      saved={camp.details}
      fields={campFields}
      saveLabel={`Save ${name} setup`}
      successMessage={`${name} setup successfully saved`}
      canEdit={canEdit}
      lastSaved={camp.lastSavedAt ? { by: camp.lastSavedBy ?? "System", at: camp.lastSavedAt } : null}
      onDirtyChange={() => {}}
      onSave={onSave}
      validate={(d) => detailsValid(d, camp.spotsUsed)}
      warnings={(draft, saved) => [
        ...(draft.onlineFee !== saved.onlineFee || draft.walkInFee !== saved.walkInFee
          ? [`New fees apply to new registrations only. The ${camp.spotsUsed.toLocaleString("en-KE")} campers already registered keep what they paid.`]
          : []),
        ...(draft.closes && saved.closes && draft.closes < saved.closes
          ? [`Registration will now close on ${formatYmd(draft.closes)}. Campers can't sign up after that date.`]
          : []),
        ...(draft.closes && draft.startDate && draft.closes > draft.startDate ? ["Registration closes after the camp starts."] : []),
        ...(overlapMessage(draft) ? [overlapMessage(draft) as string] : []),
      ]}
      headerExtra={
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Switch checked={camp.runs} disabled={!canEdit} aria-label={`${name} runs in this edition`} onCheckedChange={handleRunsChange} />
            <span className="text-sm font-medium">Runs in this edition</span>
          </div>
          {!camp.runs && <p className="text-sm text-muted-foreground">Hidden from the welcome page, registration and the dashboard.</p>}
        </div>
      }
    >
      {(details, editing, update) => {
        const spotsLeft = Math.max(details.camperLimit - camp.spotsUsed, 0)
        const usedPercent = details.camperLimit ? Math.min((camp.spotsUsed / details.camperLimit) * 100, 100) : 100
        const overlap = overlapMessage(details)
        return (
          <div className="flex flex-col gap-4">
            <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              <section className="flex min-w-0 flex-col gap-4">
                <h3 className="-mb-2 text-sm text-muted-foreground">Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DateField
                    label="Camp start"
                    value={details.startDate}
                    editing={editing}
                    onChange={(startDate) =>
                      update({ startDate, endDate: details.endDate && startDate && details.endDate < startDate ? startDate : details.endDate })
                    }
                  />
                  <DateField label="Camp end" value={details.endDate} editing={editing} min={details.startDate ?? undefined} onChange={(endDate) => update({ endDate })} />
                </div>
                {overlap && <p className="text-sm text-destructive">{overlap}</p>}
                <div className="flex flex-col gap-2">
                  <NumberField label="Camper limit" value={details.camperLimit} editing={editing} onChange={(camperLimit) => update({ camperLimit })} />
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Camper spots used" aria-valuenow={Math.round(usedPercent)}>
                    <div className="h-full bg-emerald-500" style={{ width: `${usedPercent}%` }} />
                  </div>
                  {editing && details.camperLimit < camp.spotsUsed && (
                    <p className="text-sm text-destructive">The limit can&apos;t be below the {camp.spotsUsed.toLocaleString("en-KE")} spots already used.</p>
                  )}
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>
                      <span className="tabular-nums">
                        {camp.spotsUsed.toLocaleString("en-KE")} of {details.camperLimit.toLocaleString("en-KE")}
                      </span>{" "}
                      camper spots used. <span className="tabular-nums">{spotsLeft.toLocaleString("en-KE")}</span> left.
                    </span>
                    <InfoTip label="How camper spots are counted">Facilitators and waived campers are counted. Cancelled registrations free up a spot.</InfoTip>
                  </p>
                </div>
              </section>

              <section className="flex min-w-0 flex-col gap-4">
                <h3 className="-mb-2 text-sm text-muted-foreground">Fees, full payment only</h3>
                <NumberField label="Online registration" money value={details.onlineFee} editing={editing} onChange={(onlineFee) => update({ onlineFee })} />
                <NumberField label="Walk-in (desk) registration" money value={details.walkInFee} editing={editing} onChange={(walkInFee) => update({ walkInFee })} />
              </section>

              <section className="flex min-w-0 flex-col gap-4 md:col-span-2 xl:col-span-1">
                <h3 className="-mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                  Registration link
                  <InfoTip label="What the registration link does">
                    Sends campers straight to {name} registration. The address never changes, so a link you shared earlier keeps working in every edition.
                  </InfoTip>
                </h3>
                <Field label="Registration link">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <ValueBox>
                        <span className="text-muted-foreground">{link}</span>
                      </ValueBox>
                    </div>
                    <Badge variant={status.variant} className="whitespace-nowrap">
                      {status.label}
                    </Badge>
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <DateField label="Opens" value={details.opens} editing={editing} onChange={(opens) => update({ opens, closes: details.closes && opens && details.closes < opens ? opens : details.closes })} />
                  <DateField label="Closes" value={details.closes} editing={editing} min={details.opens ?? undefined} onChange={(closes) => update({ closes })} />
                </div>
                {editing && details.closes && details.startDate && details.closes > details.startDate && (
                  <p className="text-sm text-destructive">Registration closes after the camp starts.</p>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(`https://${link}`)
                          .then(() => toast.success("Registration link successfully copied"))
                          .catch(() => toast.error("Failed to copy link. Please try again."))
                      }}
                    >
                      <Copy className="size-4" />
                      Copy link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canEdit || status.label === "Inactive" || status.label === "Dates needed" || status.label === "Closed"}
                      onClick={onTogglePause}
                    >
                      {camp.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                      {camp.paused ? "Resume link" : "Pause link"}
                    </Button>
                  </div>
                  <p className="text-right text-sm text-muted-foreground">{linkHint(camp, status.label)}</p>
                </div>
              </section>
            </div>

           
            {!datesSet(details) && !editing && <p className="text-sm text-muted-foreground">Set the camp dates and the registration window to open registration.</p>}
          </div>
        )
      }}
    </SetupCard>
  )
}