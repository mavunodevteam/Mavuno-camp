import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Camp } from "@/lib/api/types"
import { ageLabel } from "@/lib/format"
import { formatCampRange } from "@/lib/welcome"


/* The words and pictures live here; dates, ages and open status come from the database */
const REGISTER_PATH: Record<Camp["category"], string> = {
  myf: "/register/myf",
  mya: "/register/mya",
}

const CONTENT: Record<Camp["category"], { image: string; description: string; buttonClass: string }> = {
  myf: {
    image: "/assets/myf.png",
    description:
      "Empowering teenagers through mentorship and engaging activities designed for this crucial development stage.",
    buttonClass: "bg-orange-500 text-white hover:bg-orange-600",
  },
  mya: {
    image: "/assets/mya.png",
    description:
      "A space for young adults navigating post-high school life, campus, careers, and building lasting communities.",
    buttonClass: "bg-zinc-900 text-white hover:bg-zinc-800",
  },
}

export function CampCard({ camp }: { camp: Camp }) {
  const content = CONTENT[camp.category]

  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      <div className="relative h-56 w-full overflow-hidden bg-muted">
        <img
          src={content.image}
          alt={`${camp.category.toUpperCase()} camp`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <Badge className="absolute left-3 top-3">{ageLabel(camp)}</Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{camp.name}</CardTitle>
        <p className="text-sm font-semibold">{formatCampRange(camp.start_date, camp.end_date)}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription>{content.description}</CardDescription>
      </CardContent>
      <CardFooter>
        {camp.registration_open ? (
          <Link
            to={REGISTER_PATH[camp.category]}
            className={cn(buttonVariants({ size: "lg" }), "w-full", content.buttonClass)}
          >
            Register for {camp.category.toUpperCase()}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Button disabled size="lg" className="w-full">
            Registration closed
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}