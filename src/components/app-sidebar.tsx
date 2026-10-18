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
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
                  <Link
                    to={item.url}
                    onClick={handleLinkClick}
                    className="group/nav relative flex items-center gap-3"
                  >
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
        <Link to="/dashboard" onClick={handleLinkClick} className="group flex items-center gap-2 px-2 py-2">
          <div className="relative flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shadow-sm">
            <Brain className="size-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="grid flex-1 text-left leading-tight ml-1 min-w-0">
              <span className="truncate font-display text-base font-bold tracking-tight text-foreground">
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
    </Sidebar>
  );
}
