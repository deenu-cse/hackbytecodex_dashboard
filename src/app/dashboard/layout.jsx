"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Calendar, Trophy, Users, Settings,
  LogOut, Menu, X, Zap, ChevronRight, Bell,
  Search, Plus, Crown, Shield, GraduationCap,
  BookOpen, MessageSquare, BarChart3, Code2
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { ScrollArea } from "@/components/ui/scroll-area"


const getNavigation = (role, user) => {
  const common = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Projects", href: "/dashboard/projects", icon: Code2 },
    // TODO: Implement leaderboard page
    // { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  ];

  const collegeHref = user?.college?.collegeId?.code
    ? `/dashboard/colleges/${user.college.collegeId.code}`
    : "/dashboard/colleges";

  const firstClub =
    user?.clubs?.[0]?.clubId ||
    user?.clubs?.[0]?.club ||
    user?.clubs?.[0];

  const clubCode =
    firstClub?.code ||
    firstClub?.clubCode ||
    user?.clubs?.[0]?.clubCode ||
    user?.clubs?.[0]?.code;

  const clubHref = clubCode ? `/dashboard/clubs/${clubCode}` : "/dashboard/clubs";

  const roleSpecific = {
    SUPER_ADMIN: [
      { name: "All Colleges", href: "/dashboard/colleges", icon: GraduationCap },
      { name: "Admin Events", href: "/dashboard/admin/events", icon: Calendar },
      // TODO: Implement core team management page
      // { name: "Core Team", href: "/dashboard/team", icon: Shield },
      // TODO: Implement analytics dashboard
      // { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      // TODO: Implement settings page
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    CORE_TEAM: [
      { name: "All Colleges", href: "/dashboard/colleges", icon: GraduationCap },
      // TODO: Implement analytics dashboard
      // { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      // TODO: Implement settings page
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    COLLEGE_LEAD: [
      { name: "My College", href: collegeHref, icon: GraduationCap },
      { name: "Clubs", href: "/dashboard/clubs", icon: BookOpen },
      // TODO: Implement members management page
      // { name: "Members", href: "/dashboard/members", icon: Users },
      // TODO: Implement analytics dashboard
      // { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      // TODO: Implement settings page
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    CLUB_ADMIN: [
      { name: "My Club", href: "/dashboard/clubs", icon: BookOpen },
      // TODO: Implement members management page
      // { name: "Members", href: "/dashboard/members", icon: Users },
      // TODO: Implement settings page
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    MENTOR: [
      // TODO: Implement mentorship page
      // { name: "Mentorship", href: "/dashboard/mentorship", icon: MessageSquare },
      // TODO: Implement resources page
      // { name: "Resources", href: "/dashboard/resources", icon: BookOpen },
      // TODO: Implement settings page
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    STUDENT: [
      { name: "My College", href: collegeHref, icon: GraduationCap },
      { name: "My Club", href: clubHref, icon: BookOpen },
      // TODO: Implement learning dashboard
      // { name: "My Learning", href: "/dashboard/learning", icon: BookOpen },
      // TODO: Implement certificates page
      // { name: "Certificates", href: "/dashboard/certificates", icon: GraduationCap },
      // TODO: Implement settings page
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  };

  return [...common, ...(roleSpecific[role] || [])];
};

const getRoleBadgeColor = (role) => {
  const colors = {
    SUPER_ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    CORE_TEAM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    COLLEGE_LEAD: "bg-green-500/20 text-green-400 border-green-500/30",
    CLUB_ADMIN: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    MENTOR: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    STUDENT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colors[role] || colors.STUDENT;
};

const getRoleIcon = (role) => {
  const icons = {
    SUPER_ADMIN: Crown,
    CORE_TEAM: Shield,
    COLLEGE_LEAD: GraduationCap,
    CLUB_ADMIN: BookOpen,
    MENTOR: MessageSquare,
    STUDENT: Users,
  };
  return icons[role] || Users;
};

export default function DashboardLayout({ children }) {
  const { user, logout, isSuperAdmin, isCoreTeam, isCollegeLead } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigation = user ? getNavigation(user.role, user) : [];
  const RoleIcon = user ? getRoleIcon(user.role) : Users;

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black flex overflow-x-hidden">
        <aside className="hidden lg:flex w-72 h-screen flex-col fixed inset-y-0 left-0
 bg-[#0a0a0a] border-r border-white/10 z-40">

          <div className="h-16 flex items-center px-6 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white italic">
              <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
              <span>hackbyte<span className="text-blue-500">codex</span></span>
            </Link>
          </div>

          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">

                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {user?.fullName
                      ?.split(" ")
                      .map(n => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                <Badge className={`text-xs ${getRoleBadgeColor(user?.role)} mt-1`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {user?.role?.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 h-[200px]">
            <nav className="py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"
                        }`}
                    />

                    {item.name}

                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-white/5 space-y-2">
            {(isSuperAdmin || isCoreTeam || isCollegeLead) && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
                onClick={() => {
                  if (isSuperAdmin) {
                    router.push("/dashboard/admin/events/create");
                  } else {
                    router.push("/dashboard/events/create");
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-white/10 z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white italic">
              <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
              <span>hackbyte<span className="text-blue-500">codex</span></span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">

                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {user?.fullName
                      ?.split(" ")
                      .map(n => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{user?.fullName}</p>
                <Badge className={`text-xs ${getRoleBadgeColor(user?.role)} mt-1`}>
                  {user?.role?.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 h-[500px]">
            <nav className="py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0a0a0a] space-y-2">
            {(isSuperAdmin || isCoreTeam || isCollegeLead) && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
                onClick={() => {
                  if (isSuperAdmin) {
                    router.push("/dashboard/admin/events/create");
                  } else {
                    router.push("/dashboard/events/create");
                  }
                  setSidebarOpen(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 lg:ml-72 flex flex-col min-h-screen max-w-full overflow-x-hidden">
          <header className="h-16 sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <span className="text-gray-400">Dashboard</span>
                {pathname !== "/dashboard" && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white capitalize">
                      {pathname.split("/").pop().replace("-", " ")}
                    </span>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">

                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {user?.fullName
                      ?.split(" ")
                      .map(n => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 overflow-x-hidden max-w-full">
            {children}
          </main>
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 z-40 pb-safe">
          <div className="flex justify-around items-center h-16">
            {navigation.slice(0, 5).map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${isActive ? "text-blue-500" : "text-gray-500 hover:text-gray-300"
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "fill-blue-500/20" : ""}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="lg:hidden h-16" />
      </div>
    </ProtectedRoute>
  );
}