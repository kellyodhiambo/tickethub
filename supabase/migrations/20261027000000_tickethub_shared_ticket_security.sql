-- Shared Tribedala database security hardening for TicketHub.
-- Review with the Tribedala owner before applying: these tables are shared.
-- Client checkout must create a pending order through a trusted server endpoint;
-- only the verified Kingdom callback should finalize payment and issue tickets.

-- SECURITY DEFINER keeps authorization checks from recursively invoking the
-- users table policies which they are meant to evaluate.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- A user's public.users row is not an authorization source for self-service
-- changes. Preserve profile editing while preventing role/verification escalation.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'member';
      NEW.admin_role := NULL;
      NEW.verified := false;
      NEW.creator_approved := false;
      NEW.creator_approved_date := NULL;
      NEW.creator_approved_by := NULL;
    ELSIF (
          NEW.role IS DISTINCT FROM OLD.role
          AND (
            NEW.role IN ('organizer', 'admin', 'official')
            OR OLD.role IN ('organizer', 'admin', 'official')
          )
       )
       OR NEW.admin_role IS DISTINCT FROM OLD.admin_role
       OR NEW.verified IS DISTINCT FROM OLD.verified
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.creator_approved IS DISTINCT FROM OLD.creator_approved
       OR NEW.creator_approved_date IS DISTINCT FROM OLD.creator_approved_date
       OR NEW.creator_approved_by IS DISTINCT FROM OLD.creator_approved_by THEN
      RAISE EXCEPTION 'You cannot change your own authorization or verification fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_prevent_self_role_escalation ON public.users;
CREATE TRIGGER users_prevent_self_role_escalation
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- The live database has a public SELECT policy on users, which exposes email
-- addresses and authorization fields. Keep reads to self and existing admins.
DROP POLICY IF EXISTS public_read_profiles ON public.users;

-- Guest pitches contain personal contact details. The current live policies
-- expose every request and allow any client to edit every row.
DROP POLICY IF EXISTS view_all_requests ON public.guest_requests;
DROP POLICY IF EXISTS update_all_requests ON public.guest_requests;
DROP POLICY IF EXISTS guest_requests_admin_read ON public.guest_requests;
DROP POLICY IF EXISTS guest_requests_admin_update ON public.guest_requests;
CREATE POLICY guest_requests_admin_read
  ON public.guest_requests
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());
CREATE POLICY guest_requests_admin_update
  ON public.guest_requests
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Public event reads should never include an organizer's unpublished drafts.
DROP POLICY IF EXISTS events_hide_unpublished ON public.events;
CREATE POLICY events_hide_unpublished
  ON public.events AS RESTRICTIVE
  FOR SELECT TO public
  USING (
    status IS DISTINCT FROM 'draft'
    OR organizer_id = auth.uid()
    OR public.is_platform_admin()
  );

-- Only organizer applicants approved by the shared admin team may publish.
-- Admins can create events under their own account for operational purposes.
DROP POLICY IF EXISTS events_insert_owner_only ON public.events;
CREATE POLICY events_insert_owner_only
  ON public.events AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND (public.is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'organizer' AND u.verified IS TRUE
    ))
  );

-- Event owners cannot self-approve, feature, or alter sales counters.
CREATE OR REPLACE FUNCTION public.guard_event_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.organizer_id
     AND NOT public.is_platform_admin() THEN
    NEW.verified := OLD.verified;
    NEW.featured := OLD.featured;
    NEW.trending := OLD.trending;
    NEW.tickets_sold := OLD.tickets_sold;
    NEW.sold_out := OLD.sold_out;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_guard_approval_fields ON public.events;
CREATE TRIGGER events_guard_approval_fields
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.guard_event_approval_fields();

-- Ticket rows contain payment and admission state. Do not let anon/authenticated
-- clients create paid tickets or alter payment status directly. Keep service-role
-- callback access; the current browser checkout is intentionally disabled until
-- a trusted Kingdom payment endpoint is connected.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tickets'
      AND cmd IN ('INSERT', 'UPDATE', 'ALL')
      AND roles && ARRAY['anon'::name, 'authenticated'::name, 'public'::name]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tickets', p.policyname);
  END LOOP;
END;
$$;

-- This SECURITY DEFINER RPC changes inventory. Only trusted server code may call it.
REVOKE EXECUTE ON FUNCTION public.increment_tickets_sold(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tickets_sold(uuid, integer)
  TO service_role;

-- Remove legacy permissive policies. PostgreSQL combines permissive policies
-- with OR, so leaving these in place would bypass narrower owner/admin rules.
DROP POLICY IF EXISTS "Allow authenticated users to create events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to delete events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to update events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS admins_view_all ON public.users;
DROP POLICY IF EXISTS admins_update_any ON public.users;
DROP POLICY IF EXISTS users_admin_select ON public.users;
DROP POLICY IF EXISTS users_admin_update ON public.users;
CREATE POLICY users_admin_select ON public.users FOR SELECT TO authenticated
  USING (public.is_platform_admin());
CREATE POLICY users_admin_update ON public.users FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- Role fields are granted by admins through review workflows, never by the
-- account holder editing their profile. Cover all privileged Tribedala roles.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'member';
      NEW.admin_role := NULL;
      NEW.verified := false;
      NEW.creator_approved := false;
      NEW.creator_approved_date := NULL;
      NEW.creator_approved_by := NULL;
    ELSIF (NEW.role IS DISTINCT FROM OLD.role)
       OR NEW.admin_role IS DISTINCT FROM OLD.admin_role
       OR NEW.verified IS DISTINCT FROM OLD.verified
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.creator_approved IS DISTINCT FROM OLD.creator_approved
       OR NEW.creator_approved_date IS DISTINCT FROM OLD.creator_approved_date
       OR NEW.creator_approved_by IS DISTINCT FROM OLD.creator_approved_by THEN
      RAISE EXCEPTION 'You cannot change your own authorization or verification fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Paid orders and tickets must only be written by trusted server callbacks.
DROP POLICY IF EXISTS orders_insert_own ON public.orders;
REVOKE INSERT ON public.orders FROM anon, authenticated;
