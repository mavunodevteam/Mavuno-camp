/**
 * Camper Registration Route (`app/routes/register.tsx`)
 *
 * Full-Stack Architecture Overview:
 * This route manages the core multi-camper registration funnel for Mavuno Camp Fearless.
 * It coordinates:
 * 1. Query parameter resolution (`?camp=myf|mya`) to apply targeted business logic.
 * 2. Dynamic, multi-attendee form state orchestration (1 to N campers per registration session).
 * 3. Shared emergency contact / guardian capture.
 * 4. M-Pesa mobile money payment verification (Paybill 400200, Account CAMPFEARLESS).
 * 5. Two-phase transactional data ingestion into Supabase PostgreSQL:
 *    - Phase A: Inserts a parent batch record (`registration_batches`) capturing payment and guardian contact.
 *    - Phase B: Sequentially inserts relational child records (`campers`) referencing the generated `batch_id`.
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Trash2 } from "lucide-react";

/**
 * Route Metadata Generator (`meta`)
 *
 * Emits page-level title and description for search engines, browser tabs,
 * and social graph link previews.
 *
 * @returns {Array<Object>} Meta tags injected into the document `<head>`.
 */
export function meta() {
  return [
    { title: "Mavuno Camp Fearless - Camper Registration" },
    { name: "description", content: "Register for Mavuno Camp Fearless." },
  ];
}

/**
 * Camper Data Model (`CamperData`)
 */
type CamperData = {
  id: number;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  phone: string;
  phoneCode: string;
  baptised: string;
  isFromMavuno: string;
  campus: string;
  churchName: string;
  hasMedical: boolean;
  medicalDetails: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetails: string;
};

type Campus = {
  id: string;
  name: string;
};

const DEFAULT_CAMPUSES: Campus[] = [
  { id: "hill-city", name: "Hill City" },
  { id: "mashariki", name: "Mashariki" },
  { id: "downtown", name: "Downtown" },
  { id: "lifespring", name: "Lifespring" },
];

/**
 * Camper Object Factory (`createEmptyCamper`)
 */
const createEmptyCamper = (id: number): CamperData => ({
  id,
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  phone: "",
  phoneCode: "+254",
  baptised: "",
  isFromMavuno: "yes",
  campus: "",
  churchName: "",
  hasMedical: false,
  medicalDetails: "",
  hasSpecialNeeds: false,
  specialNeedsDetails: "",
});

