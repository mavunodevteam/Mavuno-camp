import { useCallback, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { CampSetupCard } from "@/components/camp-setup/CampSetupCard"
import { EditionsCard, yearFromName, type EditionRow } from "@/components/camp-setup/EditionsCard"
import { SetupCard, type FieldSpec } from "@/components/camp-setup/SetupCard"
import { WelcomePageCard, defaultWelcome, type WelcomeSettings } from "@/components/camp-setup/WelcomePageCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  closeEdition,
  createEdition,
  loadCampSetup,
  renameEdition,
  reopenEdition,
  saveCampDetails,
  saveFacilitatorFee,
  saveWelcomeContent,
  setCampPaused,
  setCampRuns,
  type EditionDb,
} from "@/lib/api/campSetup"
import { formatMoney, toCampRecord, type CampDetails, type CampRecord, type CampRow } from "@/lib/campSetup"
import { ageLabel, formatCampRange } from "@/lib/welcome"

/* The address campers use. Set VITE_PUBLIC_SITE_URL to the deployed link, for example https://campfearless.example.com */
const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? window.location.origin

function ymdToDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const sharedFields: FieldSpec<{ facilitatorFee: number }>[] = [
  { key: "facilitatorFee", label: "Facilitator registration", format: (v: number) => formatMoney(v) },
]

