import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, EmptyState, Input, Label, Modal } from "@/components/base/ui";
import StayReminder from "@/components/feature/StayReminder";
import TicketStub from "@/components/feature/TicketStub";
import { formatEventDate } from "@/lib/helpers";
import { saveTicketImage, saveTicketPdf } from "@/lib/ticketDownload";
import { useEvents } from "@/hooks/useEvents";
import { useApp } from "@/store/AppStore";
import { useAuth } from "@/store/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function TicketDetailPage() {
  const { code } = useParams();
  const { tickets, pushToast } = useApp();
  const { events } = useEvents();
  const { user } = useAuth();
  const [transferOpen, setTransferOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const stubRef = useRef<HTMLDivElement>(null);

  const ticket = tickets.find((item) => item.code === code);
  const event = events.find((item) => item.slug === ticket?.eventSlug);

  if (!ticket || !event) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-4 py-20">
          <EmptyState
            icon="ri-ticket-2-line"
            title="Ticket not found"
            description="This ticket code does not exist in your wallet, or it belongs to another account."
            action={
              <Link to="/tickets">
                <Button>Back to my tickets</Button>
              </Link>
            }
          />
        </div>
      </PublicLayout>
    );
  }

  const handleDownload = async (format: "png" | "pdf") => {
    const node = stubRef.current;
    if (!node || busy) return;
    setBusy(format);
    try {
      const filename = `dala-ticket-${ticket.code}`;
      if (format === "png") {
        await saveTicketImage(node, filename);
        pushToast("Ticket saved as an image.", "success");
      } else {
        await saveTicketPdf(node, filename);
        pushToast("Ticket saved as a PDF.", "success");
      }
    } catch {
      pushToast("Couldn't build that file. Please try the other format.", "danger");
    } finally {
      setBusy(null);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5 md:px-6 md:py-9">
        <Link
          to="/tickets"
          className="mb-4 inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-foreground-600 hover:text-foreground-950"
        >
          <i className="ri-arrow-left-line" /> Back to my tickets
        </Link>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9.5px] font-label font-bold uppercase tracking-[0.26em] text-foreground-500">
              Your ticket
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-tight text-foreground-950 md:text-[34px]">
              {event.title}
            </h1>
            <p className="mt-1 text-[12px] text-foreground-600 md:text-sm">
              {formatEventDate(event.date)} · {event.startTime} · {event.venue}, {event.city}
            </p>
          </div>
          <Badge tone={ticket.status === "Valid" ? "success" : ticket.status === "Used" ? "neutral" : "danger"} dot>
            {ticket.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_318px] lg:items-start">
          <TicketStub ticket={ticket} event={event} nodeRef={stubRef} />

          <div className="space-y-3">
            <div className="rounded-card border border-background-200 bg-background-50 p-4">
              <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-foreground-500">
                Keep a copy
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-600">
                Save the ticket exactly as it looks here — image for your photos, PDF for printing.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => handleDownload("png")} disabled={busy !== null}>
                  {busy === "png" ? (
                    <i className="ri-loader-4-line animate-spin" />
                  ) : (
                    <i className="ri-image-2-line" />
                  )}
                  Image
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload("pdf")}
                  disabled={busy !== null}
                >
                  {busy === "pdf" ? (
                    <i className="ri-loader-4-line animate-spin" />
                  ) : (
                    <i className="ri-file-pdf-2-line" />
                  )}
                  PDF
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(ticket.code);
                    pushToast("Ticket code copied.", "info");
                  }}
                >
                  <i className="ri-file-copy-line" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTransferOpen(true)}
                  disabled
                >
                  <i className="ri-share-forward-line" /> Transfer
                </Button>
              </div>
              <button
                onClick={async () => {
                  if (!user?.id || !ticket.eventId || !ticket.price) { pushToast("Could not verify the paid amount for this ticket.", "danger"); return; }
                  const { error } = await supabase.from("ticket_refund_requests").insert({ ticket_id: ticket.id, user_id: user.id, event_id: ticket.eventId, reason: "Customer requested refund", amount: ticket.price });
                  if (error) pushToast(error.message, "danger"); else pushToast("Refund request submitted for organizer review.", "success");
                }}
                className="mt-1 w-full cursor-pointer rounded-btn py-1.5 text-[10.5px] font-semibold text-foreground-500 transition-colors hover:bg-background-100 hover:text-foreground-900"
              >
                <i className="ri-refund-2-line mr-1" /> Request refund
              </button>
            </div>

            <div className="rounded-card border border-background-200 bg-background-50 p-4">
              <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-foreground-500">
                Before you arrive
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-foreground-600">
                <li className="flex gap-1.5">
                  <i className="ri-check-line text-accent-600" /> {event.ageLimit}
                </li>
                <li className="flex gap-1.5">
                  <i className="ri-check-line text-accent-600" /> {event.requirements}
                </li>
                <li className="flex gap-1.5">
                  <i className="ri-check-line text-accent-600" /> Gates open 60 minutes before the start
                </li>
                <li className="flex gap-1.5">
                  <i className="ri-check-line text-accent-600" /> Screenshots of the QR code do not work
                  twice
                </li>
              </ul>
            </div>

            <StayReminder eventTitle={event.title} eventCity={event.city} />

            {ticket.status === "Used" && (
              <div className="flex items-start gap-2 rounded-md border border-background-300 bg-background-100 p-3 text-[11px] text-foreground-700">
                <i className="ri-check-double-line mt-0.5 text-foreground-500" />
                This ticket was scanned at {ticket.gate} on {ticket.scannedAt}. It cannot be used again.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-card border border-primary-200 bg-primary-50 p-4">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-primary-900">
            <i className="ri-information-fill mt-0.5" />
            This ticket was issued after a confirmed payment. Keep the QR code private; entry validation checks its current state.
          </p>
        </div>
      </div>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Request a ticket transfer"
        description="The organizer must allow transfers for this event. A new QR code is issued and the old one is cancelled."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!recipient.trim()) {
                  pushToast("Enter the recipient's email or phone number.", "danger");
                  return;
                }
                setTransferOpen(false);
                setRecipient("");
                pushToast("Transfer request sent — the recipient must accept it first.", "success");
              }}
            >
              Send request
            </Button>
          </>
        }
      >
        <Label htmlFor="recipient">Recipient email or phone</Label>
        <Input
          id="recipient"
          value={recipient}
          onChange={(inputEvent) => setRecipient(inputEvent.target.value)}
          placeholder="name@example.co.ke or +254 7xx xxx xxx"
        />
        <p className="mt-2 text-[11px] text-foreground-500">
          This ticket cannot be transferred once it has been scanned at the gate.
        </p>
      </Modal>
      <Toaster />
    </PublicLayout>
  );
}
