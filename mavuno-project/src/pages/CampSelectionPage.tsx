import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ArrowRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CampRequirementsDialog } from "@/components/CampRequirementsDialog"
import { BUTTON_CLASS, WelcomeCampCard } from "@/components/welcome/WelcomeCampCard"
import { fetchCamps } from "@/lib/api/lookups"
import type { Camp } from "@/lib/api/types"
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, ageLabel, formatCampRange, registrationState } from "@/lib/welcome"
import logo from "@/assets/camp-fearless-logo.png"

const ORDER: Camp["category"][] = ["myf", "mya"]

/* The welcome page. Everything on the cards is whatever an admin saved in Camp setup. */
export default function CampSelectionPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requirementsOpen, setRequirementsOpen] = useState(false)
  const [focus, setFocus] = useState<Camp["category"] | null>(null)

  useEffect(() => {
    fetchCamps()
      .then(setCamps)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...camps].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))

  function openRequirements(category: Camp["category"] | null) {
    setFocus(category)
    setRequirementsOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 w-full max-w-3xl space-y-4 text-center">
        {/* The logo artwork is light, so it is turned black on this light page */}
        <img src={logo} alt="Camp Fearless logo" className="mx-auto h-16 w-auto brightness-0" />
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-zinc-900 sm:text-3xl">Welcome to Mavuno Camp Fearless</h1>
        <p className="mx-auto max-w-xl text-sm text-zinc-500">
          Please select the appropriate camp based on the attendee&apos;s age group to begin registration. Camps are tailored for specific life stages.
        </p>
      </div>

      {loading && <p className="mb-12 text-zinc-500">Loading camps...</p>}
      {error && <p className="mb-12 text-red-600">{error}</p>}
      {!loading && !error && sorted.length === 0 && <p className="mb-12 max-w-md text-center text-zinc-500">Registration is closed right now. Please check back soon.</p>}

      <div className="mb-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        {sorted.map((camp) => {
          const state = registrationState(camp)
          return (
            <WelcomeCampCard
              key={camp.id}
              category={camp.category}
              name={camp.name}
              age={ageLabel(camp.min_age, camp.max_age)}
              dates={formatCampRange(camp.start_date, camp.end_date)}
              description={camp.welcome_description || DEFAULT_DESCRIPTION[camp.category]}
              image={camp.welcome_image_url || DEFAULT_IMAGE[camp.category]}
              bring={camp.welcome_bring}
              fee={camp.fee_online}
              onSeeFullList={() => openRequirements(camp.category)}
            >
              {state.open ? (
                <Link to={`/register/${camp.category}`} className="block w-full">
                  <Button className={`w-full ${BUTTON_CLASS[camp.category]}`}>
                    Register for {camp.category.toUpperCase()}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  {state.label}
                </Button>
              )}
            </WelcomeCampCard>
          )
        })}
      </div>

      {sorted.length > 0 && (
        <div className="flex flex-col items-center space-y-4 text-center">
          <Button variant="outline" className="border-zinc-300 font-medium text-zinc-700 hover:bg-zinc-100" onClick={() => openRequirements(null)}>
            <FileText className="mr-2 size-4" />
            View camp requirements
            <ArrowRight className="ml-2 size-4" />
          </Button>
          <p className="text-sm text-zinc-500">Learn about what to bring, what to expect, and other important details.</p>
        </div>
      )}

      <CampRequirementsDialog camps={sorted} open={requirementsOpen} onOpenChange={setRequirementsOpen} initial={focus} />
    </div>
  )
}