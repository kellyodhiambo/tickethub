export const platformKpis = {
  gmv: 42860000,
  commission: 4286000,
  organizerEntitlement: 38574000,
  providerFees: 857200,
  pendingPayouts: 1246000,
  refunds: 384000,
  activeEvents: 148,
  verifiedOrganizers: 96,
  newUsers: 1840,
  ticketsSold: 52140,
};

export const platformRevenue = [
  { label: "Jun", gmv: 4200000, commission: 420000 },
  { label: "Jul", gmv: 5100000, commission: 510000 },
  { label: "Aug", gmv: 4800000, commission: 480000 },
  { label: "Sep", gmv: 6400000, commission: 640000 },
  { label: "Oct", gmv: 8600000, commission: 860000 },
  { label: "Nov", gmv: 7250000, commission: 725000 },
];

export const adminUsers = [
  { id: "u-1", name: "Amina Wanjiru", email: "amina.wanjiru@example.co.ke", phone: "+254 712 445 908", role: "Attendee", orders: 6, joined: "2026-03-14", status: "Active" },
  { id: "u-2", name: "Brian Otieno", email: "b.otieno@example.co.ke", phone: "+254 733 112 004", role: "Organizer", orders: 2, joined: "2025-11-02", status: "Active" },
  { id: "u-3", name: "Mercy Achieng", email: "mercy.a@example.co.ke", phone: "+254 712 004 118", role: "Gate staff", orders: 0, joined: "2026-08-21", status: "Active" },
  { id: "u-4", name: "Faith Chepkoech", email: "faith.c@example.co.ke", phone: "+254 721 890 336", role: "Attendee", orders: 11, joined: "2025-12-19", status: "Active" },
  { id: "u-5", name: "Samuel Kariuki", email: "s.kariuki@example.co.ke", phone: "+254 728 664 220", role: "Organizer", orders: 4, joined: "2026-01-27", status: "Under review" },
  { id: "u-6", name: "Peter Wekesa", email: "p.wekesa@example.co.ke", phone: "+254 799 442 016", role: "Attendee", orders: 1, joined: "2026-10-11", status: "Flagged" },
  { id: "u-7", name: "Grace Achieng", email: "grace.a@example.co.ke", phone: "+254 700 556 901", role: "Attendee", orders: 8, joined: "2026-05-30", status: "Active" },
  { id: "u-8", name: "Dennis Barasa", email: "d.barasa@example.co.ke", phone: "+254 705 993 274", role: "Organizer", orders: 3, joined: "2026-02-08", status: "Suspended" },
];

export const adminOrganizers = [
  { id: "ao-1", name: "DalaLive Events", city: "Kisumu", events: 68, gmv: 12400000, commission: 10, status: "Verified", submitted: "2025-06-11" },
  { id: "ao-2", name: "Nairobi Sound Works", city: "Nairobi", events: 112, gmv: 18600000, commission: 10, status: "Verified", submitted: "2025-04-02" },
  { id: "ao-3", name: "Coastline Nights", city: "Mombasa", events: 41, gmv: 5400000, commission: 9, status: "Verified", submitted: "2025-09-18" },
  { id: "ao-4", name: "Rift Valley Campus Hub", city: "Eldoret", events: 23, gmv: 2100000, commission: 10, status: "Pending review", submitted: "2026-10-20" },
  { id: "ao-5", name: "Baraza Culture Collective", city: "Nakuru", events: 57, gmv: 3860000, commission: 10, status: "Verified", submitted: "2025-08-07" },
  { id: "ao-6", name: "Tsavo Nightlife Ltd", city: "Voi", events: 4, gmv: 180000, commission: 10, status: "Rejected", submitted: "2026-09-29" },
];