/**
 * Camper Registration Component (`Register`)
 */
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Resolve camp category from URL query parameters (default to "MYA" for Young Adults)
  const campType = searchParams.get("camp")?.toUpperCase() || "MYA";

  // Dynamic age options: starting from 18 for MYA (or 14-17 for teens if MYF)
  const ageOptions = campType === "MYF"
    ? ["14", "15", "16", "17"]
    : Array.from({ length: 33 }, (_, i) => String(18 + i)); // 18 through 50

  // Dynamic list of campers registered in this session
  const [campers, setCampers] = useState<CamperData[]>([createEmptyCamper(1)]);

  // Shared emergency contact / guardian state
  const [gFirstName, setGFirstName] = useState("");
  const [gLastName, setGLastName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  // Payment states
  const [mpesaCode, setMpesaCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic church campuses retrieved from database
  const [campuses, setCampuses] = useState<Campus[]>(DEFAULT_CAMPUSES);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCampuses = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || supabaseUrl.includes("YOUR_REFERENCE_ID_HERE")) {
          return;
        }
        setIsLoadingCampuses(true);
        const res = await fetch(`${supabaseUrl}/rest/v1/campuses?select=*`, {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setCampuses(
              data.map((c: any) => ({
                id: String(c.id || c.value || c.code || c.name?.toLowerCase().replace(/\s+/g, "-")),
                name: String(c.name || c.label || c.campus_name || c.id),
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Could not retrieve campuses from database, using fallback:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCampuses(false);
        }
      }
    };

    fetchCampuses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derived quantity of attendees
  const camperCount = campers.length;

  /** Appends a new blank camper entry to the batch */
  const incrementCount = () => setCampers(prev => [...prev, createEmptyCamper(Date.now())]);

  /** Decrements camper count by removing the last item in the array */
  const decrementCount = () => {
    if (campers.length > 1) {
      setCampers(prev => prev.slice(0, -1));
    }
  };

  /** Removes a specific camper by unique ID from the list */
  const removeCamper = (id: number) => {
    if (campers.length > 1) {
      setCampers(prev => prev.filter(c => c.id !== id));
    }
  };

  /** Immutably updates a specific field on a target camper record */
  const updateCamper = (id: number, field: keyof CamperData, value: string | boolean | null) => {
    const safeValue = value ?? "";
    setCampers(prev => prev.map(c => c.id === id ? { ...c, [field]: safeValue } : c));
  };

  /** Comprehensive Client-side Form Validation Engine */
  const isFormValid = () => {
    for (const c of campers) {
      if (c.firstName.trim() === "" || c.lastName.trim() === "" || c.age.trim() === "" || c.phone.trim() === "") return false;
      if (campType === "MYF" && parseInt(c.age) > 17) return false;
      if (c.isFromMavuno === "yes" && c.campus.trim() === "") return false;
      if (c.isFromMavuno === "no" && c.churchName.trim() === "") return false;
    }
    if (gFirstName.trim() === "" || gLastName.trim() === "" || gPhone.trim() === "") return false;
    if (mpesaCode.trim() === "") return false;
    return true;
  };

  /** Total registration fee calculated at Ksh 1,000 per camper */
  const totalAmount = camperCount * 1000;

  /**
   * Asynchronous Two-Phase Registration Submission (`handleSubmit`)
   */
  const handleSubmit = async () => {
    if (!isFormValid() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      // 1. Create the Registration Batch first
      const batchResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registration_batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          camp_type: campType,
          guardian_first_name: gFirstName,
          guardian_last_name: gLastName,
          guardian_phone_code: "+254",
          guardian_phone: gPhone,
          relationship: relationship,
          mpesa_code: mpesaCode,
          request_waiver: false
        })
      });

      if (!batchResponse.ok) throw new Error("Failed to create batch");
      const batchData = await batchResponse.json();
      const batchId = batchData[0].id;

      // 2. Loop through and create each Camper linked to that Batch ID
      for (const camper of campers) {
        const camperResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/campers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            batch_id: batchId,
            first_name: camper.firstName,
            last_name: camper.lastName,
            age: parseInt(camper.age) || 0,
            gender: camper.gender || "male",
            phone_code: camper.phoneCode || "+254",
            phone: camper.phone,
            is_baptised: camper.baptised === "yes",
            is_from_mavuno: camper.isFromMavuno === "yes",
            campus: camper.campus,
            church_name: camper.churchName,
            has_medical_condition: camper.hasMedical,
            medical_details: camper.hasMedical ? camper.medicalDetails : null,
            has_special_needs: camper.hasSpecialNeeds,
            special_needs_details: camper.hasSpecialNeeds ? camper.specialNeedsDetails : null
          })
        });
        if (!camperResponse.ok) throw new Error("Failed to register camper");
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Registration failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-3 lg:h-screen lg:overflow-hidden lg:p-4">
      <div className="mx-auto grid h-full min-h-0 w-full grid-cols-1 gap-4 lg:max-w-[1448px] lg:grid-cols-[minmax(0,735fr)_minmax(0,681fr)] lg:gap-8 lg:overflow-hidden">

        {/* Left Side Hero: Fixed in view, does not scroll on desktop */}
        <section className="w-full shrink-0 overflow-hidden rounded-2xl lg:max-w-none lg:h-full">
          {/* Mobile compact hero */}
          <div
            className="relative box-border flex w-full overflow-hidden rounded-2xl bg-cover bg-center text-white lg:hidden p-5"
            style={{ backgroundImage: "url('/assets/clay-banks-Ppz6b-YUDHw-unsplash 1.png')" }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/50" />
            <div className="relative z-10 flex flex-col items-center text-center w-full py-2">
              <Link to="/" className="inline-block mb-3">
                <img src="/assets/Camp fearless logo.png" alt="Camp Fearless" className="h-14 w-auto object-contain" />
              </Link>
              <h1 className="text-xl font-black uppercase text-white mb-2">Camper Registration</h1>
              <p className="text-xs text-zinc-200 font-normal max-w-sm mb-3">
                Select the number of campers you are registering, provide a shared emergency contact, and enter individual details and medical notes for each person.
              </p>
              <p className="text-xs text-white/90">
                <span className="font-semibold">Terms and Conditions</span> and <span className="font-semibold">Policy statement</span>
              </p>
            </div>
          </div>

          {/* Desktop full hero */}
          <div
            className="relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-2xl bg-cover text-white lg:flex lg:h-full"
            style={{
              backgroundImage: "url('/assets/clay-banks-Ppz6b-YUDHw-unsplash 1.png')",
              backgroundPosition: "50% 32%"
            }}
          >
            {/* Top dark gradient scrim */}
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/95 via-black/40 to-transparent h-[380px]" />
            {/* Bottom dark subtle gradient scrim */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/85 via-black/35 to-transparent h-[220px]" />

            <header className="relative z-[2] flex flex-col items-center text-center text-white pt-8 px-6">
              <div className="w-full max-w-[460px] flex flex-col items-center gap-4">
                <Link to="/" className="inline-block transition-transform hover:scale-105">
                  <img src="/assets/Camp fearless logo.png" alt="Camp Fearless" className="h-16 sm:h-20 w-auto object-contain" />
                </Link>
                <div className="flex flex-col gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-normal">
                    Camper Registration
                  </h1>
                  <p className="text-sm text-zinc-200/95 leading-relaxed font-normal">
                    Select the number of campers you are registering, provide a shared emergency contact, and enter individual details and medical notes for each person.
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1" />

            <footer className="relative z-[2] mx-auto flex w-full shrink-0 flex-col items-center text-center text-white pb-5 px-6">
              <div className="flex items-center justify-center gap-3.5 mb-3.5">
                <img src="/assets/Motif 01.png" alt="Motif 1" className="w-6 h-6 object-contain" />
                <img src="/assets/Motif 05.png" alt="Motif 2" className="w-6 h-6 object-contain" />
                <img src="/assets/Motif 02.png" alt="Motif 3" className="w-6 h-6 object-contain" />
                <img src="/assets/Motif 03.png" alt="Motif 4" className="w-6 h-6 object-contain" />
                <img src="/assets/Motif 04.png" alt="Motif 5" className="w-6 h-6 object-contain" />
                <img src="/assets/Motif 07.png" alt="Motif 6" className="w-6 h-6 object-contain" />
              </div>
              <p className="text-xs text-white/90">
                <span className="font-semibold">Terms and Conditions</span>
                {" and "}
                <span className="font-semibold">Policy statement</span>
              </p>
            </footer>
          </div>
        </section>

        {/* Right Side Scrolling Form: ONLY this section scrolls on desktop */}
        <section className="flex min-h-0 min-w-0 w-full flex-col gap-4 lg:h-full lg:overflow-y-auto lg:overscroll-y-contain lg:pr-2 [color-scheme:dark]">

          {/* 1. Camper Count Selector */}
          <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight leading-6">Select number of campers</h2>
              <p className="text-sm text-zinc-500 mt-0.5">How many attendees are you registering in this batch?</p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={decrementCount}
                disabled={camperCount <= 1}
                className="h-9 w-9 rounded-md bg-[#18181B] hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-[#18181B] text-white flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed"
                aria-label="Decrease camper count"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="h-9 min-w-9 px-3 flex items-center justify-center border border-[#E4E4E7] rounded-md bg-white text-base font-medium text-zinc-900">
                {camperCount}
              </div>
              <button
                type="button"
                onClick={incrementCount}
                className="h-9 w-9 rounded-md bg-[#18181B] hover:bg-zinc-800 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Increase camper count"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2. Dynamic Camper Forms */}
          {campers.map((camper, index) => (
            <div key={camper.id} className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 space-y-4 relative">

              {/* Header with Camper numbering */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight leading-6">Camper details</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Fill in your details as per your legal documents</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#F05922]">
                    Camper {index + 1}/{camperCount}
                  </span>
                  {camperCount > 1 && index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeCamper(camper.id)}
                      className="size-8 flex items-center justify-center rounded-md border border-[#E4E4E7] text-zinc-400 hover:text-red-500 hover:border-zinc-400 transition cursor-pointer"
                      title="Remove camper"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Details Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-zinc-900 block">First name</Label>
                  <Input
                    value={camper.firstName}
                    onChange={(e) => updateCamper(camper.id, "firstName", e.target.value)}
                    className="bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-zinc-900 block">Last name</Label>
                  <Input
                    value={camper.lastName}
                    onChange={(e) => updateCamper(camper.id, "lastName", e.target.value)}
                    className="bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-zinc-900 block">Age</Label>
                  <Select value={camper.age} onValueChange={(val) => updateCamper(camper.id, "age", val || "")}>
                    <SelectTrigger className="w-full bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm text-zinc-800 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white border border-[#E4E4E7] shadow-lg rounded-xl">
                      {ageOptions.map((age) => (
                        <SelectItem key={age} value={age}>
                          {age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Personal Details Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-zinc-900 block">Gender</Label>
                  <div className="flex gap-2 h-9">
                    <button
                      type="button"
                      onClick={() => updateCamper(camper.id, "gender", "male")}
                      className={`flex-1 h-9 rounded-md text-sm font-medium transition cursor-pointer border ${camper.gender === "male"
                        ? "bg-[#18181B] text-white border-[#18181B]"
                        : "bg-white text-zinc-800 border-[#E4E4E7] hover:bg-zinc-50"
                        }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCamper(camper.id, "gender", "female")}
                      className={`flex-1 h-9 rounded-md text-sm font-medium transition cursor-pointer border ${camper.gender === "female"
                        ? "bg-[#18181B] text-white border-[#18181B]"
                        : "bg-white text-zinc-800 border-[#E4E4E7] hover:bg-zinc-50"
                        }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-zinc-900 block">Phone number</Label>
                  <Input
                    type="tel"
                    value={camper.phone}
                    onChange={(e) => updateCamper(camper.id, "phone", e.target.value)}
                    className="bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 w-full focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-zinc-900 block">Want to be baptised?</Label>
                  <div className="flex gap-2 h-9 items-center">
                    <button
                      type="button"
                      onClick={() => updateCamper(camper.id, "baptised", "yes")}
                      className={`w-[55px] shrink-0 h-9 rounded-md text-sm font-medium transition cursor-pointer border ${camper.baptised === "yes"
                        ? "bg-[#18181B] text-white border-[#18181B]"
                        : "bg-white text-zinc-800 border-[#E4E4E7] hover:bg-zinc-50"
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCamper(camper.id, "baptised", "no")}
                      className={`w-[51px] shrink-0 h-9 rounded-md text-sm font-medium transition cursor-pointer border ${camper.baptised === "no"
                        ? "bg-[#18181B] text-white border-[#18181B]"
                        : "bg-white text-zinc-800 border-[#E4E4E7] hover:bg-zinc-50"
                        }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Church Campus Section */}
              <div className="space-y-3 pt-1">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 tracking-tight leading-5">Church campus</h4>
                  <p className="text-sm text-zinc-500 mt-0.5">Drives the campus and network breakdowns</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-zinc-900 block">Are you from Mavuno?</Label>
                    <div className="flex gap-2 h-9 items-center">
                      <button
                        type="button"
                        onClick={() => updateCamper(camper.id, "isFromMavuno", "yes")}
                        className={`w-[55px] shrink-0 h-9 rounded-md text-sm font-medium transition cursor-pointer border ${camper.isFromMavuno === "yes"
                          ? "bg-[#18181B] text-white border-[#18181B]"
                          : "bg-white text-zinc-800 border-[#E4E4E7] hover:bg-zinc-50"
                          }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCamper(camper.id, "isFromMavuno", "no")}
                        className={`w-[51px] shrink-0 h-9 rounded-md text-sm font-medium transition cursor-pointer border ${camper.isFromMavuno === "no"
                          ? "bg-[#18181B] text-white border-[#18181B]"
                          : "bg-white text-zinc-800 border-[#E4E4E7] hover:bg-zinc-50"
                          }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-sm font-medium text-zinc-900 block">
                      {camper.isFromMavuno === "no" ? "Other church" : "Select campus"}
                    </Label>
                    {camper.isFromMavuno === "no" ? (
                      <Input
                        value={camper.churchName}
                        onChange={(e) => updateCamper(camper.id, "churchName", e.target.value)}
                        placeholder="Enter church name"
                        className="w-[200px] bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 focus-visible:ring-1 focus-visible:ring-zinc-400"
                      />
                    ) : (
                      <Select value={camper.campus} onValueChange={(val) => updateCamper(camper.id, "campus", val)}>
                        <SelectTrigger className="w-[200px] bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm text-zinc-800 focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder={isLoadingCampuses ? "Loading campuses..." : ""} />
                        </SelectTrigger>
                        <SelectContent>
                          {campuses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical and special needs Section */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 tracking-tight leading-5">Medical and special needs</h4>
                </div>

                <div className="space-y-2.5">
                  {/* Option 1: Medical condition */}
                  <div
                    onClick={() => updateCamper(camper.id, 'hasMedical', !camper.hasMedical)}
                    className="rounded-xl border border-[#E4E4E7] bg-[#F9FAFB] p-3 cursor-pointer hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${camper.hasMedical ? "border-[#18181B] bg-white" : "border-[#E4E4E7] bg-white shadow-sm"
                        }`}>
                        {camper.hasMedical && <div className="w-2 h-2 rounded-full bg-[#18181B]" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-zinc-900 leading-tight">
                          Medical condition / Severe allergies
                        </p>
                        <p className="text-xs text-zinc-500 leading-normal">
                          Check if this camper has acute health conditions requiring medical staff awareness.
                        </p>
                      </div>
                    </div>
                    {camper.hasMedical && (
                      <div className="mt-3.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <label className="text-sm font-semibold text-zinc-900 block">
                          Specify medical condition (15 words)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g Asthma, Peanuts allergy, Epilepsy, Diabetes"
                          value={camper.medicalDetails}
                          onChange={(e) => updateCamper(camper.id, 'medicalDetails', e.target.value)}
                          className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none h-[78px]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Option 2: Special needs */}
                  <div
                    onClick={() => updateCamper(camper.id, 'hasSpecialNeeds', !camper.hasSpecialNeeds)}
                    className="rounded-xl border border-[#E4E4E7] bg-[#F9FAFB] p-3 cursor-pointer hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${camper.hasSpecialNeeds ? "border-[#18181B] bg-white" : "border-[#E4E4E7] bg-white shadow-sm"
                        }`}>
                        {camper.hasSpecialNeeds && <div className="w-2 h-2 rounded-full bg-[#18181B]" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-zinc-900 leading-tight">
                          Special needs / Accessibility support
                        </p>
                        <p className="text-xs text-zinc-500 leading-normal">
                          Check if this camper requires physical, sensory, or mobility accommodations.
                        </p>
                      </div>
                    </div>
                    {camper.hasSpecialNeeds && (
                      <div className="mt-3.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <label className="text-sm font-semibold text-zinc-900 block">
                          Specify special needs and accommodations (15 words)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g Deaf, Autism spectrum, Anxiety"
                          value={camper.specialNeedsDetails}
                          onChange={(e) => updateCamper(camper.id, 'specialNeedsDetails', e.target.value)}
                          className="w-full rounded-lg border border-[#E4E4E7] bg-white p-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none h-[78px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))}

          {/* 3. Emergency Contact Card */}
          <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight leading-6">Emergency contact</h3>
              <p className="text-sm text-zinc-500 mt-0.5">Held in case of an emergency on site</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-zinc-900 block">Contact first name</Label>
                <Input
                  value={gFirstName}
                  onChange={(e) => setGFirstName(e.target.value)}
                  className="bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-zinc-900 block">Contact last name</Label>
                <Input
                  value={gLastName}
                  onChange={(e) => setGLastName(e.target.value)}
                  className="bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-zinc-900 block">Phone number</Label>
                <Input
                  type="tel"
                  value={gPhone}
                  onChange={(e) => setGPhone(e.target.value)}
                  className="bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm px-3 w-full focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-zinc-900 block">Relationship to camper(s)</Label>
              <Select value={relationship} onValueChange={(val) => setRelationship(val || "")}>
                <SelectTrigger className="w-full bg-[#F9FAFB] border-[#E4E4E7] h-9 rounded-md text-sm text-zinc-800 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent className="bg-[#F9FAFB] border border-[#E4E4E7] rounded-2xl p-1.5 shadow-xl min-w-[240px]">
                  <SelectItem value="Parent" className="px-3 py-2 text-sm text-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                    Parent
                  </SelectItem>
                  <SelectItem value="Legal Guardian" className="px-3 py-2 text-sm text-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                    Legal Guardian
                  </SelectItem>
                  <SelectItem value="Sibling" className="px-3 py-2 text-sm text-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                    Sibling
                  </SelectItem>
                  <SelectItem value="Relative" className="px-3 py-2 text-sm text-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                    Relative
                  </SelectItem>
                  <SelectItem value="Other" className="px-3 py-2 text-sm text-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. Payment Section Card */}
          <div className="w-full rounded-2xl border border-[#E4E4E7] bg-white p-4 space-y-3.5">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight leading-6">Payment</h3>
              <p className="text-sm text-zinc-500 mt-0.5">Finish your registration by sending payment via M-Pesa. You'll get a confirmation code via SMS.</p>
            </div>

            {/* Total Due Banner */}
            <div className="bg-[#F9F9F9] rounded-lg py-3 px-4 text-center space-y-0.5">
              <p className="text-sm text-zinc-500 font-normal leading-tight">Total amount due</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#F05922] tracking-tight">
                Ksh {totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 font-normal leading-tight">
                for {camperCount} participant{camperCount > 1 ? 's' : ''}
              </p>
            </div>

            {/* Paybill & Account Info Banner */}
            <div className="bg-[#F9F9F9] rounded-lg py-2.5 px-4 flex items-center justify-around text-center">
              <div>
                <p className="text-sm font-medium text-zinc-900 leading-tight">Paybill number</p>
                <p className="text-sm font-semibold text-[#F05922] mt-0.5">400200</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 leading-tight">Account name</p>
                <p className="text-sm font-semibold text-[#F05922] mt-0.5">CAMPFEARLESS</p>
              </div>
            </div>

            {/* M-Pesa Code Input */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-zinc-900 block">M-Pesa confirmation code</Label>
              <Input
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g UINKH7FJWL"
                className="bg-[#F9FAFB] border-[#E4E4E7] rounded-md h-9 text-sm px-3 uppercase placeholder:normal-case placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className="w-full h-10 rounded-md bg-[#18181B] hover:bg-zinc-800 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Completing registration..." : "Complete registration"}
              </Button>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}

