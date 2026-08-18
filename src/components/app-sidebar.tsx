import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  FileText,
  FlaskConical,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  Library,
  Microscope,
  MessageSquareText,
  Pill,
  ScanEye,
  Settings as SettingsIcon,
  Stethoscope,
  Timer,
  UserRound,
  LogOut,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { auth, logout } from "@/lib/firebase";

const clinical = [
  { title: "Platform Overview", url: "/", icon: Sparkles },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Consultation", url: "/consultation", icon: Stethoscope },
  { title: "Agent Pipeline", url: "/pipeline", icon: Activity },
  { title: "Patient Workspace", url: "/patient", icon: UserRound },
  { title: "Clinical Timeline", url: "/timeline", icon: Timer },
];

const intelligence = [
  { title: "Literature", url: "/literature", icon: Library },
  { title: "Drug Intelligence", url: "/drugs", icon: Pill },
  { title: "Chest X-ray", url: "/imaging", icon: ImageIcon },
  { title: "Knowledge Graph", url: "/graph", icon: GitBranch },
  { title: "Case Similarity", url: "/cases", icon: Microscope },
];

const insight = [
  { title: "Explainability", url: "/explainability", icon: ScanEye },
  { title: "Research", url: "/research", icon: FlaskConical },
  { title: "Report Center", url: "/reports", icon: FileText },
  { title: "Ask MedGuide", url: "/assistant", icon: MessageSquareText },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const group = (label: string, items: typeof clinical) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="gap-2 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
          {label}
          <span className="h-px flex-1 bg-sidebar-border" />
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link to={item.url} className="group/nav relative flex items-center gap-3">
                    <span
                      className={
                        active
                          ? "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          : "hidden"
                      }
                    />
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <Link to="/" className="group flex items-center gap-2 px-2 py-2">
          <div className="relative flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-[#A073D9]/20 shadow-sm ring-1 ring-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 group-hover:animate-pulse" />
            <Brain className="size-6 text-primary transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          {!collapsed && (
            <div className="grid flex-1 text-left leading-tight ml-1 min-w-0">
              <span className="truncate font-display text-lg font-bold tracking-tight bg-gradient-to-r from-primary via-[#A073D9] to-primary bg-clip-text text-transparent animate-text-shimmer">
                MEDGUIDE AI
              </span>
              <span className="truncate text-[0.7rem] uppercase tracking-wider text-muted-foreground/80 font-semibold mt-0.5">
                Clinical Workspace
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {group("Clinical", clinical)}
        {group("Intelligence", intelligence)}
        {group("Insight", insight)}
      </SidebarContent>

      <SidebarFooter>
        <div className="mx-1 mb-2 space-y-2">
          {!collapsed && auth.currentUser && (
            <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 px-2.5 py-2">
              {auth.currentUser.photoURL ? (
                <img
                  src={auth.currentUser.photoURL}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-primary/40"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(
                    auth.currentUser.displayName?.[0] ||
                    auth.currentUser.email?.[0] ||
                    "D"
                  ).toUpperCase()}
                </div>

              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {auth.currentUser.displayName || "Clinician"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {auth.currentUser.email || "clinical-session"}
                </p>
              </div>
            </div>
          )}

          {collapsed ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Sign out"
                  onClick={() => logout()}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="sr-only">Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="rounded border border-sidebar-border/80 px-2.5 py-2">
              <button
                onClick={() => logout()}
                className="group flex w-full items-center gap-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
