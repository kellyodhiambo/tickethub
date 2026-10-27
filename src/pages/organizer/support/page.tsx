import { useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, TableWrap, Td, Th } from "@/components/base/ui";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { cn } from "@/lib/helpers";
import { useApp } from "@/store/AppStore";

const faqs = [
  {
    q: "When do my earnings become withdrawable?",
    a: "Ticket sales show as pending settlement while the payment provider clears the collection. Once cleared they move to your available balance and you can request a withdrawal, which finance then reviews.",
  },
  {
    q: "How is platform commission calculated?",
    a: "Commission is a percentage of the ticket price, set by the platform admin. On a KSh 1,500 ticket at 10%, KSh 150 goes to the platform and KSh 1,350 to you before provider fees.",
  },
  {
    q: "Why was a duplicate scan rejected?",
    a: "Each QR ticket admits one person once. If the same code is scanned again the scanner turns red and shows the original scan time, gate and staff member.",
  },
  {
    q: "Can gate staff see my revenue?",
    a: "No. Gate staff are invited with scanner-only permissions. They can validate tickets but never see orders, earnings or payouts.",
  },
  {
    q: "How do refunds affect my statement?",
    a: "A refund reverses both your allocation and the platform commission proportionally, and is recorded as a separate ledger entry so reconciliation stays clean.",
  },
];

const supportTickets = [
  { id: "st-1", subject: "Payout destination update", status: "Resolved", updated: "24 Oct 2026", priority: "Normal" },
  { id: "st-2", subject: "Duplicate scan dispute at Gate B", status: "Escalated", updated: "23 Oct 2026", priority: "High" },
  { id: "st-3", subject: "Bulk ticket resend for corporate order", status: "Open", updated: "26 Oct 2026", priority: "Normal" },
];

export default function SupportPage() {
  const { pushToast } = useApp();
  const [open, setOpen] = useState(0);

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Help & support"
      description="Answers, support tickets and direct contact"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-foreground-600">Average first response: 3 hours during business days</p>
          <a href="mailto:support@dalatickets.co.ke">
            <Button size="sm">
              <i className="ri-mail-line" /> Email support
            </Button>
          </a>
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Common questions</p>
          <div className="mt-2 divide-y divide-background-100">
            {faqs.map((item, index) => (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(open === index ? -1 : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left"
                >
                  <span className="text-xs font-semibold text-foreground-950">{item.q}</span>
                  <i className={cn("flex-none text-foreground-400", open === index ? "ri-subtract-line" : "ri-add-line")} />
                </button>
                {open === index && (
                  <p className="animate-fade-up pb-3 text-[11px] leading-relaxed text-foreground-600">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-sm font-bold text-foreground-950">Contact</p>
            <div className="mt-2 space-y-2 text-[11px]">
              <p className="flex items-center gap-2 text-foreground-700">
                <i className="ri-mail-line text-primary-600" /> support@dalatickets.co.ke
              </p>
              <p className="flex items-center gap-2 text-foreground-700">
                <i className="ri-phone-line text-primary-600" /> +254 20 555 0142
              </p>
              <p className="flex items-center gap-2 text-foreground-700">
                <i className="ri-map-pin-line text-primary-600" /> Riverside Drive, Nairobi
              </p>
              <p className="flex items-center gap-2 text-foreground-700">
                <i className="ri-time-line text-primary-600" /> Mon – Sat, 08:00 – 20:00 EAT
              </p>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
              Urgent gate issues during a live event: call the hotline and quote your event ID.
            </p>
          </Card>

          <Card className="border-accent-200 bg-accent-50 p-4">
            <p className="text-sm font-bold text-accent-900">On event day</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Assign at least one scanner per 400 expected guests.",
                "Test scanner devices on venue Wi-Fi 2 hours before doors.",
                "Keep the hotline number saved for gate supervisors.",
                "Use offline mode only when the network is genuinely down.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-accent-900/85">
                  <i className="ri-checkbox-circle-fill mt-0.5 text-accent-600" /> {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground-950">Your support tickets</p>
          <Button size="sm" variant="outline" onClick={() => pushToast("Support ticket created — we will email you.", "success")}>
            <i className="ri-add-line" /> New ticket
          </Button>
        </div>
        <div className="mt-3">
          <TableWrap>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Priority</Th>
                <Th>Last update</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {supportTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <Td className="text-xs font-semibold text-foreground-950">{ticket.subject}</Td>
                  <Td>
                    <Badge tone={ticket.priority === "High" ? "danger" : "neutral"}>{ticket.priority}</Badge>
                  </Td>
                  <Td className="text-xs text-foreground-600">{ticket.updated}</Td>
                  <Td>
                    <Badge tone={ticket.status === "Resolved" ? "success" : ticket.status === "Open" ? "warning" : "danger"}>
                      {ticket.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>
      <Toaster />
    </DashboardShell>
  );
}
