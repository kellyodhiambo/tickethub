export interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  salesEnd: string;
  maxPerOrder: number;
  minPerOrder: number;
  description: string;
  perks: string[];
}

export interface EventItem {
  id: string;
  status?: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  county: string;
  venue: string;
  address: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  image: string;
  gallery: string[];
  priceFrom: number;
  organizerId: string;
  organizerName: string;
  verified: boolean;
  featured: boolean;
  trending: boolean;
  free: boolean;
  soldOut: boolean;
  capacity: number;
  ticketsSold: number;
  description: string;
  lineup: { name: string; role: string; time: string }[];
  schedule: { time: string; label: string }[];
  ageLimit: string;
  requirements: string;
  refundPolicy: string;
  policies: string[];
  tiers: TicketTier[];
}

export interface WalletTicket {
  id: string;
  code: string;
  orderReference: string;
  eventSlug: string;
  eventId?: string;
  price?: number;
  tier: string;
  attendee: string;
  status: "Valid" | "Used" | "Cancelled";
  issuedAt: string;
  gate?: string;
  scannedAt?: string;
}

export interface ScanEntry {
  id: string;
  code: string;
  eventSlug: string;
  gate: string;
  staff: string;
  result: "valid" | "duplicate" | "invalid";
  at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  gate: string;
  role: string;
  status: "Active" | "Invited" | "Revoked";
  scans: number;
}

export interface Withdrawal {
  id: string;
  reference: string;
  amount: number;
  method: string;
  destination: string;
  status: "Completed" | "Processing" | "Pending" | "Rejected";
  requestedAt: string;
  note?: string;
}

export interface OrderRecord {
  id: string;
  reference: string;
  eventSlug: string;
  buyer: string;
  phone: string;
  tier: string;
  quantity: number;
  total: number;
  commission: number;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
  channel: string;
  createdAt: string;
}

export interface Organizer {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  bio: string;
  eventsHosted: number;
  followers: string;
  rating: number;
  commission: number;
  initials: string;
}
