import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  RegistrationToast,
  type RegistrationToastAction,
  type RegistrationToastItem,
  type RegistrationToastVariant,
} from "@/components/registration/RegistrationToast"

const AUTO_DISMISS_MS = 10_000

type ShowRegistrationToastOptions = {
  variant: RegistrationToastVariant
  message: string
  action?: RegistrationToastAction
}

type RegistrationToastContextValue = {
  showRegistrationToast: (options: ShowRegistrationToastOptions) => void
}

const RegistrationToastContext =
  createContext<RegistrationToastContextValue | null>(null)

export function RegistrationToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<RegistrationToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showRegistrationToast = useCallback(
    ({ variant, message, action }: ShowRegistrationToastOptions) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, variant, message, action }])
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    },
    [dismissToast]
  )

  const value = useMemo(
    () => ({ showRegistrationToast }),
    [showRegistrationToast]
  )

  return (
    <RegistrationToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full max-w-[420px]">
            <RegistrationToast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </RegistrationToastContext.Provider>
  )
}

export function useRegistrationToast() {
  const ctx = useContext(RegistrationToastContext)
  if (!ctx) {
    throw new Error(
      "useRegistrationToast must be used within RegistrationToastProvider"
    )
  }
  return ctx
}
