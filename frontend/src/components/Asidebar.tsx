import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Users,
  Zap,
  ShieldCheck,
  Shield,
  Lock,
  LogOut,
  MoonStarIcon,
  SunIcon,
  ChevronsUpDown,
  Sparkles,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import { useAuthContext } from "@/context/auth-provider";
import LogoutDialog from "./LogoutDialog";
import { useTheme } from "@/context/theme-provider";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const Asidebar = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isLoading, user } = useAuthContext();
  const { open } = useSidebar();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/home",
          icon: LayoutDashboard,
        },
        {
          title: "Transactions",
          url: "/transactions",
          icon: ArrowLeftRight,
        },
      ],
    },
    {
      label: "Finances",
      items: [
        {
          title: "Bank Accounts",
          url: "/accounts",
          icon: Landmark,
        },
        {
          title: "People & P2P",
          url: "/people",
          icon: Users,
        },
        {
          title: "Bills & Utilities",
          url: "/bills",
          icon: Zap,
        },
      ],
    },
    {
      label: "Security & Access",
      items: [
        {
          title: "Security & 2FA",
          url: "/security",
          icon: ShieldCheck,
        },
        {
          title: "Active Sessions",
          url: "/sessions",
          icon: Lock,
        },
      ],
    },
    ...(user?.role === "SUPER_ADMIN"
      ? [
          {
            label: "Administration",
            items: [
              {
                title: "User Management",
                url: "/admin/users",
                icon: Shield,
                badge: "Admin",
              },
            ],
          },
        ]
      : []),
  ];

  const isItemActive = (url: string) => {
    if (url === "/home") {
      return location.pathname === "/home" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(url);
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "PF";

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300"
      >
        {/* Sidebar Header */}
        <SidebarHeader className="!p-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-sidebar">
          <div className="flex h-[60px] items-center px-3.5">
            <Logo fontSize="16px" size="34px" url="/home" />
            {open && (
              <div className="flex flex-col ml-3 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/home"
                    className="text-base tracking-tight text-slate-900 dark:text-white font-black leading-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    PesaFlow
                  </Link>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase mt-0.5 truncate">
                  Financial Tracker
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Sidebar Navigation Content */}
        <SidebarContent className="p-2 space-y-4 bg-sidebar">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label} className="p-0">
              {open && (
                <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5 select-none">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => {
                    const active = isItemActive(item.url);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className={`relative h-10 w-full rounded-xl px-3 transition-all duration-200 ${
                            active
                              ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-500/25 shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium"
                          }`}
                        >
                          <Link
                            to={item.url}
                            className="flex items-center gap-3 w-full"
                          >
                            {/* Active Left Indicator Bar */}
                            {active && (
                              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                            )}

                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                                active
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                              }`}
                            />

                            <span
                              className={`text-[13.5px] truncate flex-1 ${
                                active
                                  ? "font-bold text-emerald-950 dark:text-emerald-100"
                                  : "font-medium"
                              }`}
                            >
                              {item.title}
                            </span>

                            {item.badge && open && (
                              <span className="text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                {item.badge}
                              </span>
                            )}

                            {/* Active Right Indicator Dot */}
                            {active && open && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 animate-pulse" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* Sidebar Footer / User Profile */}
        <SidebarFooter className="!p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-sidebar">
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoading ? (
                <div className="flex h-12 items-center justify-center">
                  <MacSpinner size="md" className="text-muted-foreground" />
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all p-2 h-auto"
                    >
                      <Avatar className="h-9 w-9 rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
                        <AvatarFallback className="rounded-xl font-bold text-xs text-emerald-700 dark:text-emerald-300">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>

                      {open && (
                        <>
                          <div className="grid flex-1 text-left text-xs leading-tight ml-2">
                            <span className="truncate font-bold text-slate-900 dark:text-white">
                              {user?.name || "Account"}
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground mt-0.5">
                              {user?.email}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 p-1.5"
                    side="bottom"
                    align="end"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="p-2 font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-bold leading-none text-slate-900 dark:text-white">
                          {user?.name}
                        </p>
                        <p className="text-[11px] leading-none text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/security"
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Security & 2FA</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/sessions"
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Active Sessions</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() =>
                          setTheme(theme === "light" ? "dark" : "light")
                        }
                        className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                      >
                        {theme === "dark" ? (
                          <SunIcon className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <MoonStarIcon className="w-3.5 h-3.5 text-slate-700" />
                        )}
                        <span>
                          Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setIsLogoutOpen(true)}
                      className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <LogoutDialog isOpen={isLogoutOpen} setIsOpen={setIsLogoutOpen} />
    </>
  );
};

export default Asidebar;
