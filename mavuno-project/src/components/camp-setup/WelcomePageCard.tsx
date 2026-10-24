import { useRef, useState } from "react"
import { Copy, ExternalLink, Eye, Info } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { RequirementsLists } from "@/components/welcome/RequirementsLists"
import { BUTTON_CLASS, WelcomeCampCard } from "@/components/welcome/WelcomeCampCard"
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, splitLines, type CampCategory } from "@/lib/welcome"
import { SetupCard, type FieldSpec, type LastSaved } from "./SetupCard"

const maxChars = 160
const maxImageBytes = 5 * 1024 * 1024
const imageTypes = ["image/jpeg", "image/png", "image/webp"]

export type WelcomeSettings = {
  myfDescription: string
  myfImage: string
  myfBring: string
  myfExpect: string
  myfKnow: string
  myaDescription: string
  myaImage: string
  myaBring: string
  myaExpect: string
  myaKnow: string
}

/* What the preview shows around the saved words: each camp's name, ages and dates, from its setup */
export type CampSummary = { name: string; age: string; dates: string }

export function defaultWelcome(): WelcomeSettings {
  return {
    myfDescription: DEFAULT_DESCRIPTION.myf,
    myfImage: "",
    myfBring: "",
    myfExpect: "",
    myfKnow: "",
    myaDescription: DEFAULT_DESCRIPTION.mya,
    myaImage: "",
    myaBring: "",
    myaExpect: "",
    myaKnow: "",
  }
}

const list = (v: unknown) => splitLines(String(v ?? "")).join(" · ") || "-"
/* A saved picture and a freshly chosen one read differently, so changing only the picture counts as a change */
const picture = (v: unknown) => (!v ? "Default picture" : String(v).startsWith("blob:") ? "New picture" : "Current picture")

const fields: FieldSpec<WelcomeSettings>[] = [
  { key: "myfImage", label: "MYF picture", format: picture },
  { key: "myfDescription", label: "MYF description", format: (v) => v || "-" },
  { key: "myfBring", label: "MYF what to bring", format: list },
  { key: "myfExpect", label: "MYF what to expect", format: list },
  { key: "myfKnow", label: "MYF good to know", format: list },
  { key: "myaImage", label: "MYA picture", format: picture },
  { key: "myaDescription", label: "MYA description", format: (v) => v || "-" },
  { key: "myaBring", label: "MYA what to bring", format: list },
  { key: "myaExpect", label: "MYA what to expect", format: list },
  { key: "myaKnow", label: "MYA good to know", format: list },
]

function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={label} className="size-5 text-muted-foreground" />}>
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">{children}</PopoverContent>
    </Popover>
  )
}

