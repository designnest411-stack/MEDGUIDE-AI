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
  Sparkles,
  Stethoscope,
  Timer,
  UserRound,
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
import { Badge } from "@/components/ui/badge";

const clinical = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Consultation", url: "/consultation", icon: Stethoscope },
  { title: "Patient Workspace", url: "/patient", icon: UserRound },
  { title: "Agent Pipeline", url: "/pipeline", icon: Activity },
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
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const group = (label: string, items: typeof clinical) => (
    <SidebarGroup className="py-2">
      {!collapsed && (
        <SidebarGroupLabel className="flex items-center justify-between px-3 mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground/80 font-semibold">
          <span>{label}</span>
          <span className="h-px w-10 bg-sidebar-border/60" />
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.url;
            const isSettings = item.url === "/settings";

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={`relative rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-primary/12 text-primary font-semibold border border-primary/25 shadow-xs"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
                  }`}
                >
                  <Link
                    to={item.url}
                    onClick={handleLinkClick}
                    className="group/nav flex items-center gap-3 px-3 py-2 text-xs"
                  >
                    {active && (
                      <span className="absolute left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                    )}
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110 ${
                        active ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground"
                      }`}
                    />
                    <span className="truncate flex-1">{item.title}</span>

                    {/* Small badge for settings to emphasize configuration */}
                    {isSettings && !collapsed && (
                      <span className="text-[0.6rem] font-mono text-muted-foreground/60 group-hover/nav:text-muted-foreground">
                        pref
                      </span>
                    )}
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl">
      {/* Sidebar Header Brand */}
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <Link
          to="/dashboard"
          onClick={handleLinkClick}
          className="group flex items-center gap-2.5 px-1 py-1 rounded-xl transition-all hover:bg-sidebar-accent/50"
        >
          <div className="relative flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-primary/20 to-primary/10 border border-primary/30 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Brain className="size-5 text-primary" />
            <Sparkles className="absolute -top-1 -right-1 size-3 text-cyan-400 animate-pulse" />
          </div>

          {!collapsed && (
            <div className="grid flex-1 text-left leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-display text-base font-bold tracking-tight text-foreground">
                  MEDGUIDE AI
                </span>
                <Badge
                  variant="outline"
                  className="px-1 py-0 text-[0.55rem] font-mono font-bold border-primary/30 bg-primary/10 text-primary"
                >
                  CLINICAL
                </Badge>
              </div>
              <span className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                Decision Support Suite
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation Content with Generous Bottom Padding so Settings is never cut off */}
      <SidebarContent className="px-2 py-3 pb-8 space-y-2 overflow-y-auto">
        {group("Clinical", clinical)}
        {group("Intelligence", intelligence)}
        {group("Insight", insight)}
      </SidebarContent>

      {/* Clean Status Footer providing ample breathing room below Settings */}
      <SidebarFooter className="border-t border-sidebar-border/50 p-3 bg-sidebar-accent/15 mt-auto">
        {collapsed ? (
          <div className="flex items-center justify-center py-1">
            <span
              className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              title="Clinical Engine Online"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground px-1 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground/80">Clinical Engine Online</span>
            </div>
            <span className="font-mono text-[0.62rem] text-muted-foreground/70">v2.5</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
