import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import StayReminder from "@/components/feature/StayReminder";
import { Badge, Button, Input, Label, Select } from "@/components/base/ui";
import { cn, formatEventDate, formatKsh } from "@/lib/helpers";
import { tierTheme } from "@/lib/tierTheme";
import { useEvent } from "@/hooks/useEvents";
import { DataError, DataLoading } from "@/components/feature/DataStates";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";

type Stage = "details" | "payment" | "pending" | "success" | "failed";

export default function CheckoutPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pushToast } = useApp();
  const { isAdmin } = useAuth();
  const checkoutTestMode = import.meta.env.DEV || isAdmin;

  const { event, loading, error, reload } = useEvent(slug);
  const tier = event?.tiers.find((item) => item.id === params.get("tier")) ?? event?.tiers[0];
  const requestedQuantity = Number(params.get("qty") ?? 1);
  const quantity = Number.isFinite(requestedQuantity)
    ? Math.min(10, Math.max(1, Math.floor(requestedQuantity)))
    : 1;
  const isFree = tier?.price === 0;

  const [stage, setStage] = useState<Stage>(isFree ? "details" : "details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [failure, setFailure] = useState("");
  const [testPaymentCompleted, setTestPaymentCompleted] = useState(false);

  const subtotal = (tier?.price ?? 0) * quantity;
  const serviceFee = isFree ? 0 : Math.round(subtotal * 0.02);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + serviceFee - discount);
  const commission = Math.round(subtotal * 0.1);

  const attendeeFields = useMemo(() => Array.from({ length: quantity }), [quantity]);

  if (loading) return <PublicLayout><DataLoading label="Loading checkout" /></PublicLayout>;
  if (error) return <PublicLayout><DataError message={error} onRetry={reload} /></PublicLayout>;

  if (!event || !tier) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-xl font-bold">This checkout link has expired</h1>
          <p className="mt-2 text-sm text-foreground-600">Pick your tickets again from the event page.</p>
          <Link to="/discover" className="mt-5 inline-block text-sm font-semibold text-primary-700">
            Back to events
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === "DALA10") {
      setPromoApplied(true);
      pushToast("Promo code applied — 10% off your subtotal.", "success");
    } else {
      setPromoApplied(false);
      pushToast("That promo code is not valid for this event.", "danger");
    }
  };

  const startPayment = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      pushToast("Please fill in your name, email and phone number.", "danger");
      return;
    }
    if (isFree) {
      completeOrder("Complimentary");
      return;
    }
    setStage("payment");
  };

  const completeOrder = (_channel?: string) => {
    setFailure(
      isFree
        ? "Free ticket registration is not connected yet. No ticket has been issued."
        : "Kingdom ticket payments are not connected yet. No payment was collected and no ticket has been issued."
    );
    setStage("failed");
  };

  const payWithMpesa = () => {
    setFailure("Kingdom ticket payments are not connected yet. No payment was collected and no ticket has been issued.");
    setStage("failed");
  };

  const simulatePayment = () => {
    if (!checkoutTestMode) return;
    setTestPaymentCompleted(true);
    setStage("success");
  };

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-10">
        <div className="mb-5 flex items-center gap-2 text-[11px]">
          {[
            { id: "details", label: "Your details" },
            { id: "payment", label: "Payment" },
            { id: "success", label: "Tickets" },
          ].map((step, index) => {
            const order = ["details", "payment", "success"];
            const currentIndex = stage === "pending" || stage === "failed" ? 1 : order.indexOf(stage);
            const active = index <= currentIndex;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    active ? "bg-foreground-950 text-background-50" : "bg-background-200 text-foreground-500"
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn("font-medium", active ? "text-foreground-950" : "text-foreground-500")}>
                  {step.label}
                </span>
                {index < 2 && <span className="mx-1 h-px w-6 bg-background-300" />}
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <div className="mb-4 rounded-card border border-primary-200 bg-primary-50 px-4 py-3">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-primary-900">
                <i className="ri-information-fill mt-0.5" />
                {checkoutTestMode
                  ? "Test mode is enabled. You can simulate the checkout steps, but no payment, order, or ticket will be created."
                  : "Preview only. Kingdom payment collection and ticket issuance are not connected yet. No payment or ticket can be completed here."}
              </p>
            </div>

            {stage === "success" ? (
              <div className="rounded-card border border-accent-300 bg-accent-50 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-background-50">
                  <i className="ri-checkbox-circle-fill text-2xl" />
                </span>
                <h2 className="mt-4 text-xl font-bold text-foreground-950">
                  {testPaymentCompleted ? "Test checkout complete" : isFree ? "Registration confirmed" : "Payment confirmed"}
                </h2>
                <p className="mt-1.5 text-sm text-foreground-700">
                  {testPaymentCompleted
                    ? `The test flow accepted ${quantity} ${tier.name} ticket${quantity > 1 ? "s" : ""} for ${event.title}. This simulation did not charge you, save an order, or issue tickets.`
                    : `${quantity} ${tier.name} ticket${quantity > 1 ? "s" : ""} for ${event.title} have been issued to ${email}. Your QR codes are ready in My Tickets.`}
                </p>
                <dl className="mt-4 grid gap-2 rounded-md border border-accent-200 bg-background-50 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-foreground-500">Amount</dt>
                    <dd className="font-num font-bold text-foreground-950">{isFree ? "Free" : formatKsh(total)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-500">Tickets</dt>
                    <dd className="font-bold text-foreground-950">{quantity} × {tier.name}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-500">Delivery</dt>
                    <dd className="font-bold text-foreground-950">
                      {testPaymentCompleted ? "No ticket issued (test)" : "In-app wallet + email"}
                    </dd>
                  </div>
                </dl>
                {testPaymentCompleted ? (
                  <div className="mt-4 rounded-md border border-primary-200 bg-primary-50 p-3 text-xs text-primary-900">
                    Test result only. There is no ticket to open or scan.
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button onClick={() => navigate("/tickets")}>
                        <i className="ri-ticket-2-line" /> Open my tickets
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/events/${event.slug}`)}>
                        Back to event
                      </Button>
                    </div>
                    <StayReminder
                      className="mt-4"
                      eventTitle={event.title}
                      eventCity={event.city}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-card border border-background-200 bg-background-50 p-4 md:p-5">
                {stage === "details" && (
                  <>
                    <h2 className="text-sm font-bold text-foreground-950">Attendee details</h2>
                    <p className="mt-1 text-[11px] text-foreground-500">
                      We only ask for what the organizer needs at the gate.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <Label htmlFor="fullname">Full name</Label>
                        <Input id="fullname" name="fullname" value={name} onChange={(event) => setName(event.target.value)} />
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor="phone">M-Pesa phone number</Label>
                        <Input id="phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 712 345 678" />
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor="city">City</Label>
                        <Select id="city" name="city" defaultValue={event.city}>
                          <option>{event.city}</option>
                          <option>Nairobi</option>
                          <option>Kisumu</option>
                          <option>Mombasa</option>
                          <option>Nakuru</option>
                          <option>Eldoret</option>
                        </Select>
                      </div>
                    </div>

                    <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-foreground-500">
                      Ticket holders
                    </h3>
                    <div className="mt-2 space-y-2">
                      {attendeeFields.map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-background-100 text-[10px] font-bold text-foreground-700">
                            {index + 1}
                          </span>
                          <Input
                            defaultValue={index === 0 ? name : ""}
                            placeholder={index === 0 ? "Attendee name" : `Attendee ${index + 1} name`}
                            name={`attendee_${index + 1}`}
                            className="h-10"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-md bg-background-100 p-3">
                      <Label htmlFor="promo">Discount code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="promo"
                          name="promo"
                          value={promo}
                          onChange={(event) => setPromo(event.target.value)}
                          placeholder="Try DALA10"
                          className="h-10"
                        />
                        <Button variant="outline" size="sm" className="h-10 flex-none" onClick={applyPromo}>
                          Apply
                        </Button>
                      </div>
                      {promoApplied && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-accent-700">
                          <i className="ri-checkbox-circle-fill" /> 10% discount applied
                        </p>
                      )}
                    </div>

                    <Button block size="lg" className="mt-4" onClick={startPayment}>
                      {isFree ? "Complete free registration" : "Continue to payment"}
                    </Button>
                  </>
                )}

                {(stage === "payment" || stage === "pending" || stage === "failed") && (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-foreground-950">Payment method</h2>
                      <button
                        onClick={() => setStage("details")}
                        className="cursor-pointer text-[11px] font-semibold text-primary-700"
                      >
                        Edit details
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => setMethod("mpesa")}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left",
                          method === "mpesa" ? "border-primary-500 bg-primary-50" : "border-background-200"
                        )}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-100 text-accent-700">
                          <i className="ri-smartphone-line" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-foreground-950">M-Pesa STK Push</span>
                          <span className="block text-[10px] text-foreground-600">
                            A prompt is sent to your phone — enter your PIN to confirm
                          </span>
                        </span>
                        {method === "mpesa" && <i className="ri-checkbox-circle-fill text-primary-600" />}
                      </button>
                      <button
                        onClick={() => setMethod("card")}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left",
                          method === "card" ? "border-primary-500 bg-primary-50" : "border-background-200"
                        )}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-background-100 text-foreground-700">
                          <i className="ri-bank-card-line" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-foreground-950">Card payment</span>
                          <span className="block text-[10px] text-foreground-600">
                            Not configured in this environment — provider setup required
                          </span>
                        </span>
                        <Badge tone="neutral">Soon</Badge>
                      </button>
                    </div>

                    <div className="mt-4 rounded-md bg-background-100 p-3 text-[11px] text-foreground-700">
                      <p className="flex justify-between">
                        <span>Paying with</span>
                        <span className="font-semibold text-foreground-950">{phone}</span>
                      </p>
                      <p className="mt-1 flex justify-between">
                        <span>Amount</span>
                        <span className="font-num font-bold text-foreground-950">{formatKsh(total)}</span>
                      </p>
                    </div>

                    {stage === "pending" && (
                      <div className="mt-4 rounded-md border border-primary-200 bg-primary-50 p-4 text-center">
                        <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
                          <span className="absolute h-10 w-10 animate-pulse-ring rounded-full bg-primary-400/40" />
                          <i className="ri-smartphone-line relative text-xl text-primary-700" />
                        </div>
                        <p className="mt-2 text-xs font-bold text-primary-900">Waiting for M-Pesa confirmation</p>
                        <p className="mt-1 text-[11px] text-primary-800">
                          Check your phone for the STK Push prompt and enter your PIN. Do not close this
                          page.
                        </p>
                      </div>
                    )}

                    {stage === "failed" && (
                      <div className="mt-4 rounded-md border border-primary-300 bg-primary-50 p-3">
                        <p className="text-xs font-bold text-primary-900">Payment could not start</p>
                        <p className="mt-1 text-[11px] text-primary-800">{failure}</p>
                      </div>
                    )}

                    {method === "card" ? (
                      <Button block size="lg" className="mt-4" disabled>
                        Card payments unavailable
                      </Button>
                    ) : checkoutTestMode ? (
                      <Button block size="lg" className="mt-4" onClick={simulatePayment} disabled={stage === "pending"}>
                        <i className="ri-flask-line" /> Continue without STK Push (test only)
                      </Button>
                    ) : (
                      <Button block size="lg" className="mt-4" onClick={payWithMpesa} disabled={stage === "pending"}>
                        {stage === "pending" ? (
                          <>
                            <i className="ri-loader-4-line animate-spin" /> Awaiting confirmation
                          </>
                        ) : (
                          <>
                            <i className="ri-lock-2-line" /> Pay {formatKsh(total)}
                          </>
                        )}
                      </Button>
                    )}
                    <p className="mt-2 text-center text-[10px] text-foreground-500">
                      By paying you accept the organizer&apos;s refund and entry policies.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <div className="rounded-card border border-background-200 bg-background-50 p-4">
              <h2 className="text-sm font-bold text-foreground-950">Order summary</h2>
              <div className="mt-3 flex gap-3 border-b border-background-200 pb-3">
                <div className="h-16 w-16 flex-none overflow-hidden rounded-md">
                  <img
                    src={event.image}
                    alt={event.title}
                    title={event.title}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-xs font-bold text-foreground-950">{event.title}</p>
                  <p className="mt-1 text-[10px] text-foreground-500">
                    {formatEventDate(event.date)} · {event.startTime}
                  </p>
                  <p className="text-[10px] text-foreground-500">
                    {event.venue}, {event.city}
                  </p>
                </div>
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-foreground-600">
                    <span
                      className={cn(
                        "tier-chip rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                        tierTheme(tier.name).root
                      )}
                    >
                      {tier.name}
                    </span>
                    <span>× {quantity}</span>
                  </dt>
                  <dd className="font-num font-semibold text-foreground-900">
                    {subtotal === 0 ? "Free" : formatKsh(subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-600">Service fee (2%)</dt>
                  <dd className="font-num font-semibold text-foreground-900">{formatKsh(serviceFee)}</dd>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-accent-700">
                    <dt>Promo DALA10</dt>
                    <dd className="font-num font-semibold">− {formatKsh(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-background-200 pt-2">
                  <dt className="font-semibold text-foreground-950">Total payable</dt>
                  <dd className="font-num text-base font-extrabold text-foreground-950">
                    {total === 0 ? "Free" : formatKsh(total)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 rounded-md bg-background-100 p-3 text-[10px] leading-relaxed text-foreground-600">
                <p className="flex items-start gap-1.5">
                  <i className="ri-shield-check-line mt-0.5 text-accent-600" />
                  Platform commission of {formatKsh(commission)} (10%) is allocated from this order.
                  Organizer receives {formatKsh(subtotal - commission)} before provider fees.
                </p>
              </div>

              <div className="mt-3 space-y-1.5 text-[10px] text-foreground-500">
                <p className="flex items-center gap-1.5">
                  <i className="ri-refund-2-line" /> {event.refundPolicy}
                </p>
                <p className="flex items-center gap-1.5">
                  <i className="ri-qr-scan-2-line" /> One QR code per ticket, one entry each
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Toaster />
    </PublicLayout>
  );
}
