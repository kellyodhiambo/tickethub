-- Operational tables used by both Tribedala and TicketHub.
-- This migration is additive; user and event ownership continue to use the
-- existing public.users and public.events tables.

CREATE TABLE IF NOT EXISTS public.event_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS event_favorites_owner_all ON public.event_favorites;
CREATE POLICY event_favorites_owner_all ON public.event_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, DELETE ON public.event_favorites TO authenticated;

CREATE TABLE IF NOT EXISTS public.organizer_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('WD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  organizer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 1000),
  method text NOT NULL CHECK (method IN ('M-Pesa', 'Bank transfer')),
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  note text
);
ALTER TABLE public.organizer_withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizer_withdrawals_owner_read ON public.organizer_withdrawals;
DROP POLICY IF EXISTS organizer_withdrawals_owner_insert ON public.organizer_withdrawals;
DROP POLICY IF EXISTS organizer_withdrawals_admin_read ON public.organizer_withdrawals;
DROP POLICY IF EXISTS organizer_withdrawals_admin_update ON public.organizer_withdrawals;
CREATE POLICY organizer_withdrawals_owner_read ON public.organizer_withdrawals
  FOR SELECT TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY organizer_withdrawals_owner_insert ON public.organizer_withdrawals
  FOR INSERT TO authenticated WITH CHECK (
    organizer_id = auth.uid() AND status = 'Pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid()
        AND u.role = 'organizer' AND u.verified IS TRUE
    )
  );
CREATE POLICY organizer_withdrawals_admin_read ON public.organizer_withdrawals
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
CREATE POLICY organizer_withdrawals_admin_update ON public.organizer_withdrawals
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
GRANT SELECT, INSERT, UPDATE ON public.organizer_withdrawals TO authenticated;

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('platform', 'organizer', 'event')),
  target_id uuid,
  rate numeric(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, target_id)
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commission_rules_admin_all ON public.commission_rules;
CREATE POLICY commission_rules_admin_all ON public.commission_rules
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rules TO authenticated;

CREATE TABLE IF NOT EXISTS public.promoter_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  commission_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promoter_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promoter_codes_owner_all ON public.promoter_codes;
DROP POLICY IF EXISTS promoter_codes_admin_all ON public.promoter_codes;
CREATE POLICY promoter_codes_owner_all ON public.promoter_codes
  FOR ALL TO authenticated USING (organizer_id = auth.uid()) WITH CHECK (
    organizer_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid()
        AND u.role = 'organizer' AND u.verified IS TRUE
    )
  );
CREATE POLICY promoter_codes_admin_all ON public.promoter_codes
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promoter_codes TO authenticated;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In progress', 'Resolved', 'Closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  assigned_to uuid REFERENCES public.users(id),
  admin_notes text
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_owner_read ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_owner_insert ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_admin_all ON public.support_tickets;
CREATE POLICY support_tickets_owner_read ON public.support_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY support_tickets_owner_insert ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'Open' AND assigned_to IS NULL AND admin_notes IS NULL);
CREATE POLICY support_tickets_admin_all ON public.support_tickets
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz
);
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inquiries_public_insert ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin_read ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin_update ON public.inquiries;
CREATE POLICY inquiries_public_insert ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(trim(name)) BETWEEN 1 AND 160
    AND length(trim(email)) BETWEEN 3 AND 320
    AND length(trim(message)) BETWEEN 1 AND 10000
    AND status = 'new'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );
CREATE POLICY inquiries_admin_read ON public.inquiries
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
CREATE POLICY inquiries_admin_update ON public.inquiries
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.inquiries TO authenticated;

CREATE TABLE IF NOT EXISTS public.ticket_refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('RF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reason text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Processed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  review_notes text
);
ALTER TABLE public.ticket_refund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS refund_requests_owner_read ON public.ticket_refund_requests;
DROP POLICY IF EXISTS refund_requests_owner_insert ON public.ticket_refund_requests;
DROP POLICY IF EXISTS refund_requests_admin_all ON public.ticket_refund_requests;
CREATE POLICY refund_requests_owner_read ON public.ticket_refund_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY refund_requests_owner_insert ON public.ticket_refund_requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND status = 'Pending' AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY refund_requests_admin_all ON public.ticket_refund_requests
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
GRANT SELECT, INSERT, UPDATE ON public.ticket_refund_requests TO authenticated;
