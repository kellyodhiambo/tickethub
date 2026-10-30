import type { RouteObject } from "react-router-dom";
import HomePage from "@/pages/home/page";
import HowItWorksPage from "@/pages/how-it-works/page";
import DiscoverPage from "@/pages/discover/page";
import SeoLandingPage, { CountyDirectoryPage } from "@/pages/discover/SeoLandingPage";
import EventDetailPage from "@/pages/events/detail/page";
import CheckoutPage from "@/pages/checkout/page";
import MyTicketsPage from "@/pages/tickets/page";
import TicketDetailPage from "@/pages/tickets/detail/page";
import FavoritesPage from "@/pages/favorites/page";
import AccountPage from "@/pages/account/page";
import SignInPage from "@/pages/signin/page";
import GateLoginPage from "@/pages/gate-login/page";
import SignUpPage from "@/pages/signup/page";
import ForgotPasswordPage from "@/pages/forgot-password/page";
import AuthCallbackPage from "@/pages/auth/callback/page";
import ResetPasswordPage from "@/pages/auth/reset-password/page";
import OrganizerOverviewPage from "@/pages/organizer/overview/page";
import OrganizerEventsPage from "@/pages/organizer/events/page";
import CreateEventPage from "@/pages/organizer/events/new/page";
import OrganizerOrdersPage from "@/pages/organizer/orders/page";
import AttendeesPage from "@/pages/organizer/attendees/page";
import GateStaffPage from "@/pages/organizer/staff/page";
import EarningsPage from "@/pages/organizer/earnings/page";
import WithdrawalsPage from "@/pages/organizer/withdrawals/page";
import PromotersPage from "@/pages/organizer/promoters/page";
import AnalyticsPage from "@/pages/organizer/analytics/page";
import OrganizerSettingsPage from "@/pages/organizer/settings/page";
import SupportPage from "@/pages/organizer/support/page";
import ScannerPage from "@/pages/scanner/page";
import AdminOverviewPage from "@/pages/admin/overview/page";
import AdminListPage from "@/pages/admin/list/page";
import AdminOrganizersPage from "@/pages/admin/organizers/page";
import CommissionsPage from "@/pages/admin/commissions/page";
import AdminReportsPage from "@/pages/admin/reports/page";
import AdminSettingsPage from "@/pages/admin/settings/page";
import OrganizerApplicationPage from "@/pages/organizer/apply/page";
import NotFound from "@/pages/NotFound";
import RoleRoute from "@/router/RoleRoute";

const organizerOnly = (element: React.ReactNode) => <RoleRoute role="organizer">{element}</RoleRoute>;
const eventCreator = (element: React.ReactNode) => <RoleRoute role="event_creator">{element}</RoleRoute>;
const adminOnly = (element: React.ReactNode) => <RoleRoute role="admin">{element}</RoleRoute>;

const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/how-it-works", element: <HowItWorksPage /> },
  { path: "/discover", element: <DiscoverPage /> },
  { path: "/events-in-kenya", element: <CountyDirectoryPage /> },
  { path: "/events-in/:countySlug", element: <SeoLandingPage /> },
  { path: "/events/category/:categorySlug", element: <SeoLandingPage /> },
  { path: "/events/:slug", element: <EventDetailPage /> },
  { path: "/checkout/:slug", element: <CheckoutPage /> },
  { path: "/tickets", element: <MyTicketsPage /> },
  { path: "/tickets/:code", element: <TicketDetailPage /> },
  { path: "/favorites", element: <FavoritesPage /> },
  { path: "/account", element: <AccountPage /> },
  { path: "/signin", element: <SignInPage /> },
  { path: "/gate-login", element: <GateLoginPage /> },
  { path: "/signup", element: <SignUpPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/auth/reset-password", element: <ResetPasswordPage /> },
  { path: "/organizer/apply", element: <RoleRoute role="authenticated"><OrganizerApplicationPage /></RoleRoute> },
  { path: "/organizer", element: organizerOnly(<OrganizerOverviewPage />) },
  { path: "/organizer/events", element: organizerOnly(<OrganizerEventsPage />) },
  { path: "/organizer/events/new", element: eventCreator(<CreateEventPage />) },
  { path: "/organizer/orders", element: organizerOnly(<OrganizerOrdersPage />) },
  { path: "/organizer/attendees", element: organizerOnly(<AttendeesPage />) },
  { path: "/organizer/staff", element: organizerOnly(<GateStaffPage />) },
  { path: "/organizer/earnings", element: organizerOnly(<EarningsPage />) },
  { path: "/organizer/withdrawals", element: organizerOnly(<WithdrawalsPage />) },
  { path: "/organizer/promoters", element: organizerOnly(<PromotersPage />) },
  { path: "/organizer/analytics", element: organizerOnly(<AnalyticsPage />) },
  { path: "/organizer/settings", element: organizerOnly(<OrganizerSettingsPage />) },
  { path: "/organizer/support", element: organizerOnly(<SupportPage />) },
  { path: "/scanner", element: <ScannerPage /> },
  { path: "/admin", element: adminOnly(<AdminOverviewPage />) },
  { path: "/admin/users", element: adminOnly(<AdminListPage />) },
  { path: "/admin/organizers", element: adminOnly(<AdminOrganizersPage />) },
  { path: "/admin/events", element: adminOnly(<AdminListPage />) },
  { path: "/admin/transactions", element: adminOnly(<AdminListPage />) },
  { path: "/admin/payouts", element: adminOnly(<AdminListPage />) },
  { path: "/admin/refunds", element: adminOnly(<AdminListPage />) },
  { path: "/admin/commissions", element: adminOnly(<CommissionsPage />) },
  { path: "/admin/reports", element: adminOnly(<AdminReportsPage />) },
  { path: "/admin/settings", element: adminOnly(<AdminSettingsPage />) },
  { path: "*", element: <NotFound /> },
];

export default routes;
