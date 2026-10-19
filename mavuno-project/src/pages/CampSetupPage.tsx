
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pause,
  PanelLeft,
  RefreshCw,
} from "lucide-react";

type CampCategory = "MYF" | "MYA";
type DateField = "campStart" | "campEnd" | "opens" | "closes";

type CampForm = {
  edition: string;
  campStart: string;
  campEnd: string;
  camperLimit: string;
  onlineFee: string;
  walkInFee: string;
  facilitatorFee: string;
  registrationLink: string;
  opens: string;
  closes: string;
  active: boolean;
};

type ToastMessage = {
  type: "success" | "error";
  message: string;
} | null;

const initialForms: Record<CampCategory, CampForm> = {
  MYF: {
    edition: "MYF Camp 2026",
    campStart: "2026-12-01",
    campEnd: "2026-12-05",
    camperLimit: "1000",
    onlineFee: "1000",
    walkInFee: "2000",
    facilitatorFee: "500",
    registrationLink: "register.mavuno.org/myf-2026-x7k2",
    opens: "2026-11-30",
    closes: "2026-12-01",
    active: true,
  },
  MYA: {
    edition: "MYA Camp 2026",
    campStart: "2026-12-01",
    campEnd: "2026-12-05",
    camperLimit: "1000",
    onlineFee: "1000",
    walkInFee: "2000",
    facilitatorFee: "500",
    registrationLink: "register.mavuno.org/mya-2026-x7k2",
    opens: "2026-11-30",
    closes: "2026-12-01",
    active: true,
  },
};

const dateFields: DateField[] = [
  "campStart",
  "campEnd",
  "opens",
  "closes",
];

