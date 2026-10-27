import { useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Modal, Progress, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { promoters as seedPromoters } from "@/mocks/dashboard";
import { useApp } from "@/store/AppStore";

export default function PromotersPage() {
  const { pushToast } = useApp();
  const [list, setList] = useState(seedPromoters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", rate: "5" });

  const totalSales = list.reduce((sum, item) => sum + item.sales, 0);
  const totalEarned = list.reduce((sum, item) => sum + item.earned, 0);

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="DalaLive Events"
      userRole="Verified organizer · Kisumu"
      initials="DL"
      title="Promoters"
      description="Referral codes, campaign links and promoter commissions"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-foreground-600">
            {formatKsh(totalSales, { compact: true })} tracked sales from {list.length} promoters
          </p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <i className="ri-add-line" /> New promoter
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "Promoter sales", value: formatKsh(totalSales, { compact: true }) },
          { label: "Commission owed", value: formatKsh(totalEarned, { compact: true }) },
          { label: "Clicks tracked", value: formatNumber(list.reduce((sum, item) => sum + item.clicks, 0)) },
          { label: "Tickets attributed", value: formatNumber(list.reduce((sum, item) => sum + item.tickets, 0)) },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">{item.label}</p>
            <p className="mt-1 font-num text-lg font-bold text-foreground-950">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-3 hidden lg:block">
        <TableWrap>
          <thead>
            <tr>
              <Th>Promoter</Th>
              <Th>Code</Th>
              <Th>Rate</Th>
              <Th>Clicks</Th>
              <Th>Sales</Th>
              <Th>Commission</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {list.map((promoter) => (
              <tr key={promoter.id}>
                <Td>
                  <p className="text-xs font-semibold text-foreground-900">{promoter.name}</p>
                  <p className="text-[10px] text-foreground-500">{formatNumber(promoter.tickets)} tickets</p>
                </Td>
                <Td className="font-num text-[11px]">{promoter.code}</Td>
                <Td className="text-xs">{promoter.rate}%</Td>
                <Td className="font-num text-xs">{formatNumber(promoter.clicks)}</Td>
                <Td className="font-num text-xs">{formatKsh(promoter.sales, { compact: true })}</Td>
                <Td className="font-num text-xs font-semibold">{formatKsh(promoter.earned)}</Td>
                <Td>
                  <Badge tone={promoter.status === "Active" ? "success" : "neutral"}>{promoter.status}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`https://dalatickets.co.ke/e/sound-factory-nairobi?ref=${promoter.code}`);
                        pushToast("Referral link copied.", "info");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-primary-700"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() =>
                        setList((current) =>
                          current.map((item) =>
                            item.id === promoter.id
                              ? { ...item, status: item.status === "Active" ? "Paused" : "Active" }
                              : item
                          )
                        )
                      }
                      className="cursor-pointer text-[11px] text-foreground-600"
                    >
                      {promoter.status === "Active" ? "Pause" : "Resume"}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <div className="mt-3 space-y-2.5 lg:hidden">
        {list.map((promoter) => (
          <Card key={promoter.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground-950">{promoter.name}</p>
                <p className="font-num text-[10px] text-foreground-500">{promoter.code} · {promoter.rate}%</p>
              </div>
              <Badge tone={promoter.status === "Active" ? "success" : "neutral"}>{promoter.status}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-num text-xs font-bold text-foreground-950">{formatNumber(promoter.clicks)}</p>
                <p className="text-[9px] text-foreground-500">clicks</p>
              </div>
              <div>
                <p className="font-num text-xs font-bold text-foreground-950">{formatKsh(promoter.sales, { compact: true })}</p>
                <p className="text-[9px] text-foreground-500">sales</p>
              </div>
              <div>
                <p className="font-num text-xs font-bold text-foreground-950">{formatKsh(promoter.earned, { compact: true })}</p>
                <p className="text-[9px] text-foreground-500">earned</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Top performer</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-800">
              NA
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground-950">Nairobi Nightlife Blog</p>
              <p className="text-[10px] text-foreground-500">376 tickets · {formatKsh(940000, { compact: true })} sales</p>
            </div>
            <span className="font-num text-sm font-bold text-accent-700">7%</span>
          </div>
          <div className="mt-3">
            <Progress value={78} tone="accent" />
            <p className="mt-1 text-[10px] text-foreground-500">78% of its monthly target reached</p>
          </div>
        </Card>

        <Card className="border-primary-200 bg-primary-50 p-4">
          <p className="text-sm font-bold text-primary-900">Promoter payouts</p>
          <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
            Promoter commission is calculated on net ticket value (excluding platform commission and
            provider fees). Payouts are included in your monthly settlement statement.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => pushToast("Promoter statement exported.", "success")}
          >
            <i className="ri-download-2-line" /> Export promoter report
          </Button>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create promoter"
        description="Generate a referral code and track sales attributed to it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim() || !form.code.trim()) {
                  pushToast("Add a promoter name and a referral code.", "danger");
                  return;
                }
                setList((current) => [
                  {
                    id: `p-${Date.now()}`,
                    name: form.name,
                    code: form.code.toUpperCase(),
                    rate: Number(form.rate),
                    clicks: 0,
                    sales: 0,
                    tickets: 0,
                    earned: 0,
                    status: "Active",
                  },
                  ...current,
                ]);
                setOpen(false);
                setForm({ name: "", code: "", rate: "5" });
                pushToast("Promoter created and tracking link is ready.", "success");
              }}
            >
              Create promoter
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="promoter-name">Promoter name</Label>
            <Input id="promoter-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Kisumu Riders" />
          </div>
          <div>
            <Label htmlFor="promoter-code">Referral code</Label>
            <Input id="promoter-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="e.g. LAKESIDE" />
          </div>
          <div>
            <Label htmlFor="promoter-rate">Commission rate</Label>
            <Select id="promoter-rate" value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })}>
              <option value="3">3%</option>
              <option value="4">4%</option>
              <option value="5">5%</option>
              <option value="7">7%</option>
              <option value="10">10%</option>
            </Select>
          </div>
          <div className="rounded-md bg-background-100 p-3 text-[11px] leading-relaxed text-foreground-600">
            Promoter commission comes out of your organizer allocation, not the platform commission.
          </div>
        </div>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}