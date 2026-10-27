import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, Modal, Select, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import {
  adminEvents,
  adminOrganizers,
  adminPayouts,
  adminRefunds,
  adminTransactions,
  adminUsers,
} from "@/mocks/admin";
import { useApp } from "@/store/AppStore";

type Column = { label: string; key: string; money?: boolean; number?: boolean };

type Config = {
  title: string;
  description: string;
  columns: Column[];
  rows: Record<string, string | number>[];
  searchKeys: string[];
  action?: "approve" | "moderate" | "none";
};

const configs: Record<string, Config> = {
  users: {
    title: "Users",
    description: "Attendees, organizers and gate staff on the platform",
    columns: [
      { label: "Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Role", key: "role" },
      { label: "Orders", key: "orders", number: true },
      { label: "Joined", key: "joined" },
      { label: "Status", key: "status" },
    ],
    rows: adminUsers,
    searchKeys: ["name", "email", "role", "status"],
    action: "none",
  },
  organizers: {
    title: "Organizers",
    description: "Verification, commission overrides and marketplace volume",
    columns: [
      { label: "Organizer", key: "name" },
      { label: "City", key: "city" },
      { label: "Events", key: "events", number: true },
      { label: "GMV", key: "gmv", money: true },
      { label: "Commission", key: "commission" },
      { label: "Status", key: "status" },
    ],
    rows: adminOrganizers,
    searchKeys: ["name", "city", "status"],
    action: "approve",
  },
  events: {
    title: "Events",
    description: "Moderation, sales and marketplace quality checks",
    columns: [
      { label: "Event", key: "title" },
      { label: "Organizer", key: "organizer" },
      { label: "City", key: "city" },
      { label: "Date", key: "date" },
      { label: "Sold", key: "sold", number: true },
      { label: "Revenue", key: "revenue", money: true },
      { label: "Status", key: "status" },
    ],
    rows: adminEvents,
    searchKeys: ["title", "organizer", "city", "status"],
    action: "moderate",
  },
  transactions: {
    title: "Transactions",
    description: "Confirmed collections and reconciliation records",
    columns: [
      { label: "Reference", key: "reference" },
      { label: "Buyer", key: "buyer" },
      { label: "Event", key: "event" },
      { label: "Gross", key: "gross", money: true },
      { label: "Commission", key: "commission", money: true },
      { label: "Provider", key: "provider" },
      { label: "Status", key: "status" },
    ],
    rows: adminTransactions,
    searchKeys: ["reference", "buyer", "event", "status"],
    action: "none",
  },
  payouts: {
    title: "Payouts",
    description: "Organizer withdrawal requests and settlement status",
    columns: [
      { label: "Reference", key: "reference" },
      { label: "Organizer", key: "organizer" },
      { label: "Amount", key: "amount", money: true },
      { label: "Method", key: "method" },
      { label: "Destination", key: "destination" },
      { label: "Requested", key: "requested" },
      { label: "Status", key: "status" },
    ],
    rows: adminPayouts,
    searchKeys: ["reference", "organizer", "status", "method"],
    action: "approve",
  },
  refunds: {
    title: "Refunds",
    description: "Refund requests, disputes and reversal records",
    columns: [
      { label: "Reference", key: "reference" },
      { label: "Order", key: "order" },
      { label: "Buyer", key: "buyer" },
      { label: "Event", key: "event" },
      { label: "Amount", key: "amount", money: true },
      { label: "Reason", key: "reason" },
      { label: "Status", key: "status" },
    ],
    rows: adminRefunds,
    searchKeys: ["reference", "buyer", "event", "status"],
    action: "approve",
  },
};

