import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarDays, ChevronDown, ExternalLink, FolderGit2, LayoutDashboard, LogOut, Map, UserRound } from "lucide-react";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { FeedbackDialog } from "./FeedbackDialog";
import { PageSkeleton } from "./states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { appDataQuery } from "@/lib/app-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "SB";
}

export function AppShell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Non-suspending read so the shell renders immediately; pages suspend on their own.
  const { data } = useQuery(appDataQuery);
  const profile = data?.profile ?? null;
  const roleName = data?.roles.find((r) => r.id === profile?.target_role_id)?.name ?? null;
  const displayName = profile?.name || data?.user.email || "Student";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen md:pl-60 print:pl-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar md:flex print:hidden">
        <div className="flex h-14 items-center border-b px-4">
          <Logo to="/dashboard" />
        </div>
        <nav className="flex-1 space-y-0.5 p-2" aria-label="Main">
          <p className="px-2.5 pb-1.5 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-primary" }}
            >
              <n.icon className="size-4 text-muted-foreground" />
              {n.label}
            </Link>
          ))}
        </nav>
        {roleName && (
          <div className="border-t p-3">
            <div className="rounded-md border bg-background px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Target role</p>
              <p className="mt-0.5 truncate text-sm font-medium">{roleName}</p>
            </div>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-20 border-b bg-card/85 backdrop-blur print:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="md:hidden">
              <Logo to="/dashboard" />
            </span>
            {roleName && (
              <span className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
                <span className="hidden text-muted-foreground md:inline">Track</span>
                <span className="hidden text-muted-foreground md:inline">/</span>
                <span className="truncate rounded-md border bg-background px-2 py-0.5 font-mono text-xs">{roleName}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <FeedbackDialog />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted" aria-label="Account menu">
                <Avatar className="size-7 rounded-md">
                  <AvatarFallback className="rounded-md bg-primary-soft text-[11px] font-semibold text-primary">{initials(displayName)}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-36 truncate font-medium sm:inline">{displayName}</span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  {data?.user.email && <p className="truncate font-mono text-xs text-muted-foreground">{data.user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserRound /> Profile
                  </Link>
                </DropdownMenuItem>
                {profile?.username && (
                  <DropdownMenuItem asChild>
                    <Link to="/u/$username" params={{ username: profile.username }}>
                      <ExternalLink /> Public profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-12 print:max-w-none print:p-0">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
        aria-label="Main mobile"
      >
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex min-h-11 min-w-0 flex-col items-center gap-1 rounded-md py-2.5 text-[10px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
