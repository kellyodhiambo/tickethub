-- Let verified organizers see only orders and tickets for their own events.
-- Platform admins can reconcile all orders and issued tickets.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_organizer_select ON public.orders;
DROP POLICY IF EXISTS orders_admin_select ON public.orders;
CREATE POLICY orders_organizer_select ON public.orders
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.users u ON u.id = auth.uid()
      WHERE e.id = orders.event_id AND e.organizer_id = auth.uid()
        AND u.role = 'organizer' AND u.verified IS TRUE
    )
  );
CREATE POLICY orders_admin_select ON public.orders
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS tickets_admin_select ON public.tickets;
CREATE POLICY tickets_admin_select ON public.tickets
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