export default function AdminListPage() {
  const { pathname } = useLocation();
  const kind = pathname.split("/")[2] || "users";
  const config = configs[kind] ?? configs.users;
  const { pushToast } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeRow, setActiveRow] = useState<Record<string, string | number> | null>(null);
  const [confirm, setConfirm] = useState<{ row: Record<string, string | number>; decision: "approve" | "reject" } | null>(null);

  const filtered = useMemo(
    () =>
      config.rows.filter((row) => {
        const q = query.trim().toLowerCase();
        const matchesQuery = !q || config.searchKeys.some((key) => String(row[key]).toLowerCase().includes(q));
        const matchesStatus = statusFilter === "all" || String(row.status).toLowerCase() === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [config, query, statusFilter]
  );

  const statuses = Array.from(new Set(config.rows.map((row) => String(row.status))));

  return (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      mobileNav={adminMobileNav}
      userName="Platform Admin"
      userRole="Super admin · Nairobi"
      initials="PA"
      title={config.title}
      description={config.description}
      actions={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-9 items-center gap-2 rounded-field border border-background-300 bg-background-50 px-3">
              <i className="ri-search-line text-xs text-foreground-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records"
                className="w-44 bg-transparent text-xs outline-none placeholder:text-foreground-400"
              />
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 w-auto text-xs">
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={() => pushToast(`${config.title} exported as CSV.`, "success")}>
            <i className="ri-download-2-line" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="hidden lg:block">
        <TableWrap>
          <thead>
            <tr>
              {config.columns.map((column) => (
                <Th key={column.key}>{column.label}</Th>
              ))}
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={index} className="hover:bg-background-50">
                {config.columns.map((column) => (
                  <Td key={column.key} className={column.money || column.number ? "font-num text-xs" : "text-xs"}>
                    {column.key === "status" ? (
                      <Badge tone={statusTone(String(row.status))}>{String(row.status)}</Badge>
                    ) : column.money ? (
                      formatKsh(Number(row[column.key]))
                    ) : column.number ? (
                      formatNumber(Number(row[column.key]))
                    ) : column.key === "commission" ? (
                      `${row[column.key]}%`
                    ) : (
                      String(row[column.key] ?? "—")
                    )}
                  </Td>
                ))}
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveRow(row)} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                      View
                    </button>
                    {config.action !== "none" && (
                      <button
                        onClick={() => setConfirm({ row, decision: "approve" })}
                        className="cursor-pointer text-[11px] text-foreground-600"
                      >
                        {config.action === "moderate" ? "Moderate" : "Decide"}
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <div className="space-y-2.5 lg:hidden">
        {filtered.map((row, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground-950">
                  {String(row[config.columns[0].key])}
                </p>
                <p className="truncate text-[10px] text-foreground-500">
                  {config.columns
                    .slice(1, 4)
                    .map((column) => `${column.label}: ${row[column.key] ?? "—"}`)
                    .join(" · ")}
                </p>
              </div>
              {config.columns.some((column) => column.key === "status") && (
                <Badge tone={statusTone(String(row.status))}>{String(row.status)}</Badge>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={() => setActiveRow(row)} className="cursor-pointer text-[11px] font-semibold text-primary-700">
                View record
              </button>
              {config.action !== "none" && (
                <button onClick={() => setConfirm({ row, decision: "approve" })} className="cursor-pointer text-[11px] text-foreground-600">
                  Decide
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(activeRow)}
        onClose={() => setActiveRow(null)}
        title={`${config.title} record`}
        description="Read-only view. Changes are made through explicit actions only."
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveRow(null)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => pushToast("Full audit trail opens in production.", "info")}>
              Audit trail
            </Button>
          </>
        }
      >
        {activeRow && (
          <div className="space-y-2 text-xs">
            {config.columns.map((column) => (
              <div key={column.key} className="flex justify-between gap-4 border-b border-background-100 pb-1.5">
                <span className="text-foreground-500">{column.label}</span>
                <span className="text-right font-semibold text-foreground-950">
                  {column.money ? formatKsh(Number(activeRow[column.key])) : String(activeRow[column.key] ?? "—")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={config.action === "moderate" ? "Moderate this event" : "Financial decision required"}
        description="This action is recorded in the audit log with your admin identity."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirm(null);
                pushToast("Decision recorded — requester notified.", "warning");
              }}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                setConfirm(null);
                pushToast("Approved and recorded in the audit log.", "success");
              }}
            >
              Approve
            </Button>
          </>
        }
      >
        {confirm && (
          <div className="space-y-2">
            <div className="rounded-md border border-background-200 p-3">
              <p className="text-xs font-bold text-foreground-950">
                {String(confirm.row[config.columns[0].key])}
              </p>
              <p className="mt-1 text-[11px] text-foreground-500">
                {config.columns
                  .slice(1, 4)
                  .map((column) => `${column.label}: ${confirm.row[column.key] ?? "—"}`)
                  .join(" · ")}
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-foreground-600">
              Approving a payout confirms the destination matches the verified organizer profile.
              Approving a refund reverses the organizer allocation and platform commission for the order.
            </p>
          </div>
        )}
      </Modal>
      <Toaster />
    </DashboardShell>
  );
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (["active", "verified", "paid", "approved", "completed", "published"].includes(value)) return "success";
  if (["pending", "processing", "under review", "open"].includes(value)) return "warning";
  if (["rejected", "suspended", "flagged", "failed"].includes(value)) return "danger";
  return "neutral";
}