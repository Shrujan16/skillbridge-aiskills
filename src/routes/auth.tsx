import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { DEMO_EMAIL, DEMO_PASSWORD, ensureDemoAccount } from "@/lib/demo.functions";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
  demo: z.boolean().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — SkillBridge" },
      { name: "description", content: "Sign in or create your SkillBridge account to start your career roadmap." },
      { property: "og:title", content: "Sign in — SkillBridge" },
      { property: "og:description", content: "Sign in or create your SkillBridge account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address");
const passwordSchema = z.string().min(8, "Use at least 8 characters");

function safeRedirect(r: string | undefined) {
  if (!r) return "/dashboard";
  try {
    const url = new URL(r, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname.startsWith("/auth")) return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

function friendlyOAuthError(message: string) {
  if (/cancel|closed|access_denied|denied/i.test(message)) {
    return "Sign-in was cancelled. You can try again or use your email and password.";
  }
  return "We couldn't sign you in with Google. Please try again or use your email and password.";
}

function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "form" | "demo" | "google">(null);
  const prepareDemo = useServerFn(ensureDemoAccount);
  const demoStarted = useRef(false);

  const go = () => navigate({ to: safeRedirect(search.redirect), replace: true });

  useEffect(() => {
    // Friendly message when a provider sends the user back with an error (e.g. they cancelled).
    const params = new URLSearchParams(window.location.search + "&" + window.location.hash.replace(/^#/, ""));
    const oauthError = params.get("error");
    if (oauthError) {
      toast.error(friendlyOAuthError(oauthError + " " + (params.get("error_description") ?? "")));
      window.history.replaceState(null, "", window.location.pathname);
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !search.demo) go();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (search.demo && !demoStarted.current) {
      demoStarted.current = true;
      void startDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.demo]);

  async function startDemo() {
    setBusy("demo");
    try {
      await prepareDemo();
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (error) throw error;
      toast.success("Welcome to the demo account");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open the demo. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    if (!em.success) next["email"] = em.error.issues[0]!.message;
    if (mode !== "forgot") {
      const pw = passwordSchema.safeParse(password);
      if (!pw.success) next["password"] = pw.error.issues[0]!.message;
    }
    if (mode === "signup" && name.trim().length < 2) next["name"] = "Tell us your name";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy("form");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
        setMode("signin");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin, data: { name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created — let's pick your target role.");
          navigate({ to: "/onboarding", replace: true });
        } else {
          toast.success("Account created. Check your email to confirm, then log in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        go();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(
        /invalid login/i.test(msg)
          ? "That email and password don't match."
          : /already registered/i.test(msg)
            ? "An account with this email already exists. Try logging in."
            : msg,
      );
    } finally {
      setBusy(null);
    }
  }

  async function social(provider: "google") {
    setBusy(provider);
    try {
      // Return to this public page; it forwards to the dashboard, which sends first-time users to onboarding.
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) {
        toast.error(friendlyOAuthError(result.error.message));
        setBusy(null);
        return;
      }
      if (result.redirected) return;
      go();
    } catch (e) {
      toast.error(friendlyOAuthError(e instanceof Error ? e.message : ""));
      setBusy(null);
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <div className="grid min-h-screen bg-hero lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Start with a 10-minute assessment and get your roadmap."
              : mode === "forgot"
                ? "We'll email you a link to set a new password."
                : "Log in to continue your roadmap."}
          </p>

          {mode !== "forgot" && (
            <div className="mt-6 grid gap-2">
              <Button type="button" variant="outline" size="lg" onClick={() => social("google")} disabled={busy !== null}>
                {busy === "google" ? <Loader2 className="animate-spin" /> : <GoogleLogo />}
                Continue with Google
              </Button>
              <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
            {mode === "signup" && (
              <Field id="name" label="Full name" error={errors["name"]}>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Priya Sharma" />
              </Field>
            )}
            <Field id="email" label="Email" error={errors["email"]}>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@college.edu" />
            </Field>
            {mode !== "forgot" && (
              <Field
                id="password"
                label="Password"
                error={errors["password"]}
                extra={
                  mode === "signin" && (
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>
                      Forgot password?
                    </button>
                  )
                }
              >
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="At least 8 characters"
                />
              </Field>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy !== null}>
              {busy === "form" && <Loader2 className="animate-spin" />}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signin")}>
                  Log in
                </button>
              </>
            ) : (
              <>
                New to SkillBridge?{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </>
            )}
          </p>

          <div className="surface-card mt-8 flex items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <p className="font-semibold">Just exploring?</p>
              <p className="text-muted-foreground">Open a demo account with sample progress.</p>
            </div>
            <Button variant="soft" onClick={startDemo} disabled={busy !== null}>
              {busy === "demo" ? <Loader2 className="animate-spin" /> : <Sparkles />} Demo
            </Button>
          </div>
        </div>
        <Link to="/" className="text-center text-xs text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 grid-dots opacity-40" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-accent opacity-40 blur-3xl" aria-hidden="true" />
        <blockquote className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-tight">"I stopped guessing what to learn next. The plan told me — and the badges proved it."</p>
          <footer className="mt-4 text-sm opacity-80">Third-year CSE student, front-end track</footer>
        </blockquote>
      </div>
    </div>
  );
}

function Field({ id, label, error, extra, children }: { id: string; label: string; error?: string | undefined; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {extra}
      </div>
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
