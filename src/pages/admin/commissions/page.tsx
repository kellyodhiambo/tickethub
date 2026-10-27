import { useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh } from "@/lib/helpers";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import { commissionRules } from "@/mocks/admin";
import { useApp } from "@/store/AppStore";

export default function CommissionsPage() {
  const { pushToast } = useApp();
  const [rules, setRules] = useState(commissionRules);
  const [defaultRate, setDefaultRate] = useState("10");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newRule, setNewRule] = useState({ scope: "Organizer override", target: "", rate: "9" });

  const samplePrice = 1500;
  const rate = Number(defaultRate);
  const commission = Math.round((samplePrice * rate) / 100);

  return (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      mobileNav={adminMobileNav}
      userName="Platform Admin"
      userRole="Super admin · Nairobi"
      initials="PA"
      title="Commission"
      description="Default rates, organizer overrides and event-specific approvals"
      actions={
        <p className="text-[11px] text-foreground-600">
          Changes apply to new orders only and are recorded in the audit log
        </p>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Platform default rate</p>
          <p className="mt-1 text-[11px] text-foreground-500">
            Applied to every organizer unless an approved override exists.
          </p>
          <div className="mt-3 flex items-end gap-2">
            <div className="w-32">
              <Label htmlFor="default-rate">Rate (%)</Label>
              <Input id="default-rate" value={defaultRate} onChange={(event) => setDefaultRate(event.target.value)} inputMode="numeric" />
            </div>
            <Button onClick={() => setConfirmOpen(true)}>Review change</Button>
          </div>
          <div className="mt-3 rounded-md bg-background-100 p-3">
            <p className="text-[11px] font-semibold text-foreground-900">Worked example</p>
            <div className="mt-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-foreground-600">Ticket price</span>
                <span className="font-num font-semibold">{formatKsh(samplePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-600">Platform commission ({rate}%)</span>
                <span className="font-num font-semibold text-primary-700">{formatKsh(commission)}</span>
              </div>
              <div className="flex justify-between border-t border-background-200 pt-1">
                <span className="text-foreground-600">Organizer allocation</span>
                <span className="font-num font-bold text-accent-700">{formatKsh(samplePrice - commission)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Add an override</p>
          <p className="mt-1 text-[11px] text-foreground-500">
            Overrides require approval and are disclosed to the organizer before publishing.
          </p>
          <div className="mt-3 space-y-2">
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Select id="scope" value={newRule.scope} onChange={(event) => setNewRule({ ...newRule, scope: event.target.value })}>
                <option>Organizer override</option>
                <option>Event override</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="target">Target</Label>
              <Input id="target" value={newRule.target} onChange={(event) => setNewRule({ ...newRule, target: event.target.value })} placeholder="Organizer or event name" />
            </div>
            <div>
              <Label htmlFor="rate">Rate (%)</Label>
              <Input id="rate" value={newRule.rate} onChange={(event) => setNewRule({ ...newRule, rate: event.target.value })} inputMode="numeric" />
            </div>
            <Button
              block
              variant="outline"
              onClick={() => {
                if (!newRule.target.trim()) {
                  pushToast("Choose the organizer or event this override applies to.", "danger");
                  return;
                }
                setRules((current) => [
                  {
                    id: `cr-${Date.now()}`,
                    scope: newRule.scope,
                    target: newRule.target,
                    rate: Number(newRule.rate),
                    updated: "2026-10-27",
                    updatedBy: "Platform admin",
                  },
                  ...current,
                ]);
                setNewRule({ scope: "Organizer override", target: "", rate: "9" });
                pushToast("Override added — it applies to new orders only.", "success");
              }}
            >
              <i className="ri-add-line" /> Add override
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-3 p-4">
        <p className="text-sm font-bold text-foreground-950">Active commission rules</p>
        <div className="mt-3">
          <TableWrap>
            <thead>
              <tr>
                <Th>Scope</Th>
                <Th>Target</Th>
                <Th>Rate</Th>
                <Th>Updated</Th>
                <Th>Updated by</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <Td className="text-xs">{rule.scope}</Td>
                  <Td className="text-xs font-semibold text-foreground-950">{rule.target}</Td>
                  <Td>
                    <Badge tone={rule.rate === 0 ? "neutral" : rule.rate >= 10 ? "warning" : "success"}>{rule.rate}%</Badge>
                  </Td>
                  <Td className="text-xs text-foreground-600">{rule.updated}</Td>
                  <Td className="text-xs text-foreground-600">{rule.updatedBy}</Td>
                  <Td>
                    <button
                      onClick={() => pushToast("Override removal requires a second admin approval.", "warning")}
                      className="cursor-pointer text-[11px] font-semibold text-primary-700"
                    >
                      Remove
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>

      <Card className="mt-3 border-primary-200 bg-primary-50 p-4">
        <p className="text-xs font-bold text-primary-900">Settlement model caveat</p>
        <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
          A standard M-Pesa collection does not automatically split a payment between the platform and
          organizers. Confirm the approved settlement arrangement with the payment provider before
          enabling live payouts, and never mark organizer funds as settled on a successful ticket sale
          alone.
        </p>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Change the platform commission?"
        description="This affects every new order across the marketplace."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                pushToast(`Default commission updated to ${rate}%.`, "success");
              }}
            >
              Confirm change
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs">
          <p className="leading-relaxed text-foreground-700">
            New default rate <strong>{rate}%</strong>. On a KSh 1,500 ticket the platform earns{" "}
            {formatKsh(commission)} and the organizer receives {formatKsh(samplePrice - commission)}.
          </p>
          <p className="rounded-md bg-background-100 p-2.5 text-[11px] leading-relaxed text-foreground-600">
            Existing orders keep the rate that was applied when they were created. Event-specific
            overrides continue to take precedence.
          </p>
        </div>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}