-- Unverified organizer accounts may prepare drafts for review. They still
-- cannot publish until an administrator verifies their organizer profile.
DROP POLICY IF EXISTS events_insert_approved_organizer ON public.events;
CREATE POLICY events_insert_approved_organizer
  ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND (
      public.is_platform_admin()
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'organizer'
          AND (u.verified IS TRUE OR public.events.status = 'draft')
      )
    )
  );

DROP POLICY IF EXISTS events_insert_owner_only ON public.events;
CREATE POLICY events_insert_owner_only
  ON public.events AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND (
      public.is_platform_admin()
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'organizer'
          AND (u.verified IS TRUE OR public.events.status = 'draft')
      )
    )
  );