export function WelcomePageCard({
  saved,
  camps,
  siteUrl,
  lastSaved,
  canEdit,
  onDirtyChange,
  onSave,
}: {
  saved: WelcomeSettings
  camps: Record<CampCategory, CampSummary>
  siteUrl: string
  lastSaved?: LastSaved | null
  canEdit: boolean
  onDirtyChange: (dirty: boolean) => void
  onSave: (settings: WelcomeSettings) => Promise<void> | void
}) {
  const [previewing, setPreviewing] = useState<WelcomeSettings | null>(null)
  const [tab, setTab] = useState<"MYF" | "MYA">("MYF")
  const imageInputRef = useRef<HTMLInputElement>(null)
  const shownSite = siteUrl.replace(/^https?:\/\//, "")

  return (
    <>
      <SetupCard<WelcomeSettings>
        title="Welcome page"
        description={
          <>
            What campers see when they choose a camp.
            <InfoTip label="Where the other details come from">Camp names, dates, fees and registration links come from each camp&apos;s setup.</InfoTip>
          </>
        }
        headerExtra={
          <div className="mt-1 flex items-center gap-2 text-sm">
            <a href={siteUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              {shownSite}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Copy the welcome page link"
              className="size-6"
              onClick={() => {
                navigator.clipboard
                  .writeText(siteUrl)
                  .then(() => toast.success("Welcome page link successfully copied"))
                  .catch(() => toast.error("Failed to copy link. Please try again."))
              }}
            >
              <Copy className="size-3.5" />
            </Button>
            <a href={siteUrl} target="_blank" rel="noreferrer" aria-label="Open the welcome page" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        }
        saved={saved}
        fields={fields}
        saveLabel="Save welcome page"
        successMessage="Welcome page successfully saved"
        canEdit={canEdit}
        lastSaved={lastSaved}
        onDirtyChange={onDirtyChange}
        onSave={onSave}
        validate={(v) => v.myfDescription.trim() !== "" && v.myaDescription.trim() !== ""}
        warnings={() => ["Campers see these changes on the welcome page as soon as you save."]}
        headerAction={(value) => (
          <Button type="button" variant="outline" onClick={() => setPreviewing(value)}>
            <Eye className="size-4" />
            Preview
          </Button>
        )}
      >
        {(settings, editing, update) => (
          <Tabs value={tab} onValueChange={(v) => setTab(String(v) as "MYF" | "MYA")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="MYF">MYF (14 - 17)</TabsTrigger>
              <TabsTrigger value="MYA">MYA (18+)</TabsTrigger>
            </TabsList>

            {(["MYF", "MYA"] as const).map((camp) => {
              const k = camp.toLowerCase() as CampCategory
              const descriptionKey = `${k}Description` as const
              const imageKey = `${k}Image` as const
              const requirementKeys = [
                { label: "What to bring", key: `${k}Bring` as const },
                { label: "What to expect", key: `${k}Expect` as const },
                { label: "Good to know", key: `${k}Know` as const },
              ]
              const description = settings[descriptionKey]
              const image = settings[imageKey]
              return (
                <TabsContent key={camp} value={camp} className="mt-4 grid gap-x-8 gap-y-6 md:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm text-muted-foreground">Card</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Label>Camp image</Label>
                        <InfoTip label="About the camp image">A JPG, PNG or WebP picture, up to 5 MB. It shows at the top of the camp card.</InfoTip>
                      </div>
                      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
                        <img src={image || DEFAULT_IMAGE[k]} alt={`${camp} camp`} className="h-full w-full object-cover" />
                      </div>
                      {editing && (
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                            Replace image
                          </Button>
                          {image && (
                            <Button type="button" variant="ghost" onClick={() => update({ [imageKey]: "" })}>
                              Use default image
                            </Button>
                          )}
                          <Input
                            ref={imageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              e.target.value = ""
                              if (!file) return
                              if (!imageTypes.includes(file.type)) {
                                toast.error("Choose a JPG, PNG or WebP picture.")
                                return
                              }
                              if (file.size > maxImageBytes) {
                                toast.error("The picture must be under 5 MB.")
                                return
                              }
                              update({ [imageKey]: URL.createObjectURL(file) })
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Description</Label>
                      {editing ? (
                        <>
                          <Textarea value={description} onChange={(e) => update({ [descriptionKey]: e.target.value.slice(0, maxChars) })} />
                          <p className="text-xs text-muted-foreground">
                            {description.length} / {maxChars} characters
                          </p>
                        </>
                      ) : (
                        <p className="rounded-md border px-3 py-2 text-sm">{description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm text-muted-foreground">Requirements</h3>
                    {requirementKeys.map(({ label, key }) => (
                      <div key={key} className="flex flex-col gap-2">
                        <Label>{label}</Label>
                        {editing ? (
                          <>
                            <Textarea value={settings[key]} onChange={(e) => update({ [key]: e.target.value })} className="min-h-24" />
                            <p className="text-xs text-muted-foreground">One item per line.</p>
                          </>
                        ) : (
                          <ul className="list-disc space-y-1 rounded-md border px-3 py-2 pl-8 text-sm">
                            {splitLines(settings[key]).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                            {splitLines(settings[key]).length === 0 && <li className="list-none text-muted-foreground">Nothing added yet.</li>}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </SetupCard>

      <Dialog open={previewing !== null} onOpenChange={(open) => { if (!open) setPreviewing(null) }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Welcome page preview</DialogTitle>
            <DialogDescription>This is how each camp appears to campers, using the words and pictures above.</DialogDescription>
          </DialogHeader>
          {previewing && (
            <div className="flex flex-col gap-8">
              {(["myf", "mya"] as const).map((k) => (
                <div key={k} className="flex flex-col gap-4">
                  <WelcomeCampCard
                    category={k}
                    name={camps[k].name}
                    age={camps[k].age}
                    dates={camps[k].dates}
                    description={previewing[`${k}Description`]}
                    image={previewing[`${k}Image`] || DEFAULT_IMAGE[k]}
                  >
                    <Button disabled className={`w-full ${BUTTON_CLASS[k]}`}>
                      Register for {k.toUpperCase()}
                    </Button>
                  </WelcomeCampCard>
                  <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm text-muted-foreground">View camp requirements</p>
                    <RequirementsLists bring={previewing[`${k}Bring`]} expect={previewing[`${k}Expect`]} know={previewing[`${k}Know`]} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}