export const adminEvents = [
  { id: "ae-1", title: "Sound Factory Nairobi", organizer: "Nairobi Sound Works", city: "Nairobi", date: "2026-11-21", sold: 4310, revenue: 2418000, status: "Published" },
  { id: "ae-2", title: "Lakeside Festival Kisumu", organizer: "DalaLive Events", city: "Kisumu", date: "2026-12-12", sold: 5120, revenue: 1892000, status: "Published" },
  { id: "ae-3", title: "Naivasha Weekend Pass", organizer: "DalaLive Events", city: "Naivasha", date: "2027-02-06", sold: 1500, revenue: 924000, status: "Sold out" },
  { id: "ae-4", title: "Mombasa Sunset Sessions", organizer: "Coastline Nights", city: "Mombasa", date: "2026-11-28", sold: 612, revenue: 1412000, status: "Published" },
  { id: "ae-5", title: "Campus Takeover Eldoret", organizer: "Rift Valley Campus Hub", city: "Eldoret", date: "2026-11-07", sold: 2980, revenue: 984000, status: "Under review" },
  { id: "ae-6", title: "Kitale Youth Expo", organizer: "Rift Valley Campus Hub", city: "Kitale", date: "2026-11-29", sold: 2210, revenue: 0, status: "Published" },
];

export const adminTransactions = [
  { id: "tx-1", reference: "DLA-8F42KD", buyer: "Amina Wanjiru", event: "Sound Factory Nairobi", gross: 12000, commission: 1200, fee: 240, status: "Paid", provider: "M-Pesa", at: "2026-10-26 21:14" },
  { id: "tx-2", reference: "DLA-4MN7VB", buyer: "Samuel Kariuki", event: "Sound Factory Nairobi", gross: 36000, commission: 3600, fee: 720, status: "Paid", provider: "M-Pesa", at: "2026-10-25 19:38" },
  { id: "tx-3", reference: "DLA-77QXAP", buyer: "Faith Chepkoech", event: "Lakeside Festival Kisumu", gross: 7000, commission: 700, fee: 140, status: "Paid", provider: "M-Pesa", at: "2026-10-26 18:47" },
  { id: "tx-4", reference: "DLA-6PL2ZX", buyer: "Janet Njeri", event: "Lakeside Festival Kisumu", gross: 4000, commission: 400, fee: 80, status: "Pending", provider: "M-Pesa", at: "2026-10-25 17:12" },
  { id: "tx-5", reference: "DLA-9WQ3TR", buyer: "Grace Achieng", event: "Naivasha Weekend Pass", gross: 7000, commission: 700, fee: 140, status: "Paid", provider: "Card", at: "2026-10-25 22:05" },
  { id: "tx-6", reference: "DLA-0HX6JY", buyer: "Dennis Barasa", event: "Naivasha Weekend Pass", gross: 12500, commission: 1250, fee: 250, status: "Refunded", provider: "M-Pesa", at: "2026-10-24 12:09" },
];

export const adminPayouts = [
  { id: "ap-1", reference: "PO-2026-1055", organizer: "Nairobi Sound Works", amount: 312400, method: "Bank transfer", destination: "KCB •••• 4471", status: "Processing", requested: "2026-10-24" },
  { id: "ap-2", reference: "PO-2026-1058", organizer: "DalaLive Events", amount: 96000, method: "M-Pesa", destination: "+254 712 000 118", status: "Pending", requested: "2026-10-26" },
  { id: "ap-3", reference: "PO-2026-1042", organizer: "DalaLive Events", amount: 450000, method: "M-Pesa", destination: "+254 712 000 118", status: "Completed", requested: "2026-10-18" },
  { id: "ap-4", reference: "PO-2026-1038", organizer: "Coastline Nights", amount: 186000, method: "M-Pesa", destination: "+254 733 552 100", status: "Completed", requested: "2026-10-12" },
  { id: "ap-5", reference: "PO-2026-1019", organizer: "DalaLive Events", amount: 150000, method: "Bank transfer", destination: "KCB •••• 4471", status: "Rejected", requested: "2026-09-22" },
];

