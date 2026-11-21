import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground shadow-card">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M3 17c3-6 6-9 9-9s6 3 9 9" />
          <path d="M7 17v-3M12 17V8M17 17v-3" />
        </svg>
      </span>
      SkillBridge
    </Link>
  );
}
