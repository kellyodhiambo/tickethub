import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Progress, Select, Textarea } from "@/components/base/ui";
import PosterUploader from "@/pages/organizer/events/new/components/PosterUploader";
import { cn, formatKsh } from "@/lib/helpers";
import { createEvent } from "@/lib/eventsApi";
import { uploadEventPoster, validatePoster } from "@/lib/storage";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { cities, eventCategories } from "@/mocks/events";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";

const steps = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Schedule" },
  { id: 3, label: "Tickets" },
  { id: 4, label: "Policies" },
  { id: 5, label: "Review" },
];

type TierDraft = {
  id: number;
  name: string;
  price: string;
  quantity: string;
  salesEnd: string;
  maxPerOrder: string;
  description: string;
};

const samplePosters = [
  "https://readdy.ai/api/search-image?query=editorial%20photograph%20of%20a%20packed%20open%20air%20concert%20stage%20at%20night%20in%20Kenya%2C%20warm%20amber%20lights%2C%20crowd%20silhouettes%2C%20premium%20event%20photography%2C%20high%20detail%2C%20no%20text&width=800&height=500&seq=dala-cover-1&orientation=landscape",
  "https://readdy.ai/api/search-image?query=editorial%20photograph%20of%20a%20daytime%20Kenyan%20festival%20with%20colourful%20canopies%20and%20families%20on%20a%20green%20lawn%2C%20warm%20sunlight%2C%20premium%20documentary%20photography%2C%20high%20detail%2C%20no%20text&width=800&height=500&seq=dala-cover-2&orientation=landscape",
  "https://readdy.ai/api/search-image?query=editorial%20photograph%20of%20an%20intimate%20comedy%20and%20spoken%20word%20stage%20in%20a%20Nairobi%20venue%2C%20single%20spotlight%2C%20dark%20warm%20room%2C%20premium%20event%20photography%2C%20high%20detail%2C%20no%20text&width=800&height=500&seq=dala-cover-3&orientation=landscape",
  "https://readdy.ai/api/search-image?query=editorial%20photograph%20of%20a%20professional%20conference%20hall%20in%20Nairobi%20with%20a%20speaker%20on%20stage%20and%20attentive%20delegates%2C%20clean%20neutral%20lighting%2C%20corporate%20photography%2C%20high%20detail%2C%20no%20text&width=800&height=500&seq=dala-cover-4&orientation=landscape",
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { pushToast } = useApp();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterError, setPosterError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Concerts",
    description: "",
    cover: "",
    date: "2026-12-19",
    startTime: "19:00",
    endTime: "02:00",
    venue: "",
    city: "Nairobi",
    address: "",
    mapLink: "",
  });
  const [tiers, setTiers] = useState<TierDraft[]>([
    { id: 1, name: "Early Bird", price: "1500", quantity: "500", salesEnd: "2026-12-01", maxPerOrder: "4", description: "Lowest price, limited release." },
    { id: 2, name: "Regular", price: "2500", quantity: "1500", salesEnd: "2026-12-18", maxPerOrder: "8", description: "General admission." },
  ]);
  const [policy, setPolicy] = useState({
    refund: "Full refund if cancelled or rescheduled by the organizer.",
    age: "18+",
    requirements: "Photo ID required at the gate",
    terms: false,
    cancellation: "Cancel up to 7 days before the event for a transfer or partial refund.",
  });

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const selectPoster = (file: File) => {
    const problem = validatePoster(file);
    if (problem) {
      setPosterError(problem);
      pushToast(problem, "danger");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPosterError(null);
    setPosterFile(file);
    setPosterPreview(url);
    update("cover", url);
  };

  const clearPoster = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPosterFile(null);
    setPosterPreview(null);
    setPosterError(null);
    update("cover", "");
  };

  const chooseSample = (url: string) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPosterFile(null);
    setPosterPreview(null);
    setPosterError(null);
    update("cover", url);
  };
  const updateTier = (id: number, key: keyof TierDraft, value: string) =>
    setTiers((current) => current.map((tier) => (tier.id === id ? { ...tier, [key]: value } : tier)));

  const invalid = () => {
    if (step === 1 && (!form.title.trim() || form.description.trim().length < 20)) return "Add an event title and a description of at least 20 characters.";
    if (step === 1 && !form.cover) return "Upload the event poster — it becomes the background and the ticket artwork.";
    if (step === 2 && (!form.venue.trim() || !form.address.trim())) return "Add the venue and address so guests can find you.";
    if (step === 3 && tiers.some((tier) => !tier.name.trim() || Number(tier.price) < 0 || Number(tier.quantity) <= 0)) return "Every ticket category needs a name, a price and available quantity.";
    if (step === 4 && !policy.terms) return "Accept the organizer terms and commission disclosure to continue.";
    return "";
  };

  const next = () => {
    const problem = invalid();
    if (problem) {
      pushToast(problem, "danger");
      return;
    }
    setStep((value) => Math.min(5, value + 1));
  };

  const projectedRevenue = tiers.reduce((sum, tier) => sum + Number(tier.price || 0) * Number(tier.quantity || 0), 0);
  const commission = Math.round(projectedRevenue * 0.1);

  const publish = async (mode: "publish" | "draft") => {
    if (saving) return;
    if (!form.title.trim()) {
      pushToast("Add an event title first.", "danger");
      setStep(1);
      return;
    }
    if (!form.cover) {
      pushToast("Upload the event poster before continuing.", "danger");
      setStep(1);
      return;
    }
    if (!user) {
      pushToast("Sign in as an organizer to save this event.", "danger");
      navigate("/signin");
      return;
    }

    setSaving(true);
    try {
      let coverImage = form.cover.startsWith("blob:") ? "" : form.cover;
      if (posterFile) {
        coverImage = await uploadEventPoster(posterFile, user.id);
      }
      if (!coverImage) throw new Error("The poster did not finish uploading. Please try again.");

      const created = await createEvent({
        title: form.title,
        category: form.category,
        description: form.description,
        coverImage,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        venue: form.venue,
        city: form.city,
        address: form.address,
        organizerId: user.id,
        organizerName: profile?.full_name || profile?.email || "Organizer",
        verified: Boolean(profile?.verified),
        tiers: tiers.map((tier) => ({
          name: tier.name.trim() || "General",
          price: Number(tier.price || 0),
          quantity: Number(tier.quantity || 0),
          salesEnd: tier.salesEnd,
          maxPerOrder: Number(tier.maxPerOrder || 6),
          description: tier.description,
        })),
        refundPolicy: policy.refund,
        cancellation: policy.cancellation,
        ageLimit: policy.age,
        requirements: policy.requirements,
        status: mode === "publish" ? "upcoming" : "draft",
      });

      pushToast(
        mode === "publish"
          ? "Event published — your poster is live on the marketplace and on every ticket."
          : "Draft saved with your poster. Publish whenever you are ready.",
        "success"
      );
      navigate(mode === "publish" ? `/events/${created.slug}` : "/organizer/events");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Could not save the event. Please try again.", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Create event"
      description="Guided setup — publish in five short steps"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {steps.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStep(item.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    step === item.id
                      ? "bg-foreground-950 text-background-50"
                      : step > item.id
                      ? "bg-accent-100 text-accent-900"
                      : "bg-background-100 text-foreground-500"
                  )}
                >
                  <span className="font-num">{step > item.id ? "✓" : item.id}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Progress value={(step / 5) * 100} />
            </div>

            <div className="mt-5">
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title">Event title</Label>
                    <Input id="title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Kisumu Sound Festival" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select id="category" value={form.category} onChange={(event) => update("category", event.target.value)}>
                        {eventCategories.map((item) => (
                          <option key={item.id} value={item.label}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="organizer">Organizer</Label>
                      <Input id="organizer" value="DalaLive Events (verified)" readOnly className="bg-background-100" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(event) => update("description", event.target.value)}
                      placeholder="What makes this event worth attending? Line-up, vibe, what is included…"
                      maxLength={500}
                    />
                    <p className="mt-1 text-[10px] text-foreground-500">{form.description.length}/500 characters</p>
                  </div>
                  <div>
                    <Label>Event poster</Label>
                    <PosterUploader
                      file={posterFile}
                      previewUrl={posterPreview}
                      fallbackUrl={form.cover}
                      onSelect={selectPoster}
                      onClear={clearPoster}
                      error={posterError}
                    />
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-500">
                        No poster yet? Start from a sample
                      </p>
                      <div className="mt-1.5 grid grid-cols-4 gap-2">
                        {samplePosters.map((cover) => (
                          <button
                            key={cover}
                            type="button"
                            onClick={() => chooseSample(cover)}
                            className={cn(
                              "h-14 w-full cursor-pointer overflow-hidden rounded-md border-2",
                              form.cover === cover && !posterFile
                                ? "border-primary-500"
                                : "border-transparent hover:border-background-300"
                            )}
                          >
                            <img src={cover} alt="Sample event poster" className="h-full w-full object-cover object-top" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="date">Event date</Label>
                      <Input id="date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="start">Start time</Label>
                      <Input id="start" type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="end">End time</Label>
                      <Input id="end" type="time" value={form.endTime} onChange={(event) => update("endTime", event.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="venue">Venue</Label>
                      <Input id="venue" value={form.venue} onChange={(event) => update("venue", event.target.value)} placeholder="e.g. Dunga Beach" />
                    </div>
                    <div>
                      <Label htmlFor="city">City / town</Label>
                      <Select id="city" value={form.city} onChange={(event) => update("city", event.target.value)}>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Street, building, landmark" />
                  </div>
                  <div>
                    <Label htmlFor="map">Map link (optional)</Label>
                    <Input id="map" value={form.mapLink} onChange={(event) => update("mapLink", event.target.value)} placeholder="https://maps.google.com/…" />
                  </div>
                  <div className="rounded-md bg-background-100 p-3 text-[11px] leading-relaxed text-foreground-600">
                    <i className="ri-time-line mr-1 text-primary-600" />
                    Times are shown in East Africa Time (EAT, UTC+3). Gates usually open 60 minutes before
                    the start time — you can adjust this later.
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground-950">Ticket categories</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTiers((current) => [
                          ...current,
                          {
                            id: Date.now(),
                            name: "",
                            price: "",
                            quantity: "",
                            salesEnd: form.date,
                            maxPerOrder: "6",
                            description: "",
                          },
                        ])
                      }
                    >
                      <i className="ri-add-line" /> Add category
                    </Button>
                  </div>

                  {tiers.map((tier) => (
                    <div key={tier.id} className="rounded-md border border-background-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Input
                            value={tier.name}
                            onChange={(event) => updateTier(tier.id, "name", event.target.value)}
                            placeholder="Category name (e.g. VIP)"
                            className="h-9 text-xs font-semibold"
                          />
                        </div>
                        <button
                          onClick={() => setTiers((current) => current.filter((item) => item.id !== tier.id))}
                          className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-md border border-primary-300 text-primary-700 hover:bg-primary-50"
                          aria-label="Remove category"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <Label>Price (KSh)</Label>
                          <Input value={tier.price} onChange={(event) => updateTier(tier.id, "price", event.target.value)} className="h-9 text-xs" inputMode="numeric" />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input value={tier.quantity} onChange={(event) => updateTier(tier.id, "quantity", event.target.value)} className="h-9 text-xs" inputMode="numeric" />
                        </div>
                        <div>
                          <Label>Sales close</Label>
                          <Input type="date" value={tier.salesEnd} onChange={(event) => updateTier(tier.id, "salesEnd", event.target.value)} className="h-9 text-xs" />
                        </div>
                        <div>
                          <Label>Max / order</Label>
                          <Input value={tier.maxPerOrder} onChange={(event) => updateTier(tier.id, "maxPerOrder", event.target.value)} className="h-9 text-xs" inputMode="numeric" />
                        </div>
                      </div>
                      <Input
                        value={tier.description}
                        onChange={(event) => updateTier(tier.id, "description", event.target.value)}
                        placeholder="Short description shown to buyers"
                        className="mt-2 h-9 text-xs"
                      />
                      <p className="mt-1.5 text-[10px] text-foreground-500">
                        Potential gross for this category:{" "}
                        <span className="font-num font-semibold text-foreground-800">
                          {formatKsh(Number(tier.price || 0) * Number(tier.quantity || 0))}
                        </span>{" "}
                        · commission {formatKsh(Number(tier.price || 0) * Number(tier.quantity || 0) * 0.1)}
                      </p>
                    </div>
                  ))}
                  <p className="text-[11px] text-foreground-500">
                    Inventory is enforced server-side at purchase time in production, so a category can
                    never be oversold even with simultaneous checkouts.
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="refund">Refund policy</Label>
                    <Textarea id="refund" value={policy.refund} onChange={(event) => setPolicy({ ...policy, refund: event.target.value })} maxLength={300} />
                  </div>
                  <div>
                    <Label htmlFor="cancel">Cancellation terms</Label>
                    <Textarea id="cancel" value={policy.cancellation} onChange={(event) => setPolicy({ ...policy, cancellation: event.target.value })} maxLength={300} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="age">Age restriction</Label>
                      <Select id="age" value={policy.age} onChange={(event) => setPolicy({ ...policy, age: event.target.value })}>
                        <option>All ages</option>
                        <option>16+</option>
                        <option>18+</option>
                        <option>21+</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="req">Entry requirements</Label>
                      <Input id="req" value={policy.requirements} onChange={(event) => setPolicy({ ...policy, requirements: event.target.value })} />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border border-background-300 p-3">
                    <input
                      type="checkbox"
                      checked={policy.terms}
                      onChange={(event) => setPolicy({ ...policy, terms: event.target.checked })}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-[oklch(var(--primary-500))]"
                    />
                    <span className="text-[11px] leading-relaxed text-foreground-700">
                      I accept the organizer terms, the 10% platform commission and my responsibility for
                      refunds, entry rules and attendee safety at this event.
                    </span>
                  </label>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-md border border-background-200">
                    <div className="h-28 w-full bg-foreground-950">
                      {form.cover ? (
                        <img src={form.cover} alt={form.title || "Event poster"} className="h-full w-full object-cover object-top" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/60">
                          <i className="ri-image-line text-lg" />
                          <span className="text-[10px] uppercase tracking-[0.16em]">No poster uploaded yet</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-foreground-950">{form.title || "Untitled event"}</p>
                      <p className="mt-1 text-[11px] text-foreground-500">
                        {form.date} · {form.startTime} — {form.endTime} · {form.venue || "Venue TBC"}, {form.city}
                      </p>
                      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-foreground-600">
                        {form.description || "No description yet."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-bold text-foreground-950">Ticket categories</p>
                    <div className="space-y-1.5">
                      {tiers.map((tier) => (
                        <div key={tier.id} className="flex items-center justify-between rounded-md bg-background-100 px-3 py-2">
                          <span className="text-[11px] font-semibold text-foreground-900">{tier.name || "Unnamed"}</span>
                          <span className="font-num text-[11px] text-foreground-700">
                            {formatKsh(Number(tier.price || 0))} × {tier.quantity || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-accent-200 bg-accent-50 p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-accent-900/80">Projected gross</span>
                      <span className="font-num font-bold text-accent-900">{formatKsh(projectedRevenue)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-accent-900/80">Platform commission (10%)</span>
                      <span className="font-num font-bold text-primary-800">− {formatKsh(commission)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-accent-200 pt-1 text-[11px]">
                      <span className="text-accent-900/80">Your allocation before fees</span>
                      <span className="font-num font-extrabold text-accent-900">{formatKsh(projectedRevenue - commission)}</span>
                    </div>
                  </div>

                  {!user && (
                    <div className="flex items-start gap-2 rounded-md border border-primary-200 bg-primary-50 p-3 text-[11px] leading-relaxed text-primary-900">
                      <i className="ri-lock-line mt-px text-[13px]" />
                      <span>
                        You need an organizer account to save this event.{" "}
                        <Link to="/signin" className="font-bold underline">
                          Sign in
                        </Link>{" "}
                        or{" "}
                        <Link to="/signup" className="font-bold underline">
                          create one
                        </Link>
                        .
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button block onClick={() => publish("publish")} disabled={saving}>
                      {saving ? (
                        <>
                          <i className="ri-loader-4-line animate-spin" /> Uploading poster…
                        </>
                      ) : (
                        <>
                          <i className="ri-send-plane-line" /> Publish event
                        </>
                      )}
                    </Button>
                    <Button block variant="outline" onClick={() => publish("draft")} disabled={saving}>
                      Save as draft
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-background-200 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
                <i className="ri-arrow-left-line" /> Back
              </Button>
              {step < 5 && (
                <Button size="sm" onClick={next}>
                  Continue <i className="ri-arrow-right-line" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card className="p-4">
            <p className="text-xs font-bold text-foreground-950">What happens next</p>
            <ol className="mt-2 space-y-2">
              {[
                "We check the event for moderation — usually within an hour.",
                "Your event goes live on Discover with ticket categories.",
                "Buyers pay with M-Pesa and tickets are issued automatically.",
                "You scan guests in with the gate scanner and track attendance.",
              ].map((item, index) => (
                <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-foreground-600">
                  <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-background-100 text-[9px] font-bold text-foreground-700">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-bold text-foreground-950">Commission snapshot</p>
            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-foreground-600">Default rate</span>
                <span className="font-semibold text-foreground-900">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-600">Your override</span>
                <Badge tone="neutral">None</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-600">Settlement</span>
                <span className="font-semibold text-foreground-900">T+2 business days</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
              Rates are set by the platform admin. Event-specific rates require approval before they
              apply.
            </p>
          </Card>

          <Card className="border-primary-200 bg-primary-50 p-4">
            <p className="text-[11px] font-bold text-primary-900">Tip</p>
            <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
              Add an Early Bird category with a hard sales cut-off — events with a visible deadline sell
              out roughly 30% faster.
            </p>
          </Card>
        </aside>
      </div>
      <Toaster />
    </DashboardShell>
  );
}