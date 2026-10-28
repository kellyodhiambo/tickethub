-- Public directory data is deliberately narrower than account profiles.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true)
AS
SELECT id, full_name, avatar_url, role, creator_category, creator_approved,
       creator_approved_date, verified, featured, bio, social_links,
       portfolio_links, location, privacy_profile_visible, created_at, updated_at
FROM public.users
WHERE privacy_profile_visible IS DISTINCT FROM false
  AND ((role = 'creator' AND creator_approved IS TRUE) OR role = 'official');
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Publish aggregate counts only; do not expose member identities to the public.
CREATE OR REPLACE FUNCTION public.get_public_community_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'verified_creators', (SELECT count(*) FROM public.users WHERE role = 'creator' AND creator_approved IS TRUE AND privacy_profile_visible IS DISTINCT FROM false),
    'members', (SELECT count(*) FROM public.users WHERE role = 'member' AND status IS DISTINCT FROM 'suspended')
  );
$$;
REVOKE ALL ON FUNCTION public.get_public_community_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_community_stats() TO anon, authenticated;
