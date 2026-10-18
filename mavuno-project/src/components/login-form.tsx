import { useState } from "react"
import { useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid email or incorrect password, please try again.")
      setLoading(false)
    } else {
      navigate("/dashboard")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* min-h-[600px] makes the card taller so the image looks good */}
        <div className="grid min-h-[600px] md:grid-cols-2">
          
          {/* LEFT SIDE: Form */}
          <div className="flex flex-col justify-center p-6 md:p-10">
            <div className="flex flex-col items-center gap-2 text-center mb-8">
              <img
                src="/assets/Camp fearless logo.png"
                alt="Camp Fearless"
                className="h-16 w-auto object-contain"
              />
              <h1 className="text-2xl font-bold">Log in your account</h1>
              <p className="text-sm text-muted-foreground">
                Sign-in to manage the camp
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                {/* ERROR STATE */}
                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </div>

          {/* RIGHT SIDE: Image */}
          <div className="relative hidden bg-muted md:block">
            <img
              src="/assets/clay-banks-Ppz6b-YUDHw-unsplash 1.png"
              alt="Camp"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          
        </div>
      </div>
    </div>
  )
}