import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import logo from "@/assets/camp-fearless-logo.png"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
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
    <div className={cn("fixed inset-0 z-50 grid overflow-y-auto bg-background md:grid-cols-2", className)} {...props}>
      {/* LEFT SIDE: form */}
      <div className="relative flex flex-col items-center justify-center p-6 md:p-10">
        <div className="absolute right-6 top-6 md:right-10 md:top-10">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-xs">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            {/* The logo artwork is light, so it is turned black on the white page and left as it is in dark mode */}
            <img src={logo} alt="Camp Fearless" className="mb-2 h-16 w-auto object-contain brightness-0 dark:brightness-100" />
            <h1 className="text-2xl font-bold">Log in to your account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password
              <br />
              to open the camp portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@mavuno.org"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account? Ask your camp administrator.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: image, full height */}
      <div className="relative hidden bg-muted md:block">
        <img src="/assets/clay-banks-Ppz6b-YUDHw-unsplash 1.png" alt="A tent in the mountains" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  )
}