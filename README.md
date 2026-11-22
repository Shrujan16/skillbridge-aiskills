# BrandLens

**Catch the errors in your content before your audience does.**

BrandLens is a pre-publication brand-governance web app. Content (a post, ad, email or document) is checked against an organisation's approved brand guidelines, approved facts, terminology and visual rules before it is published. Every issue comes back with the rule it breaks and a suggested correction, and a human reviewer makes the final approval.

Built by **Team SMACKS** for **CodeZen India 2026** (Problem Statement by Inkloom AI).

- **Live product:** https://brand-ailens.lovable.app (no sign-in needed)
- **Repository:** https://github.com/Shrujan16/brand-ailens
- **Demo brand:** GreenLeaf Organics, a fictional organic-snacks brand created for this hackathon. No real confidential data is used.

## The problem

Organisations publish content through many employees, agencies and AI tools. Wrong prices, unsupported claims, inconsistent names and off-brand visuals are usually noticed only after publication, when credibility is already damaged. Style guides are static PDFs, manual review is slow and inconsistent, and a plain rejection does not explain how to fix the content.

## Try it in 60 seconds

1. Open the live link. No login is needed.
2. On **Create**, click **Load example**, then **Run Brand Check**. You can also paste your own text or upload a DOCX or PDF.
3. Read each finding: the exact text, the rule or approved fact it breaks, a plain explanation and a suggested correction. **Accept**, **Edit** or **Dismiss** (a reason is required to dismiss).
4. Optionally press **Suggest revision** for an AI rewrite that cites the approved facts it used.
5. Click **Submit for review**, switch the role toggle to **Reviewer**, open the submission, comment, then **Approve** or **Request changes**. Submissions with high-risk claims are escalated and need a reviewer note before approval.
6. Explore **Brand Knowledge** (guidelines, facts, terminology, claims rules) and **Insights** (recurring issue types).

## Features

**Core (Round 2)**
- Creator studio: paste text, choose content type (post, ad, email, document), optional image with alt text and a text-on-colour check
- Deterministic TypeScript rule engine: tone and hype words, terminology, approved-fact mismatches (prices, delivery terms, dates), exaggerated claims, image alt text, colour contrast, basic spelling and grammar
- Finding cards with exact text, cited rule or fact, explanation and suggested correction
- Accept / Edit / Dismiss flow (dismissing needs a reason)
- Review workflow: submit, reviewer queue, comments, Approve or Request changes, status and revision history
- Creator / Reviewer role toggle (only a Reviewer can approve)
- Brand Knowledge page to view and edit guidelines, approved facts and terminology
- Insights page showing recurring issue types
- Plain-language explainer: who it is for, what it can and cannot check, how it works

**Added in Round 3 (the three promised improvements)**
1. **Claims and regulatory rule pack.** Flags health claims, absolute guarantees, unproven superlatives, proof claims with no approved source, unconditional offers and certification claims as *Risky claim* findings, each with a plain reason, the rule triggered and safer wording. High-risk items show an *Escalated* badge and cannot be approved until a reviewer confirms and saves a note in the audit log. Rules are editable on the Brand Knowledge page. Not legal advice.
2. **DOCX and PDF upload.** Files up to 5 MB are read in the browser, shown for review, split into paragraphs or pages, and every finding shows where it came from. Wrong-type, oversized, empty, scanned and corrupted files get a clear message.
3. **Grounded AI suggestions.** *Suggest revision* sends only the user's text plus the relevant active rules and approved facts. The model must use only those facts and return the rewrite and the rules or facts it used. The rule engine re-checks the rewrite; if it adds a new high-risk finding, invents numbers, fails or times out, rule-based fixes are shown instead with an "AI unavailable" notice.

**Also improved:** handling of empty, whitespace-only and over-long input; duplicate-click protection; draft kept on refresh; loading, error, empty and retry states; status badges; helper text; keyboard-accessible, phone-friendly layout; a Reviewer-only *Reset demo data* button.

## Known limitations

- Video is not supported.
- Poster analysis (logo, brand colours, text inside images) is not built; images get alt-text and contrast checks only.
- Scanned PDFs without a text layer are not read (no OCR).
- Roles use a toggle, not real accounts, so this demonstrates the workflow rather than production access control.
- Rule-based checks can miss nuance, spelling and grammar checks are basic, and the claims rules are a starting set. BrandLens is **not legal advice**.

## Architecture

