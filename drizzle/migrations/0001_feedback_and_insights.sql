CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  helpful text NOT NULL CHECK (helpful IN ('yes','somewhat','no')),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users add own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_cohort_insights(_role_id integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  WITH latest AS (
    SELECT DISTINCT ON (a.user_id, a.skill_id) a.user_id, a.skill_id, a.level
    FROM assessments a JOIN role_skills rs ON rs.skill_id = a.skill_id AND rs.role_id = _role_id
    ORDER BY a.user_id, a.skill_id, a.taken_at DESC
  )
  SELECT count(DISTINCT user_id) INTO n FROM latest;
  IF n < 5 THEN
    RETURN jsonb_build_object('students', n, 'ready', false);
  END IF;
  WITH latest AS (
    SELECT DISTINCT ON (a.user_id, a.skill_id) a.user_id, a.skill_id, a.level
    FROM assessments a JOIN role_skills rs ON rs.skill_id = a.skill_id AND rs.role_id = _role_id
    ORDER BY a.user_id, a.skill_id, a.taken_at DESC
  ),
  users AS (SELECT DISTINCT user_id FROM latest),
  grid AS (
    SELECT u.user_id, rs.skill_id, rs.demand_weight AS w, coalesce(l.level, 0) AS level
    FROM users u CROSS JOIN role_skills rs
    LEFT JOIN latest l ON l.user_id = u.user_id AND l.skill_id = rs.skill_id
    WHERE rs.role_id = _role_id
  ),
  per_user AS (
    SELECT user_id, 100.0 * sum(w * level) / nullif(sum(w), 0) AS readiness FROM grid GROUP BY user_id
  ),
  per_skill AS (
    SELECT s.name, max(g.w) AS weight, avg(g.level) AS avg_level, avg(g.w * (1 - g.level)) AS avg_gap
    FROM grid g JOIN skills s ON s.id = g.skill_id GROUP BY s.name
  )
  SELECT jsonb_build_object(
    'ready', true,
    'students', n,
    'avg_readiness', (SELECT round(avg(readiness)) FROM per_user),
    'verified', (SELECT count(*) FROM verifications v JOIN users u ON u.user_id = v.user_id WHERE v.status = 'verified'),
    'skills', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'weight', weight, 'avg_level', round(avg_level, 2), 'avg_gap', round(avg_gap, 2)) ORDER BY avg_gap DESC), '[]'::jsonb) FROM per_skill)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_cohort_insights(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cohort_insights(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  gh text;
BEGIN
  base := regexp_replace(lower(split_part(coalesce(NEW.email, 'student'), '@', 1)), '[^a-z0-9]', '', 'g');
  IF base = '' THEN base := 'student'; END IF;
  IF coalesce(NEW.raw_app_meta_data->>'provider', '') = 'github' THEN
    gh := nullif(coalesce(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username'), '');
  END IF;
  INSERT INTO public.profiles (id, name, username, github_username)
  VALUES (
    NEW.id,
    coalesce(nullif(NEW.raw_user_meta_data->>'name', ''), nullif(NEW.raw_user_meta_data->>'full_name', ''), split_part(coalesce(NEW.email, ''), '@', 1)),
    left(base, 20) || '-' || substr(md5(random()::text || NEW.id::text), 1, 5),
    gh
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;