export default function CampSetupPage() {
  const [tab, setTab] = useState("editions")
  const [editions, setEditions] = useState<EditionDb[]>([])
  const [campRows, setCampRows] = useState<CampRow[]>([])
  const [spots, setSpots] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    try {
      const data = await loadCampSetup()
      setEditions(data.editions)
      setCampRows(data.camps)
      setSpots(data.spots)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load camp setup")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  /* Everything on the Camp settings tab belongs to the open edition. If none is open, the latest one is shown read only. */
  const openEdition = editions.find((e) => e.is_open)
  const shownEdition = openEdition ?? editions[0]
  const closed = !openEdition
  const camps: CampRecord[] = campRows
    .filter((c) => c.edition_id === shownEdition?.id)
    .map((c) => toCampRecord(c, spots[c.id] ?? 0))
    .sort((a, b) => a.category.localeCompare(b.category) * -1)
  const welcomeRows = campRows.filter((c) => c.edition_id === shownEdition?.id)

  /* The preview needs each camp's name, ages and dates, which come from its setup */
  const summaryFor = (category: "myf" | "mya") => {
    const row = welcomeRows.find((r) => r.category === category)
    return {
      name: row?.name ?? category.toUpperCase(),
      age: row ? ageLabel(row.min_age, row.max_age) : "",
      dates: row ? formatCampRange(row.start_date, row.end_date) : "Dates to be announced",
    }
  }
  const campSummaries = { myf: summaryFor("myf"), mya: summaryFor("mya") }

  const editionRows: EditionRow[] = editions.map((e) => {
    const own = campRows.filter((c) => c.edition_id === e.id)
    const starts = own.map((c) => c.start_date).filter((v): v is string => !!v).sort()
    const ends = own.map((c) => c.end_date).filter((v): v is string => !!v).sort()
    return {
      id: e.id,
      name: e.name,
      year: yearFromName(e.name),
      open: e.is_open,
      startDate: ymdToDate(starts[0]),
      endDate: ymdToDate(ends[ends.length - 1]),
    }
  })

  /* The welcome page card edits both camps at once, so it works from a combined set of values */
  const welcome: WelcomeSettings = (() => {
    const base = defaultWelcome()
    for (const row of welcomeRows) {
      const p = row.category
      base[`${p}Description`] = row.welcome_description ?? ""
      base[`${p}Image`] = row.welcome_image_url ?? ""
      base[`${p}Bring`] = row.welcome_bring ?? ""
      base[`${p}Expect`] = row.welcome_expect ?? ""
      base[`${p}Know`] = row.welcome_know ?? ""
    }
    return base
  })()

  const welcomeStamp = welcomeRows
    .filter((r) => r.welcome_updated_at)
    .sort((a, b) => (b.welcome_updated_at as string).localeCompare(a.welcome_updated_at as string))[0]

  /* Run a change, then refresh from the database. The cards show their own success and error messages. */
  async function reload(work: () => Promise<void>) {
    await work()
    await loadAll()
  }

  /* For switches and buttons that have no card around them, so they report for themselves */
  async function fire(work: () => Promise<void>, success: string) {
    try {
      await reload(work)
      toast.success(success)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading camp setup...</div>

  const anyDatesMissing = camps.some((c) => !c.details.startDate || !c.details.endDate || !c.details.opens || !c.details.closes)

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="editions">Editions</TabsTrigger>
          <TabsTrigger value="settings">Camp settings</TabsTrigger>
        </TabsList>

        <TabsContent value="editions" className="mt-4">
          <EditionsCard
            editions={editionRows}
            canEdit
            onCreate={async (name) => {
              await reload(() => createEdition(name))
              setTab("settings")
            }}
            onRename={(id, name) => reload(() => renameEdition(id, name))}
            onClose={(id) => reload(() => closeEdition(id))}
            onReopen={(id) => reload(() => reopenEdition(id))}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4 flex flex-col gap-6">
          {closed ? (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <strong>No open edition.</strong> These settings are read only. Go to the Editions tab and create or reopen an edition to set up the next camp.
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Everything below applies to <strong className="text-foreground">{openEdition?.name}</strong>, the open edition.
            </p>
          )}

          {!closed && anyDatesMissing && (
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Set the dates to begin.</strong> Each camp needs its camp dates and registration window before campers can sign up.
            </p>
          )}

          <WelcomePageCard
            saved={welcome}
            camps={campSummaries}
            siteUrl={SITE_URL}
            lastSaved={
              welcomeStamp?.welcome_updated_at
                ? { by: welcomeStamp.welcome_updated_by_name ?? "System", at: new Date(welcomeStamp.welcome_updated_at) }
                : null
            }
            canEdit={!closed}
            onDirtyChange={() => {}}
            onSave={(settings) =>
              reload(async () => {
                await saveWelcomeContent(
                  welcomeRows.map((r) => ({ id: r.id, category: r.category })),
                  settings
                )
              })
            }
          />

          {camps.map((camp) => (
            <CampSetupCard
              key={camp.id}
              camp={camp}
              other={camps.find((c) => c.id !== camp.id)}
              editionOpen={!closed}
              canEdit={!closed}
              siteUrl={SITE_URL}
              onSave={(details: CampDetails) => reload(() => saveCampDetails(camp.id, details))}
              onToggleRuns={(next) =>
                void fire(() => setCampRuns(camp.id, next), next ? `${camp.category.toUpperCase()} switched on` : `${camp.category.toUpperCase()} switched off`)
              }
              onTogglePause={() =>
                void fire(() => setCampPaused(camp.id, !camp.paused), camp.paused ? "Registration resumed" : "Registration paused")
              }
            />
          ))}

          {shownEdition && (
            <SetupCard<{ facilitatorFee: number }>
              title="Shared settings"
              description="Fees that apply to both MYF and MYA."
              saved={{ facilitatorFee: shownEdition.facilitator_fee ?? 0 }}
              fields={sharedFields}
              saveLabel="Save shared settings"
              successMessage="Shared settings successfully saved"
              canEdit={!closed}
              onDirtyChange={() => {}}
              lastSaved={
                shownEdition.facilitator_fee_updated_at
                  ? { by: shownEdition.facilitator_fee_updated_by_name ?? "System", at: new Date(shownEdition.facilitator_fee_updated_at) }
                  : null
              }
              onSave={(value) => reload(() => saveFacilitatorFee(shownEdition.id, value.facilitatorFee))}
              validate={(v) => v.facilitatorFee >= 0}
              warnings={() => ["This fee applies to both MYF and MYA. Facilitators already registered keep what they paid."]}
            >
              {(settings, editing, update) => (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                    <section className="flex min-w-0 flex-col gap-4">
                      <h3 className="-mb-2 text-sm text-muted-foreground">Fees, full payment only</h3>
                      <div className="flex flex-col gap-2">
                        <Label>Facilitator registration</Label>
                        {editing ? (
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>
                            <Input
                              inputMode="numeric"
                              className="bg-muted/40 pl-12 tabular-nums"
                              value={settings.facilitatorFee.toLocaleString("en-KE")}
                              onChange={(e) => update({ facilitatorFee: Number(e.target.value.replace(/\D/g, "").slice(0, 9)) || 0 })}
                            />
                          </div>
                        ) : (
                          <div className="flex h-9 items-center rounded-md border bg-muted/20 px-3 text-sm tabular-nums">
                            {shownEdition.facilitator_fee === null ? "Not set" : formatMoney(shownEdition.facilitator_fee)}
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </SetupCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}