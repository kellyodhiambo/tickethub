-- PostgreSQL requires at least one permissive policy to allow an INSERT.
-- The shared security migration retained only a RESTRICTIVE event insert
-- policy, which can narrow access but cannot grant it. Keep the same approval
-- and ownership checks in a permissive policy so approved organizers can post.
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
          AND u.verified IS TRUE
      )
    )
  );
