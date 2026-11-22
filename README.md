# SkillBridge

**An AI-powered, job-market-aware career roadmap platform that turns a student's skill gap into a weekly plan and verified proof of skills.**

Built by **Team SMACKS** for **Prasunex Innovathon 2026** (Software Development track), Nagarjuna College of Engineering and Technology.

- **Live demo:** https://skillbridge-aiskills.lovable.app
- **Demo video:** ADD-VIDEO-LINK-HERE
- **Demo login:** `1nc24cs033@ncetmail.com` / `Shrujan@8765`

---

## The problem

Engineering students do not fail to get internships for lack of resources. They fail because they do not know which skills employers want right now, how far they are from them, and how to prove the skills they build. Existing tools solve one slice of this: a course site teaches, a roadmap site lists topics, a job board lists openings. None connects what employers ask for to what a student already knows, and then to verified evidence.

## The solution: Assess, Match, Plan, Prove

1. **Assess:** the student picks a target role and takes a short quiz with familiarity ratings.
2. **Match:** the result is compared with a skill-demand map to produce a Role Readiness Score and a ranked list of gaps.
3. **Plan:** a roadmap with curated resources and a week-by-week plan sized to the student's available hours.
4. **Prove:** projects linked to GitHub are checked and marked Verified on a shareable public profile.

## Features

### Core (MVP)
- Student accounts and profiles (email and GitHub sign-in)
- Role selection (Front-End Developer live; Back-End and Data Analyst planned)
- Skill assessment: quiz plus familiarity rating per skill
- Role Readiness Score and gap dashboard (Completed / In progress / Needs practice)
- Roadmap with ordered tasks and reviewed learning links
- Progress tracking with a weekly streak
- Project suggestions linked to each skill

### Innovation
- **Market-Match Engine:** each role is defined by a skill-demand map, with skills weighted by how often they appear in internship and entry-level job postings
- **Adaptive Weekly Planner:** rule-based scheduling from the student's weekly hours and target date; re-balances when tasks are missed
- **Proof-of-Skill verification:** a skill is marked Verified only if the linked repository is public, belongs to the connected GitHub account, has commits authored by that account, has a README, and uses a relevant language
- **Shareable public skill profile** showing verified skills and projects

## How the scoring works

```text
level (0 to 1)    = 0.7 x quiz score + 0.3 x (familiarity / 5)
Readiness %       = 100 x SUM(weight x level) / SUM(weight)
Gap               = weight x (1 - level)
```

Status labels: **Completed** (level 0.8 or higher), **In progress** (0.4 to 0.79), **Needs practice** (below 0.4). Gaps are ranked by value, with prerequisites first (HTML, CSS, JavaScript, then React).

Worked example (illustrative values):

| Skill      | Weight | Level | Gap |
|------------|-------:|------:|----:|
| HTML       | 10     | 0.9   | 1.0 |
| CSS        | 9      | 0.7   | 2.7 |
| JavaScript | 10     | 0.5   | 5.0 |
| Git        | 6      | 0.3   | 4.2 |
| React      | 8      | 0.0   | 8.0 |

Readiness = (9 + 6.3 + 5 + 1.8 + 0) / 43 = **51%**

## Architecture

```text
Student (browser / mobile)
  React + Vite + Tailwind CSS
          |
          v   HTTPS / JWT
Secure server functions (Edge Functions)
  Planner logic | GitHub verification | optional AI explainer
          |
          v
Supabase: Auth + PostgreSQL (row-level security) + storage
          |
          +-- Skill-demand map (curated from sample job postings)
          +-- GitHub public API (repository signals)
```

## Tech stack

| Layer            | Technology                                  |
|------------------|---------------------------------------------|
| Frontend         | React, Vite, Tailwind CSS, Recharts         |
| Backend and DB   | Supabase (Auth, PostgreSQL, Edge Functions) |
| Verification     | GitHub public REST API                      |
| Version control  | GitHub                                      |
| Hosting          | Lovable hosting / Vercel                    |

## Database schema

`profiles`, `roles`, `skills`, `role_skills` (demand weight), `questions`, `assessments`, `roadmap_tasks`, `user_tasks`, `verifications`. Row-level security ensures each student can only read and write their own data; the public profile exposes only verified skills.

## Scope note

The prototype demonstrates the complete flow for the **Front-End Developer** role. The skill-demand map is curated from a sample of internship and entry-level postings. Additional roles, scheduled job-data refresh and college-level dashboards are planned extensions, not part of this build.

## Run locally

```bash
git clone <this-repository-url>
cd <repository-folder>
npm install
cp .env.example .env     # add your Supabase URL and anon (public) key
npm run dev
```

Required environment variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never commit secret keys. Server-side keys stay in the Supabase Edge Function settings.

## Team SMACKS

| Member                    | Focus                                          |
|---------------------------|------------------------------------------------|
| C Shrujan Reddy (Leader)  | Coordination, integration and submission       |
| Sharan KS                 | Frontend pages and responsive styling          |
| Manya K                   | Frontend logic: assessment, roadmap, progress  |
| Kusumanjali N T           | Backend: Supabase, authentication, database    |
| ShivaPrasad Pattanshetti  | Planner logic, GitHub verification             |
| Amaresh S                 | UI/UX, testing, documentation and demo         |
