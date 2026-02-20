"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Users, Calendar, Trophy, Star, 
  Zap, ArrowUpRight, Clock, Target, Flame,
  ChevronRight, Plus, Code2, GraduationCap
} from "lucide-react";
import Link from "next/link";

const stats = [
  { name: "Events Joined", value: "12", change: "+3", icon: Calendar, color: "blue" },
  { name: "Projects Built", value: "8", change: "+2", icon: Code2, color: "purple" },
  { name: "Current Rank", value: "#42", change: "+5", icon: Trophy, color: "yellow" },
  { name: "Reward Points", value: "2,450", change: "+150", icon: Star, color: "green" },
];

const recentEvents = [
  { title: "AI Workshop Series", date: "Feb 20, 2025", status: "Upcoming", type: "Workshop" },
  { title: "Inter-College Hackathon", date: "Feb 15, 2025", status: "Registered", type: "Hackathon" },
  { title: "Web3 Summit", date: "Jan 28, 2025", status: "Completed", type: "Summit" },
];

const quickActions = [
  { name: "Create Event", icon: Plus, href: "/dashboard/events/create", color: "blue" },
  { name: "Submit Project", icon: Code2, href: "/dashboard/projects/create", color: "purple" },
  // { name: "Find Teammates", icon: Users, href: "/dashboard/team/find", color: "green" },
  // { name: "Browse Resources", icon: GraduationCap, href: "/dashboard/resources", color: "yellow" },
];

export default function DashboardPage() {
  const { user, isSuperAdmin, isCoreTeam, isCollegeLead } = useAuth();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTierColor = (tier) => {
    const colors = {
      BRONZE: "from-orange-600 to-orange-400",
      SILVER: "from-gray-400 to-gray-300",
      GOLD: "from-yellow-500 to-yellow-300",
      PLATINUM: "from-cyan-500 to-blue-400",
    };
    return colors[tier] || colors.BRONZE;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {getGreeting()}, <span className="text-blue-400">{user?.fullName?.split(" ")[0]}</span>
          </h1>
          <p className="text-gray-400">
            Here&apos;s what&apos;s happening in your network today
          </p>
        </div>
        
        {(isSuperAdmin || isCoreTeam || isCollegeLead) && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/20"
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
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="bg-[#0f0f0f] border-white/10 hover:border-white/20 transition-colors group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl bg-${stat.color}-500/10`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Card */}
          <Card className="bg-[#0f0f0f] border-white/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Your Performance
                </CardTitle>
                {/* TODO: Implement analytics page */}
                {/* <Link href="/dashboard/analytics" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View details <ArrowUpRight className="w-4 h-4" />
                </Link> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="12" fill="none" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="56" 
                      stroke="url(#gradient)" 
                      strokeWidth="12" 
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="351"
                      strokeDashoffset="70"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{user?.performance?.score || 0}</span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Rating</span>
                      <span className="text-white font-medium">{user?.performance?.rating || 0}/5.0</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${((user?.performance?.rating || 0) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>{user?.performance?.badges?.length || 0} Badges earned</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>Rank #{user?.performance?.rank || "--"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-[#0f0f0f] border-white/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Recent Activity
                </CardTitle>
                <Link href="/dashboard/events" className="text-sm text-blue-400 hover:text-blue-300">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        event.status === "Completed" ? "bg-green-500/10 text-green-400" :
                        event.status === "Upcoming" ? "bg-blue-500/10 text-blue-400" :
                        "bg-purple-500/10 text-purple-400"
                      }`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-500">{event.date} • {event.type}</p>
                      </div>
                    </div>
                    <Badge className={`${
                      event.status === "Completed" ? "bg-green-500/10 text-green-400" :
                      event.status === "Upcoming" ? "bg-blue-500/10 text-blue-400" :
                      "bg-purple-500/10 text-purple-400"
                    } border-0`}>
                      {event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Rewards Card */}
          <Card className="bg-[#0f0f0f] border-white/10 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(user?.rewards?.tier)} opacity-10`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  Rewards
                </h3>
                <Badge className={`bg-gradient-to-r ${getTierColor(user?.rewards?.tier)} text-white border-0`}>
                  {user?.rewards?.tier || "BRONZE"}
                </Badge>
              </div>
              
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-white mb-1">
                  {user?.rewards?.points?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500">Total Points</p>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Next tier</span>
                  <span className="text-white">{(user?.rewards?.points || 0)}/5000</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getTierColor(user?.rewards?.tier)} rounded-full transition-all`}
                    style={{ width: `${Math.min(((user?.rewards?.points || 0) / 5000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <Button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white rounded-xl">
                Redeem Rewards
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-[#0f0f0f] border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, idx) => (
                  <Link
                    key={idx}
                    href={action.href}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${action.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-6 h-6 text-${action.color}-400`} />
                    </div>
                    <span className="text-sm text-gray-300 text-center">{action.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* College Info */}
          {user?.college && (
            <Card className="bg-[#0f0f0f] border-white/10">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Your College
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {user?.college?.collegeName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.college?.collegeName}</p>
                    <p className="text-sm text-gray-500">
                      {user?.college?.isVerified ? "Verified Chapter" : "Pending Verification"}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/colleges">
                  <Button className="w-full mt-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl">
                    View Chapter
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}