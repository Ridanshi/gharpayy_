import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Bell, Building2, CalendarDays, Command, KanbanSquare, LayoutDashboard, LogOut, Moon, Search, Sparkles, Sun, UsersRound, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { useEffect, useState } from "react";
import { ActionModal } from "@/components/layout/ActionModal";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@/types";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: UsersRound },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/visits", label: "Tours", icon: CalendarDays },
  { to: "/properties", label: "Inventory", icon: Building2 },
  { to: "/reservations", label: "Reservations", icon: WalletCards },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

const roleCopy = {
  Admin: "Founder view",
  "Sales Ops": "Ops control",
  "Sales Agent": "Personal queue"
};

export function AppShell() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: feed = [] } = useQuery({ queryKey: ["notifications-feed"], queryFn: () => api<Activity[]>("/activity"), refetchInterval: 30000 });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="app-atmosphere min-h-screen noise">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.025),transparent_28%)]" />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/70 bg-card/78 shadow-[12px_0_60px_rgba(0,0,0,.18)] backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-b from-orange-400 to-orange-600 text-primary-foreground shadow-orange-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold tracking-tight">FlowOps AI</p>
              <p className="text-xs text-muted-foreground">{user?.role ? roleCopy[user.role] : "Operations intelligence"}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn("group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition duration-300 hover:translate-x-0.5 hover:bg-muted/70 hover:text-foreground", isActive && "border border-primary/15 bg-accent/80 text-accent-foreground shadow-orange-glow")
                }
              >
                <item.icon className="h-4 w-4 transition group-hover:scale-110" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-border/70 bg-background/58 p-3 shadow-dark-soft backdrop-blur">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name ?? "User"} src={user?.avatar} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>
      <main className="lg:pl-64">
        <header className="ambient-topbar sticky top-0 z-30 border-b border-border/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button onClick={() => setCommandOpen(true)} className="flex h-10 flex-1 items-center gap-3 rounded-md border border-border/70 bg-card/72 px-3 text-sm text-muted-foreground shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70 lg:max-w-md">
              <Search className="h-4 w-4" />
              Search leads, properties, actions
              <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] sm:inline-flex">Ctrl K</kbd>
            </button>
            <Button variant="secondary" size="icon" onClick={() => setCommandOpen(true)} aria-label="Open command palette">
              <Command className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-2 rounded-md border border-primary/15 bg-card/72 px-3 py-2 text-sm shadow-orange-glow backdrop-blur md:flex">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" /><span className="live-dot relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
              Live ops
            </div>
            <Button variant="secondary" size="icon" aria-label="Notifications" className="relative" onClick={() => setNotificationsOpen((open) => !open)}>
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </Button>
            {notificationsOpen && (
              <div className="absolute right-4 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-card p-2 shadow-2xl">
                <div className="border-b px-3 py-2">
                  <p className="text-sm font-semibold">Operational notifications</p>
                  <p className="text-xs text-muted-foreground">{feed.length} live signals</p>
                </div>
                <div className="max-h-80 overflow-auto py-2">
                  {feed.slice(0, 8).map((item) => (
                    <button key={item._id} className="flex w-full gap-3 rounded-md p-3 text-left transition hover:bg-muted" onClick={() => setNotificationsOpen(false)}>
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shadow-orange-glow" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{item.description ?? item.type}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button variant="secondary" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="lg:hidden">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="relative px-4 py-6 sm:px-6">
          <Outlet />
        </motion.div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t bg-card/95 p-1 backdrop-blur-xl lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("grid place-items-center rounded-md py-2 text-muted-foreground", isActive && "bg-accent text-accent-foreground")}>
            <item.icon className="h-5 w-5" />
            <span className="mt-1 text-[10px]">{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <ActionModal />
    </div>
  );
}