```
Content (typed, or text extracted from DOCX/PDF in the browser)
        |
        v
Rule engine (TypeScript, deterministic)  --->  Findings (each cites a rule or approved fact)
        |                                              |
        |                                      Accept / Edit / Dismiss
        v                                              |
Optional AI suggestion (server-side function) <---- relevant rules + approved facts only
        |  re-checked by the rule engine, rule-based fallback on failure
        v
Submit for review ---> Reviewer queue ---> comments, Approve / Request changes ---> audit log
```

Key decisions:
- **Rules first, AI second.** Core checks are deterministic, so results are repeatable and explainable. AI is optional and never decides alone.
- **Every finding cites its source.** Nothing is flagged without a rule or approved fact behind it.
- **Humans decide.** Only a Reviewer can approve, and escalated items need a recorded reviewer note.
- **Graceful failure.** If the AI or a file parse fails, the user sees a clear message and the rule-based workflow keeps working.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui (built with Lovable) |
| Backend and database | Supabase (PostgreSQL) with Drizzle ORM |
| Rule engine | TypeScript, deterministic |
| Document parsing | mammoth (DOCX), pdf.js / pdfjs-dist (PDF), in the browser |
| AI | Lovable AI (the platform's built-in AI gateway), called only from a server-side function; no API key is stored in this repository |
| Hosting | Lovable publishing |
| Source control | GitHub |

## Testing

Manual end-to-end tests on the live link in a private window. Anyone can repeat them:

| # | Journey | Expected behaviour |
|---|---|---|
| 1 | Load example, run check, accept a fix, submit, approve as Reviewer | Whole workflow completes; status becomes Approved |
| 2 | Risky-claim text | Risky claim findings appear, Escalated badge shows, Approve needs a reviewer note |
| 3 | Upload a DOCX | Text extracted into the editor; findings name the paragraph |
| 4 | Upload a PDF | Text extracted; findings name the page |
| 5 | Upload a scanned, empty, oversized or wrong-type file | Clear message; app keeps working |
| 6 | Empty, whitespace-only and very long input | Check is blocked with a hint or a clear limit message |
| 7 | Double-click Run Brand Check and Submit | Only one submission is created |
| 8 | Refresh with a draft in progress | Draft is restored |
| 9 | Suggest revision when the AI is unavailable | Rule-based fixes shown with an "AI unavailable" notice |
| 10 | Phone-size screen | No sideways scrolling; all buttons reachable |

**User testing:** working IT professionals tried the product in Round 2 and reported the core flow worked. They asked for a clearer purpose, a stated audience, honest format support and spelling and grammar checks; all were added.

## Run locally

```bash
git clone https://github.com/Shrujan16/brand-ailens.git
cd brand-ailens
npm install
npm run dev
```

The app reads its backend URL and public key from environment variables (see `.env`). Use your own project's values and never commit API keys or other secrets.

## Disclosures

- **AI-assisted development:** the app was built with **Lovable** (AI app builder). Planning, prompts and documents were prepared with help from **Claude** (Anthropic).
- **AI in the product:** optional *Suggest revision* uses Lovable AI, called from a server-side function. Content is sent to it only when the user presses the button.
- **External services:** Lovable (build and hosting), Supabase (database), GitHub (source control).
- **Libraries:** React, Vite, Tailwind CSS, shadcn/ui, Drizzle ORM, mammoth, pdf.js, Recharts, Vitest.
- **Templates and earlier work:** only the Lovable starter scaffold; no earlier project code was reused.
- **Data:** the demo brand, its rules, facts and sample content are fictional and written by the team. Some sample posts were pasted by testers.

## Roadmap

1. **Next month:** poster and image analysis (in-image text, logo and brand-colour checks); real accounts and organisation workspaces.
2. **Months 1 to 3:** Google Docs, Slack and CMS integrations; Hindi and Kannada support; per-team governance analytics.
3. **Months 3 to 6:** industry and region-specific claims packs reviewed by compliance experts; learning from reviewer decisions with admin approval of rule changes; video caption and script checks.
4. **Later:** SSO, audit exports, private or self-hosted AI options.

## Team SMACKS

| Member | Role |
|---|---|
| C Shrujan Reddy (Team Leader) | Coordination, Lovable build, GitHub, deployment |
| Manya K | Frontend design review |
| Sharan K S | Testing the full flow and bug reports |
| Kusumanjali N T | UI/UX review |
| Shiva Prasad Pattanshetti | Testing, feedback collection and documentation |
| Amaresh S | Brand rules, approved facts and AI prompts |