export const adminRefunds = [
  { id: "ar-1", reference: "RF-2026-0921", order: "DLA-0HX6JY", buyer: "Dennis Barasa", event: "Naivasha Weekend Pass", amount: 12500, reason: "Event date change", status: "Approved", requested: "2026-10-24" },
  { id: "ar-2", reference: "RF-2026-0922", order: "DLA-3ZR8HN", buyer: "Peter Wekesa", event: "Nakuru Comedy Night", amount: 1800, reason: "Duplicate charge", status: "Pending", requested: "2026-10-25" },
  { id: "ar-3", reference: "RF-2026-0918", order: "DLA-1KLP9C", buyer: "Kevin Mwangi", event: "Nakuru Comedy Night", amount: 4800, reason: "Cannot attend", status: "Rejected", requested: "2026-10-20" },
  { id: "ar-4", reference: "RF-2026-0925", order: "DLA-9WQ3TR", buyer: "Grace Achieng", event: "Naivasha Weekend Pass", amount: 7000, reason: "Medical emergency", status: "Pending", requested: "2026-10-26" },
];

export const commissionRules = [
  { id: "cr-1", scope: "Platform default", target: "All organizers", rate: 10, updated: "2026-09-01", updatedBy: "Platform admin" },
  { id: "cr-2", scope: "Organizer override", target: "Nairobi Sound Works", rate: 10, updated: "2026-09-14", updatedBy: "Platform admin" },
  { id: "cr-3", scope: "Organizer override", target: "Coastline Nights", rate: 9, updated: "2026-08-22", updatedBy: "Platform admin" },
  { id: "cr-4", scope: "Event override", target: "Nairobi Tech Summit", rate: 8, updated: "2026-09-30", updatedBy: "Platform admin" },
  { id: "cr-5", scope: "Event override", target: "Dala Cultural Night (free)", rate: 0, updated: "2026-10-02", updatedBy: "Platform admin" },
];

export const auditLogs = [
  { id: "al-1", actor: "platform.admin@dalatickets.co.ke", action: "Approved payout PO-2026-1042", entity: "Payout", at: "2026-10-18 10:22" },
  { id: "al-2", actor: "platform.admin@dalatickets.co.ke", action: "Updated commission override for Coastline Nights to 9%", entity: "Commission", at: "2026-10-16 15:40" },
  { id: "al-3", actor: "finance@dalatickets.co.ke", action: "Rejected payout PO-2026-1019 — name mismatch", entity: "Payout", at: "2026-09-23 09:12" },
  { id: "al-4", actor: "platform.admin@dalatickets.co.ke", action: "Suspended organizer Tsavo Nightlife Ltd", entity: "Organizer", at: "2026-09-29 17:05" },
  { id: "al-5", actor: "support@dalatickets.co.ke", action: "Approved refund RF-2026-0921", entity: "Refund", at: "2026-10-24 11:48" },
];

export const supportTickets = [
  { id: "st-1", subject: "Ticket not received after M-Pesa payment", requester: "Faith Chepkoech", priority: "High", status: "Open", at: "2026-10-26 19:02" },
  { id: "st-2", subject: "Request to change attendee name", requester: "Kevin Mwangi", priority: "Normal", status: "Open", at: "2026-10-26 11:30" },
  { id: "st-3", subject: "Organizer payout destination update", requester: "Nairobi Sound Works", priority: "Normal", status: "Resolved", at: "2026-10-24 08:15" },
  { id: "st-4", subject: "Duplicate scan dispute at Gate B", requester: "Mercy Achieng", priority: "High", status: "Escalated", at: "2026-10-23 22:44" },
];

export const adminReports = [
  { id: "r-1", name: "Monthly GMV and commission", period: "October 2026", format: "CSV", rows: 1840 },
  { id: "r-2", name: "Organizer settlement statement", period: "October 2026", format: "CSV", rows: 96 },
  { id: "r-3", name: "Refund and dispute log", period: "Q3 2026", format: "CSV", rows: 42 },
  { id: "r-4", name: "Scan and attendance report", period: "October 2026", format: "CSV", rows: 12860 },
];