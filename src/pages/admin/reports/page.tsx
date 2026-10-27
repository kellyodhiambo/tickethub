import DashboardShell from "@/components/feature/DashboardShell";
import { Toaster } from "@/components/feature/Toaster";
import { Badge, Button, Card, StatCard, TableWrap, Td, Th } from "@/components/base/ui";
import { formatKsh, formatNumber } from "@/lib/helpers";
import { adminMobileNav, adminNav } from "@/pages/organizer/nav";
import { adminReports, auditLogs, platformKpis, supportTickets } from "@/mocks/admin";
import { useApp } from "@/store/AppStore";

export default function AdminReportsPage() {
  const { pushToast } = useApp();

  return (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      mobileNav={adminMobileNav}
      userName="Platform Admin"
      userRole="Super admin · Nairobi"
      initials="PA"
      title="Reports"
      description="Platform revenue, reconciliation exports and audit trail"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-foreground-600">All exports are logged with the requesting admin identity</p>
          <Button size="sm" variant="outline" onClick={() => pushToast("Full platform report generated.", "success")}>
            <i className="ri-download-2-line" /> Generate full report
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="GMV this month" value={formatKsh(platformKpis.gmv, { compact: true })} icon="ri-line-chart-line" />
        <StatCard label="Commission earned" value={formatKsh(platformKpis.commission, { compact: true })} icon="ri-percent-line" tone="accent" />
        <StatCard label="Refunds" value={formatKsh(platformKpis.refunds, { compact: true })} icon="ri-refund-2-line" tone="foreground" />
        <StatCard label="Tickets sold" value={formatNumber(platformKpis.ticketsSold)} icon="ri-ticket-2-line" tone="secondary" />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {adminReports.map((report) => (
          <Card key={report.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground-950">{report.name}</p>
                <p className="mt-1 text-[10px] text-foreground-500">
                  {report.period} · {formatNumber(report.rows)} rows · {report.format}
                </p>
              </div>
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-background-100 text-foreground-700">
                <i className="ri-file-chart-2-line" />
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => pushToast(`${report.name} exported.`, "success")}
            >
              <i className="ri-download-2-line" /> Download
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground-950">Audit log</p>
          <Badge tone="neutral">Last 5 actions</Badge>
        </div>
        <div className="mt-3">
          <TableWrap>
            <thead>
              <tr>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Actor</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <Td className="text-xs text-foreground-900">{log.action}</Td>
                  <Td>
                    <Badge tone="neutral">{log.entity}</Badge>
                  </Td>
                  <Td className="text-[11px] text-foreground-600">{log.actor}</Td>
                  <Td className="font-num text-[11px] text-foreground-600">{log.at}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <p className="text-sm font-bold text-foreground-950">Support and disputes</p>
        <div className="mt-3 space-y-2">
          {supportTickets.map((ticket) => (
            <div key={ticket.id} className="flex flex-col gap-1.5 rounded-md border border-background-200 p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground-900">{ticket.subject}</p>
                <p className="text-[10px] text-foreground-500">
                  {ticket.requester} · {ticket.at}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={ticket.priority === "High" ? "danger" : "neutral"}>{ticket.priority}</Badge>
                <Badge tone={ticket.status === "Resolved" ? "success" : ticket.status === "Open" ? "warning" : "danger"}>
                  {ticket.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Toaster />
    </DashboardShell>
  );
}