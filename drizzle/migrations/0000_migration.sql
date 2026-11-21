-- ========== Reference tables ==========
CREATE TABLE public.roles (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read roles" ON public.roles FOR SELECT TO authenticated USING (true);

CREATE TABLE public.skills (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  prerequisites text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}'
);
GRANT SELECT ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read skills" ON public.skills FOR SELECT TO authenticated USING (true);

CREATE TABLE public.role_skills (
  role_id int NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  skill_id int NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  demand_weight int NOT NULL CHECK (demand_weight BETWEEN 1 AND 10),
  PRIMARY KEY (role_id, skill_id)
);
GRANT SELECT ON public.role_skills TO authenticated;
GRANT ALL ON public.role_skills TO service_role;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read role skills" ON public.role_skills FOR SELECT TO authenticated USING (true);

CREATE TABLE public.questions (
  id serial PRIMARY KEY,
  skill_id int NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read questions" ON public.questions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.roadmap_tasks (
  id serial PRIMARY KEY,
  skill_id int NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  est_hours numeric(4,1) NOT NULL,
  resource_url text NOT NULL,
  seq int NOT NULL DEFAULT 1
);
GRANT SELECT ON public.roadmap_tasks TO authenticated;
GRANT ALL ON public.roadmap_tasks TO service_role;
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read roadmap tasks" ON public.roadmap_tasks FOR SELECT TO authenticated USING (true);

