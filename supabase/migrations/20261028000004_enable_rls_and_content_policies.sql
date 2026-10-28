-- Policies do nothing until RLS is enabled. These tables contain accounts,
-- unpublished events, paid tickets, drafts, and unpublished episodes.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Retain self profile writes, with role changes blocked by the trigger. Admin
-- access is handled by users_admin_select/users_admin_update and the definer.

-- Remove broad content policies that granted every signed-in user writes.
DROP POLICY IF EXISTS "Allow authenticated users to delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to read blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can create blog posts if they are creator or blogger" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_author_insert ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_author_update ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_public_read_published ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_admin_select ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_admin_update ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_admin_delete ON public.blog_posts;
DROP POLICY IF EXISTS blog_posts_author_delete ON public.blog_posts;

CREATE POLICY blog_posts_public_read_published ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR author_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY blog_posts_author_insert ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid()
        AND (u.role IN ('blogger', 'official') OR (u.role = 'creator' AND u.creator_approved IS TRUE))
    )
  );
CREATE POLICY blog_posts_admin_insert ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY blog_posts_author_update ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
CREATE POLICY blog_posts_author_delete ON public.blog_posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY blog_posts_admin_update ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
CREATE POLICY blog_posts_admin_delete ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_platform_admin());

-- Episodes are managed through the admin content and YouTube sync tools.
DROP POLICY IF EXISTS "Authenticated users can insert episodes" ON public.episodes;
DROP POLICY IF EXISTS "Users can update their own episodes" ON public.episodes;
DROP POLICY IF EXISTS episodes_public_read ON public.episodes;
DROP POLICY IF EXISTS episodes_admin_read ON public.episodes;
DROP POLICY IF EXISTS episodes_admin_insert ON public.episodes;
DROP POLICY IF EXISTS episodes_admin_update ON public.episodes;
DROP POLICY IF EXISTS episodes_admin_delete ON public.episodes;

CREATE POLICY episodes_public_read ON public.episodes
  FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_platform_admin());
CREATE POLICY episodes_admin_insert ON public.episodes
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY episodes_admin_update ON public.episodes
  FOR UPDATE TO authenticated USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
CREATE POLICY episodes_admin_delete ON public.episodes
  FOR DELETE TO authenticated USING (public.is_platform_admin());
