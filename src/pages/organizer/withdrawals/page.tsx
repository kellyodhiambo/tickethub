import { useEffect, useState } from "react";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Input, Label, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh } from "@/lib/helpers";
import { organizerMobileNav, organizerNav } from "@/pages/organizer/nav";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/AuthProvider";
import { useApp } from "@/store/AppStore";

type WithdrawalRow = { id: string; reference: string; amount: number; method: string; destination: string; requested_at: string; status: string; note: string | null };

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const { pushToast } = useApp();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (!user?.id) return;
    void supabase.from("organizer_withdrawals").select("id,reference,amount,method,destination,requested_at,status,note").eq("organizer_id", user.id).order("requested_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        else setWithdrawals((data ?? []) as WithdrawalRow[]);
      });
  }, [user?.id]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("M-Pesa");
  const [destination, setDestination] = useState("");
  const [confirmCode, setConfirmCode] = useState("");

  const pending = withdrawals.filter((item) => item.status === "Pending" || item.status === "Processing");
  const completed = withdrawals.filter((item) => item.status === "Completed");

  const submit = () => {
    const value = Number(amount);
    if (!value || value < 1000) {
      pushToast("The minimum withdrawal is KSh 1,000.", "danger");
      return;
    }
    if (value > 0) {
      pushToast("That exceeds your available balance.", "danger");
      return;
    }
    if (confirmCode.trim().toUpperCase() !== "WITHDRAW") {
      pushToast("Type WITHDRAW to confirm this financial action.", "danger");
      return;
    }
    pushToast("Payout requests are disabled until the payment settlement API is connected.", "warning");
    setOpen(false);
    setConfirmCode("");
    pushToast("Withdrawal requested — finance will review and settle it.", "success");
  };

  return (
    <DashboardShell
      variant="organizer"
      nav={organizerNav}
      mobileNav={organizerMobileNav}
      userName="Organizer"
      userRole="Organizer"
      initials="OR"
      title="Withdrawals"
      description="Move cleared earnings to M-Pesa or a bank account"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-foreground-600">
            Payout requests are disabled until payment settlement is connected
          </p>
          <Button size="sm" disabled title="Available after Kingdom settlement is connected" onClick={() => setOpen(true)}>
            <i className="ri-add-line" /> Request withdrawal
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-4">
          <p className="text-[11px] font-label font-semibold uppercase tracking-wider text-foreground-500">
            Available to withdraw
          </p>
          <p className="mt-1 font-num text-3xl font-extrabold text-foreground-950">
            Unavailable
          </p>
          <p className="mt-1 text-[11px] text-foreground-500">
            Settlement balances are not available until Kingdom confirms cleared funds.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled title="Available after Kingdom settlement is connected" onClick={() => setOpen(true)}>
              Withdraw to M-Pesa
            </Button>
            <Button disabled title="Available after Kingdom settlement is connected"
              size="sm"
              variant="outline"
              onClick={() => {
                setMethod("Bank transfer");
                setOpen(true);
              }}
            >
              Withdraw to bank
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-foreground-950">Payout account</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between rounded-md border border-background-200 p-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground-900">M-Pesa</p>
                <p className="text-[10px] text-foreground-500">No payout account is saved</p>
              </div>
              <Badge tone="neutral">Not configured</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-background-200 p-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground-900">Bank transfer</p>
                <p className="text-[10px] text-foreground-500">Available when bank settlement is connected</p>
              </div>
              <Badge tone="neutral">Not configured</Badge>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
            Payout destinations must match the verified organizer name. Mismatched accounts are rejected
            by finance.
          </p>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "Pending requests", value: String(pending.length) },
          { label: "Pending amount", value: formatKsh(pending.reduce((sum, item) => sum + Number(item.amount), 0), { compact: true }) },
          { label: "Completed payouts", value: String(completed.length) },
          { label: "Lifetime withdrawn", value: formatKsh(completed.reduce((sum, item) => sum + Number(item.amount), 0), { compact: true }) },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-foreground-500">{item.label}</p>
            <p className="mt-1 font-num text-lg font-bold text-foreground-950">{item.value}</p>
          </Card>
        ))}
      </div>

      {loadError && <p role="alert" className="mt-3 text-sm text-accent-700">Could not load payout history: {loadError}</p>}
      <div className="mt-3">
        <TableWrap>
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Amount</Th>
              <Th>Method</Th>
              <Th>Destination</Th>
              <Th>Requested</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((item) => (
              <tr key={item.id}>
                <Td className="font-num text-xs font-semibold text-foreground-950">{item.reference}</Td>
                <Td className="font-num text-xs font-semibold">{formatKsh(item.amount)}</Td>
                <Td className="text-xs">{item.method}</Td>
                <Td className="text-xs text-foreground-600">{item.destination}</Td>
                <Td className="text-xs text-foreground-600">{new Date(item.requested_at).toLocaleString()}</Td>
                <Td>
                  <Badge tone={item.status === "Completed" ? "success" : item.status === "Rejected" ? "danger" : "warning"}>
                    {item.status}
                  </Badge>
                  {item.note && <p className="mt-1 text-[10px] text-foreground-500">{item.note}</p>}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <Card className="mt-3 border-primary-200 bg-primary-50 p-4">
        <p className="text-xs font-bold text-primary-900">How settlements work</p>
        <p className="mt-1 text-[11px] leading-relaxed text-primary-800">
          Ticket sales first appear as pending settlement while the payment provider clears the
          collection. Once cleared, funds move to your available balance and you can request a
          withdrawal. Payouts are executed only after finance approval and can be rejected if the
          destination does not match your verified details.
        </p>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a withdrawal"
        description="Financial action — requires confirmation and finance approval."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Submit request</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="amount">Amount (KSh)</Label>
            <Input id="amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" />
            <p className="mt-1 text-[10px] text-foreground-500">
              Settlement API pending · minimum KSh 1,000
            </p>
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <Select id="method" value={method} onChange={(event) => setMethod(event.target.value)}>
              <option>M-Pesa</option>
              <option>Bank transfer</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={method === "M-Pesa" ? "+254 7xx xxx xxx" : "Bank account number"}
            />
          </div>
          <div className="rounded-md bg-background-100 p-3 text-[11px] leading-relaxed text-foreground-600">
            Withdrawals are reviewed by platform finance. You will see the real status here — pending,
            processing, completed or rejected.
          </div>
          <div>
            <Label htmlFor="confirm">Type WITHDRAW to confirm</Label>
            <Input id="confirm" value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} placeholder="WITHDRAW" />
          </div>
        </div>
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}