CREATE TABLE public.skill_projects (
  id serial PRIMARY KEY,
  skill_id int NOT NULL UNIQUE REFERENCES public.skills(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  est_hours int NOT NULL DEFAULT 6
);
GRANT SELECT ON public.skill_projects TO authenticated;
GRANT ALL ON public.skill_projects TO service_role;
ALTER TABLE public.skill_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read projects" ON public.skill_projects FOR SELECT TO authenticated USING (true);

-- ========== User tables ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  username text NOT NULL UNIQUE,
  github_username text,
  target_role_id int REFERENCES public.roles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_id int NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level numeric(4,3) NOT NULL CHECK (level >= 0 AND level <= 1),
  taken_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessments_user_idx ON public.assessments(user_id, skill_id, taken_at DESC);
GRANT SELECT, INSERT, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own assessments" ON public.assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own assessments" ON public.assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_tasks (
  user_id uuid NOT NULL,
  task_id int NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
  week int,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','done')),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, task_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tasks TO authenticated;
GRANT ALL ON public.user_tasks TO service_role;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own tasks" ON public.user_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own tasks" ON public.user_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tasks" ON public.user_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own tasks" ON public.user_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.plans (
  user_id uuid PRIMARY KEY,
  hours_per_week int NOT NULL CHECK (hours_per_week BETWEEN 1 AND 60),
  target_date date NOT NULL,
  start_date date NOT NULL,
  estimated_finish date,
  last_rebalanced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own plan" ON public.plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own plan" ON public.plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plan" ON public.plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own plan" ON public.plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Verifications are written only by the server after checking GitHub, so students cannot mark themselves verified.
CREATE TABLE public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_id int NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  repo_url text NOT NULL,
  status text NOT NULL CHECK (status IN ('verified','needs_review')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
GRANT SELECT ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own verifications" ON public.verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ========== Profile on sign-up ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  base := regexp_replace(lower(split_part(coalesce(NEW.email, 'student'), '@', 1)), '[^a-z0-9]', '', 'g');
  IF base = '' THEN base := 'student'; END IF;
  INSERT INTO public.profiles (id, name, username)
  VALUES (
    NEW.id,
    coalesce(nullif(NEW.raw_user_meta_data->>'name', ''), nullif(NEW.raw_user_meta_data->>'full_name', ''), split_part(coalesce(NEW.email, ''), '@', 1)),
    left(base, 20) || '-' || substr(md5(random()::text || NEW.id::text), 1, 5)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== Public profile (only verified data) ==========
CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
  readiness numeric;
  has_assessment boolean;
  result jsonb;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE lower(username) = lower(_username);
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT EXISTS (SELECT 1 FROM public.assessments a WHERE a.user_id = p.id) INTO has_assessment;

  IF has_assessment AND p.target_role_id IS NOT NULL THEN
    WITH latest AS (
      SELECT DISTINCT ON (skill_id) skill_id, level
      FROM public.assessments WHERE user_id = p.id
      ORDER BY skill_id, taken_at DESC
    )
    SELECT round(100 * sum(rs.demand_weight * coalesce(l.level, 0)) / nullif(sum(rs.demand_weight), 0))
    INTO readiness
    FROM public.role_skills rs LEFT JOIN latest l ON l.skill_id = rs.skill_id
    WHERE rs.role_id = p.target_role_id;
  END IF;

  SELECT jsonb_build_object(
    'name', p.name,
    'username', p.username,
    'github_username', p.github_username,
    'role', (SELECT r.name FROM public.roles r WHERE r.id = p.target_role_id),
    'readiness', readiness,
    'verified', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'skill', s.name,
        'project', sp.title,
        'repo_url', v.repo_url,
        'checked_at', v.checked_at
      ) ORDER BY s.name)
      FROM public.verifications v
      JOIN public.skills s ON s.id = v.skill_id
      LEFT JOIN public.skill_projects sp ON sp.skill_id = s.id
      WHERE v.user_id = p.id AND v.status = 'verified'
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated, service_role;

-- ========== Seed data ==========
INSERT INTO public.roles (id, name, active) VALUES
  (1, 'Front-End Developer', true),
  (2, 'Back-End Developer', false),
  (3, 'Data Analyst', false);
SELECT setval('public.roles_id_seq', 3);

INSERT INTO public.skills (id, slug, name, category, prerequisites, languages) VALUES
  (1, 'html', 'HTML', 'Foundations', '{}', '{HTML}'),
  (2, 'css', 'CSS', 'Foundations', '{html}', '{CSS,SCSS,Sass,Less}'),
  (3, 'javascript', 'JavaScript', 'Programming', '{css}', '{JavaScript,TypeScript}'),
  (4, 'git', 'Git', 'Tooling', '{css}', '{}'),
  (5, 'react', 'React', 'Frameworks', '{javascript}', '{JavaScript,TypeScript}'),
  (6, 'responsive', 'Responsive Design', 'Foundations', '{css}', '{CSS,SCSS,HTML}'),
  (7, 'rest-apis', 'REST APIs and fetch', 'Programming', '{javascript}', '{JavaScript,TypeScript}'),
  (8, 'tailwind', 'Tailwind CSS', 'Frameworks', '{css}', '{CSS,HTML,JavaScript,TypeScript}'),
  (9, 'accessibility', 'Accessibility', 'Quality', '{html}', '{HTML,JavaScript,TypeScript,CSS}');
SELECT setval('public.skills_id_seq', 9);

INSERT INTO public.role_skills (role_id, skill_id, demand_weight) VALUES
  (1, 1, 10), (1, 2, 9), (1, 3, 10), (1, 4, 6), (1, 5, 8),
  (1, 6, 7), (1, 7, 6), (1, 8, 5), (1, 9, 4);

INSERT INTO public.questions (skill_id, question, options, correct_index) VALUES
  (1, 'Which element is the best choice for the main navigation links of a page?', '["<div class=\"nav\">", "<nav>", "<section>", "<menu>"]', 1),
  (1, 'What does the alt attribute on an <img> provide?', '["A tooltip shown on hover", "A fallback image URL", "A text alternative for screen readers and broken images", "The image caption"]', 2),
  (2, 'Which selector has the highest specificity?', '[".card p", "#hero", "div p", "p:first-child"]', 1),
  (2, 'With box-sizing: border-box, the width of an element includes…', '["Only the content", "Content and padding", "Content, padding and border", "Content, padding, border and margin"]', 2),
  (3, 'What does `const` prevent?', '["Changing properties of an object it holds", "Re-assigning the variable", "Using the variable in a function", "Hoisting of any kind"]', 1),
  (3, 'What is the result of `[1, 2, 3].map(n => n * 2)`?', '["[1, 2, 3]", "6", "[2, 4, 6]", "undefined"]', 2),
  (4, 'Which command creates a new branch and switches to it?', '["git branch -d feature", "git switch -c feature", "git merge feature", "git push feature"]', 1),
  (4, 'What does `git commit` do?', '["Uploads changes to GitHub", "Records staged changes in the local history", "Downloads the latest changes", "Deletes untracked files"]', 1),
  (5, 'How should you update state that depends on the previous value?', '["setCount(count++)", "count = count + 1", "setCount(c => c + 1)", "this.count += 1"]', 2),
  (5, 'Why does React need a `key` prop on list items?', '["To style each item", "To identify items between renders", "To make items clickable", "To sort the list"]', 1),
  (6, 'Which meta tag is essential for responsive pages on phones?', '["<meta charset=\"utf-8\">", "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", "<meta name=\"robots\">", "<meta http-equiv=\"refresh\">"]', 1),
  (6, 'A mobile-first media query usually looks like…', '["@media (max-width: 600px)", "@media (min-width: 768px)", "@media print", "@media (orientation: portrait)"]', 1),
  (7, 'Which HTTP method is conventionally used to create a new resource?', '["GET", "POST", "DELETE", "HEAD"]', 1),
  (7, 'What does `fetch()` return?', '["The JSON body directly", "A Promise that resolves to a Response", "An XMLHttpRequest", "A string"]', 1),
  (8, 'In Tailwind, what does `md:flex` mean?', '["Flex on medium screens and up", "Flex only on medium screens", "Medium flex-grow", "Flex with medium gap"]', 0),
  (8, 'Where do you define custom design tokens in Tailwind CSS v4?', '["In a <style> tag per component", "In CSS with @theme", "In package.json", "Only in inline styles"]', 1),
  (9, 'Which is the most accessible way to make a clickable control?', '["<div onclick>", "<span role=\"link\">", "<button>", "<a> without href"]', 2),
  (9, 'What is the minimum contrast ratio WCAG AA requires for normal body text?', '["2:1", "3:1", "4.5:1", "7:1"]', 2);

INSERT INTO public.roadmap_tasks (skill_id, title, description, est_hours, resource_url, seq) VALUES
  (1, 'Learn document structure', 'Build a page with head, body, headings and paragraphs, and validate it.', 3, 'https://developer.mozilla.org/en-US/docs/Web/HTML', 1),
  (1, 'Use semantic elements', 'Rewrite a div-heavy layout with header, nav, main, article and footer.', 2, 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics', 2),
  (1, 'Build an accessible form', 'Create a sign-up form with labels, input types and built-in validation.', 3, 'https://www.freecodecamp.org/learn', 3),
  (2, 'Master the box model', 'Practise margin, padding, border and box-sizing on a card component.', 2, 'https://developer.mozilla.org/en-US/docs/Web/CSS', 1),
  (2, 'Lay out with Flexbox', 'Build a navbar and a card row using Flexbox alignment.', 3, 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout', 2),
  (2, 'Lay out with Grid', 'Recreate a magazine-style page layout using CSS Grid.', 3, 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout', 3),
  (3, 'Core language basics', 'Variables, types, functions, arrays and objects with small exercises.', 5, 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 1),
  (3, 'Manipulate the DOM', 'Select elements, handle events and update the page without reloading.', 4, 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model', 2),
  (3, 'Async JavaScript', 'Understand promises and async/await with timed examples.', 3, 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', 3),
  (4, 'Your first repository', 'Init a repo, stage, commit and read the log.', 2, 'https://git-scm.com/book/en/v2', 1),
  (4, 'Branch and merge', 'Create a feature branch, merge it and resolve a simple conflict.', 2, 'https://git-scm.com/docs/git-branch', 2),
  (5, 'Components and props', 'Break a UI into components and pass data with props.', 4, 'https://react.dev/learn', 1),
  (5, 'State and events', 'Add interactivity with useState and event handlers.', 4, 'https://react.dev/learn/managing-state', 2),
  (5, 'Thinking in React', 'Plan and build a filterable product table from a mock.', 4, 'https://react.dev/learn/thinking-in-react', 3),
  (6, 'Mobile-first media queries', 'Make a two-column page collapse gracefully on small screens.', 2, 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries', 1),
  (6, 'Fluid images and type', 'Use relative units, max-width and clamp() for fluid layouts.', 2, 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design', 2),
  (7, 'HTTP fundamentals', 'Learn methods, status codes and headers.', 2, 'https://developer.mozilla.org/en-US/docs/Web/HTTP', 1),
  (7, 'Fetch data from an API', 'Call a public JSON API, show loading and error states.', 3, 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', 2),
  (8, 'Utility-first basics', 'Style a card and a button using only utility classes.', 2, 'https://tailwindcss.com/docs/styling-with-utility-classes', 1),
  (8, 'Responsive and state variants', 'Use md:, hover: and focus: variants on a landing section.', 2, 'https://tailwindcss.com/docs/responsive-design', 2),
  (9, 'Accessibility fundamentals', 'Learn who benefits and the POUR principles.', 2, 'https://developer.mozilla.org/en-US/docs/Web/Accessibility', 1),
  (9, 'Keyboard and screen reader check', 'Navigate a page with only the keyboard and fix focus issues.', 2, 'https://www.w3.org/WAI/fundamentals/accessibility-intro/', 2);

INSERT INTO public.skill_projects (skill_id, title, description, est_hours) VALUES
  (1, 'Personal portfolio page', 'A single semantic HTML page introducing you, your skills and contact links.', 5),
  (2, 'Styled recipe card gallery', 'A gallery of recipe cards using Flexbox and Grid with a consistent theme.', 6),
  (3, 'Interactive quiz game', 'A vanilla JavaScript quiz with score tracking and a restart button.', 8),
  (4, 'Collaborative notes repo', 'A repository with a clean commit history, branches and a merged pull request.', 3),
  (5, 'Task tracker app', 'A React to-do app with add, complete, filter and local persistence.', 10),
  (6, 'Responsive landing page', 'A product landing page that looks great from 320px phones to wide desktops.', 6),
  (7, 'Weather app', 'Fetch live weather for a city from a public API with loading and error states.', 8),
  (8, 'Tailwind pricing page', 'A pricing section with three plans built entirely with Tailwind utilities.', 4),
  (9, 'Accessible sign-up form', 'A form with labels, error messages, focus states and keyboard support.', 4);