const dateLabels: Record<DateField, string> = {
  campStart: "Camp start",
  campEnd: "Camp end",
  opens: "Opens",
  closes: "Closes",
};

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function monthLabel(value: string) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function CalendarPopover({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = value ? new Date(`${value}T12:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  function moveMonth(amount: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => moveMonth(-1)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft size={17} />
        </button>

        <span className="text-sm font-semibold text-gray-900">
          {monthLabel(
            `${visibleMonth.getFullYear()}-${String(
              visibleMonth.getMonth() + 1,
            ).padStart(2, "0")}-01`,
          )}
        </span>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => moveMonth(1)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span
            key={day}
            className="py-1 text-xs font-medium text-gray-400"
          >
            {day}
          </span>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <span key={`blank-${index}`} />;
          }

          const dateValue = `${visibleMonth.getFullYear()}-${String(
            visibleMonth.getMonth() + 1,
          ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const selected = dateValue === value;

          return (
            <button
              key={dateValue}
              type="button"
              onClick={() => onSelect(dateValue)}
              className={`h-9 rounded-lg text-sm transition ${
                selected
                  ? "bg-gray-900 font-semibold text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  if (!toast) return null;

  const success = toast.type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-5 top-5 z-50 flex max-w-md items-start gap-3 rounded-xl border p-4 shadow-lg ${
        success
          ? "border-green-100 bg-[#ECFDF5] text-green-900"
          : "border-red-100 bg-[#FEF2F2] text-red-900"
      }`}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={20} />
      ) : (
        <CircleAlert className="mt-0.5 shrink-0 text-red-600" size={20} />
      )}

      <p className="flex-1 text-sm leading-5">{toast.message}</p>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="rounded p-1 opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  readOnly = false,
  suffix,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  error?: boolean;
  type?: string;
  readOnly?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <span className="relative block">
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          aria-invalid={error || undefined}
          className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100 ${
            error ? "border-red-500" : "border-gray-200"
          } ${suffix ? "pr-10" : ""} ${
            readOnly ? "bg-gray-50 text-gray-600" : ""
          }`}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
            {suffix}
          </span>
        )}
      </span>
      {error && (
        <span className="mt-1 block text-xs text-[#DC2626]">
          This field needs to be filled
        </span>
      )}
    </label>
  );
}

function DateFieldInput({
  field,
  value,
  onChange,
  error,
  open,
  onToggle,
  onSelect,
}: {
  field: DateField;
  value: string;
  onChange: (value: string) => void;
  error: boolean;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {dateLabels[field]}
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-left text-sm outline-none hover:border-gray-400 focus:ring-2 focus:ring-gray-100 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {formatDate(value) || "DD/MM/YYYY"}
        </span>
        <CalendarDays size={16} className="shrink-0 text-gray-400" />
      </button>

      {error && (
        <span className="mt-1 block text-xs text-[#DC2626]">
          This field needs to be filled
        </span>
      )}

      {open && (
        <CalendarPopover
          value={value}
          onSelect={(date) => {
            onChange(date);
            onSelect(date);
          }}
        />
      )}
    </div>
  );
}

function CampCard({
  category,
  form,
  setForm,
  onToast,
}: {
  category: CampCategory;
  form: CampForm;
  setForm: (form: CampForm) => void;
  onToast: (toast: NonNullable<ToastMessage>) => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [openCalendar, setOpenCalendar] = useState<DateField | null>(null);

  const isMYF = category === "MYF";
  const title = isMYF ? "MYF setup" : "MYA setup";
  const subtitle = isMYF
    ? "Mavuno Young and Fearless, ages 14 to 17"
    : "Mavuno Young Adults, age 18 and above";

  function update<K extends keyof CampForm>(key: K, value: CampForm[K]) {
    setForm({ ...form, [key]: value });
  }

  function changeDate(field: DateField, value: string) {
    update(field, value);
    setErrors((current) => current.filter((item) => item !== field));
    setOpenCalendar(null);
  }

  function validate() {
    const missing: string[] = [];

    if (!form.edition.trim()) missing.push("edition");
    if (!form.camperLimit.trim()) missing.push("camperLimit");
    if (!form.onlineFee.trim()) missing.push("onlineFee");
    if (!form.walkInFee.trim()) missing.push("walkInFee");
    if (!form.facilitatorFee.trim()) missing.push("facilitatorFee");

    for (const field of dateFields) {
      if (!form[field]) missing.push(field);
    }

    if (!form.registrationLink.trim()) missing.push("registrationLink");

    if (missing.length > 0) {
      setErrors(missing);
      onToast({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return false;
    }

    if (Number(form.camperLimit) < 1) {
      setErrors(["camperLimit"]);
      onToast({
        type: "error",
        message: "Camper limit must be at least 1.",
      });
      return false;
    }

    for (const fee of [
      form.onlineFee,
      form.walkInFee,
      form.facilitatorFee,
    ]) {
      if (!Number.isFinite(Number(fee)) || Number(fee) < 0) {
        onToast({
          type: "error",
          message: "Registration fees must be valid, non-negative amounts.",
        });
        return false;
      }
    }

    if (form.campEnd <= form.campStart) {
      onToast({
        type: "error",
        message: "Camp end date should be after the start date.",
      });
      return false;
    }

    if (form.closes < form.opens) {
      onToast({
        type: "error",
        message: "Registration closing date must be on or after the opening date.",
      });
      return false;
    }

    if (form.opens > form.campStart || form.closes > form.campEnd) {
      onToast({
        type: "error",
        message: "Registration dates must fall within the camp schedule.",
      });
      return false;
    }

    setErrors([]);
    return true;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${form.registrationLink}`);
      onToast({ type: "success", message: "Link copied" });
    } catch {
      onToast({
        type: "error",
        message:
          "Failed to copy link. Please try again or contact support if the issue persists.",
      });
    }
  }

  function regenerateLink() {
    const suffix = Math.random().toString(36).slice(2, 6);
    const slug = category.toLowerCase();
    update("registrationLink", `register.mavuno.org/${slug}-2026-${suffix}`);
    onToast({
      type: "success",
      message: "A new registration link has been generated in this form.",
    });
  }

  function saveSetup() {
    if (!validate()) return;

    // Frontend prototype only: connect this handler to the verified
    // Supabase save function before treating the setup as persisted.
    onToast({
      type: "success",
      message:
        "Camp setup successful. You are all set for camp and your spot has been secured.",
    });
  }

  const spotsUsed = 320;
  const limit = Math.max(1, Number(form.camperLimit) || 1);
  const percentage = Math.min(100, (spotsUsed / limit) * 100);

  return (
    <section className="overflow-visible rounded-lg border border-[#E5E7EB] bg-white">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-7 p-5 sm:p-6 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Dates
          </h3>

          <Field
            label="Edition name"
            value={form.edition}
            onChange={(v) => update("edition", v)}
            error={errors.includes("edition")}
          />

          <div className="grid grid-cols-2 gap-3">
            {(["campStart", "campEnd"] as const).map((field) => (
              <DateFieldInput
                key={field}
                field={field}
                value={form[field]}
                onChange={(v) => update(field, v)}
                error={errors.includes(field)}
                open={openCalendar === field}
                onToggle={() =>
                  setOpenCalendar(openCalendar === field ? null : field)
                }
                onSelect={(v) => changeDate(field, v)}
              />
            ))}
          </div>

          <Field
            label="Camper limit"
            type="number"
            value={form.camperLimit}
            onChange={(v) => update("camperLimit", v)}
            error={errors.includes("camperLimit")}
          />

          <div className="pt-1">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">
                Capacity tracker
              </span>
              <span className="text-gray-500">
                {Math.round(percentage)}%
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {spotsUsed.toLocaleString()} of {limit.toLocaleString()} camper
              spots used. {Math.max(0, limit - spotsUsed).toLocaleString()}{" "}
              left. Facilitators and Waived campers are counted. Cancelled
              registrations free up a spot.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Fees, full payment only
          </h3>

          <Field
            label="Online registration"
            type="number"
            value={form.onlineFee}
            onChange={(v) => update("onlineFee", v)}
            error={errors.includes("onlineFee")}
          />

          <Field
            label="Walk-in (desk) registration"
            type="number"
            value={form.walkInFee}
            onChange={(v) => update("walkInFee", v)}
            error={errors.includes("walkInFee")}
          />

          <Field
            label="Facilitator registration"
            type="number"
            value={form.facilitatorFee}
            onChange={(v) => update("facilitatorFee", v)}
            error={errors.includes("facilitatorFee")}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Registration link
          </h3>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">
                Registration link
              </label>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  form.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {form.active ? "Active" : "Paused"}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <input
                value={form.registrationLink}
                readOnly
                aria-label="Registration link"
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["opens", "closes"] as const).map((field) => (
              <DateFieldInput
                key={field}
                field={field}
                value={form[field]}
                onChange={(v) => update(field, v)}
                error={errors.includes(field)}
                open={openCalendar === field}
                onToggle={() =>
                  setOpenCalendar(openCalendar === field ? null : field)
                }
                onSelect={(v) => changeDate(field, v)}
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Copy size={14} />
              Copy link
            </button>
            <button
              type="button"
              onClick={() => {
                update("active", !form.active);
                onToast({
                  type: "success",
                  message: form.active
                    ? "Registration link paused in this form."
                    : "Registration link activated in this form.",
                });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pause size={14} />
              {form.active ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={regenerateLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-xl text-xs leading-5 text-gray-500">
          Changes here only affect {category}. Existing registrations keep the
          fee they were charged.
        </p>
        <button
          type="button"
          onClick={saveSetup}
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 ${
            isMYF ? "bg-[#111827]" : "bg-[#3B5998]"
          }`}
        >
          <CheckCircle2 size={16} />
          Save {category} setup
        </button>
      </footer>
    </section>
  );
}

export default function CampSetupPage() {
  const [forms, setForms] = useState(initialForms);
  const [toast, setToast] = useState<ToastMessage>(null);

  function updateForm(category: CampCategory, form: CampForm) {
    setForms((current) => ({ ...current, [category]: form }));
  }

  return (
    <main className="min-h-full bg-gray-50/60 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mx-auto max-w-[1500px] rounded-lg border border-[#E5E7EB] bg-white">
        <header className="flex items-center gap-3 border-b border-gray-200 px-5 py-5 sm:px-6">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("toggle-sidebar"))
            }
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <PanelLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Camp setup
          </h1>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          <CampCard
            category="MYF"
            form={forms.MYF}
            setForm={(form) => updateForm("MYF", form)}
            onToast={setToast}
          />

          <CampCard
            category="MYA"
            form={forms.MYA}
            setForm={(form) => updateForm("MYA", form)}
            onToast={setToast}
          />
        </div>
      </div>
    </main>
  );
}
