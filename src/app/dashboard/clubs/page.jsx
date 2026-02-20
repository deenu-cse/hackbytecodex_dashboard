"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Users, Trophy, Star, TrendingUp,
  MoreHorizontal, ArrowUpRight, Shield, Crown,
  Calendar, Code2, Target, Zap, Filter, X,
  ChevronDown, Loader2, AlertCircle
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getTierColor = (tier) => {
  const colors = {
    BRONZE: "from-orange-600/20 to-orange-400/20 border-orange-500/30 text-orange-400",
    SILVER: "from-gray-400/20 to-gray-300/20 border-gray-400/30 text-gray-300",
    GOLD: "from-yellow-500/20 to-yellow-300/20 border-yellow-500/30 text-yellow-400",
    PLATINUM: "from-cyan-500/20 to-blue-400/20 border-cyan-500/30 text-cyan-400"
  };
  return colors[tier] || colors.BRONZE;
};

const getTierGradient = (tier) => {
  const gradients = {
    BRONZE: "from-orange-600 to-orange-400",
    SILVER: "from-gray-400 to-gray-300",
    GOLD: "from-yellow-500 to-yellow-300",
    PLATINUM: "from-cyan-500 to-blue-400"
  };
  return gradients[tier] || gradients.BRONZE;
};

export default function ClubsPage() {
  const { user, isCollegeLead, isStudent, isAuthenticated } = useAuth();
  const router = useRouter();
  const canManage = isCollegeLead;
  const canView = isCollegeLead || isStudent;
  
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchClubs = useCallback(async () => {
    if (!user?.college?.collegeId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterTier !== "ALL" && { tier: filterTier }),
        sortBy: "score"
      });

      const response = await fetch(
        `${API_URL}/clubs/college/${user.college.collegeId._id}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("codexdashtoken");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch clubs");
      }

      const data = await response.json();
      
      if (data.success) {
        setClubs(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || "Failed to fetch clubs");
      }
    } catch (err) {
      console.error("Fetch clubs error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.college?.collegeId, pagination.page, pagination.limit, debouncedSearch, filterTier, router]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      fetchClubs();
    }
  }, [fetchClubs, isAuthenticated, canView]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!canView) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, canView, router]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterTier("ALL");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const totalStats = {
    clubs: pagination.total,
    members: clubs.reduce((acc, c) => acc + (c.membersCount || 0), 0),
    events: clubs.reduce((acc, c) => acc + (c.stats?.eventsHosted || 0), 0),
    points: clubs.reduce((acc, c) => acc + (c.rewards || c.rewardsPoints || 0), 0)
  };

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don&apos;t have access to view clubs.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchClubs} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">My Clubs</h1>
              <p className="text-gray-400">Manage your college's technical clubs and communities</p>
            </div>
          </div>
        </div>
        
        {canManage && (
          <Link href="/dashboard/clubs/create">
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              Create Club
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clubs", value: totalStats.clubs, icon: Shield, color: "purple" },
          { label: "Total Members", value: totalStats.members, icon: Users, color: "blue" },
          { label: "Events Hosted", value: totalStats.events, icon: Calendar, color: "green" },
          { label: "Club Points", value: totalStats.points.toLocaleString(), icon: Trophy, color: "yellow" }
        ].map((stat, idx) => (
          <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 hover:border-white/20 transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {loading ? "-" : stat.value}
            </p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="sticky top-20 z-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search clubs, codes, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <Filter className="w-5 h-5 text-gray-400" />
            <span>Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
            {["ALL", "BRONZE", "SILVER", "GOLD", "PLATINUM"].map(tier => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterTier === tier 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {tier === "ALL" ? "All Tiers" : tier}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-gray-500 text-sm">
        Showing {clubs.length} of {pagination.total} club{pagination.total !== 1 ? 's' : ''}
        {pagination.pages > 1 && ` • Page ${pagination.page} of ${pagination.pages}`}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {clubs.map((club, idx) => (
          <Link key={club._id} href={`/dashboard/clubs/${club.code}`}>
            <div 
              className="group relative rounded-3xl bg-[#0f0f0f] border border-white/10 hover:border-blue-500/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTierGradient(club.performance?.tier || "BRONZE")} p-0.5`}>
                    <div className="w-full h-full rounded-2xl bg-[#0f0f0f] flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                      {club.logo?.url ? (
                        <img src={club.logo.url} alt={club.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        club.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`bg-gradient-to-r ${getTierColor(club.performance?.tier || "BRONZE")} border px-3 py-1`}>
                      <Crown className="w-3 h-3 mr-1" />
                      {club.performance?.tier || "BRONZE"}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {club.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono mb-3">{club.code}</p>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {club.description || "No description available"}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{club.membersCount || 0} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{club.stats?.eventsHosted || 0} events</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{(club.performance?.rating || 0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Performance Score</span>
                    <span className="text-white font-medium">{club.performance?.score || 0}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getTierGradient(club.performance?.tier || "BRONZE")} rounded-full transition-all`}
                      style={{ width: `${club.performance?.score || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-400">
                      <span className="text-white font-semibold">{(club.rewards || club.rewardsPoints || 0).toLocaleString()}</span> points
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </Link>
        ))}
      </div>

      {pagination.page < pagination.pages && !loading && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/10 px-8"
          >
            Load More ({pagination.pages - pagination.page} pages remaining)
          </Button>
        </div>
      )}

      {loading && clubs.length === 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-white/5 rounded w-2/3"></div>
                  <div className="h-4 bg-white/5 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && clubs.length === 0 && (
        <div className="text-center py-24 rounded-3xl bg-[#0f0f0f] border border-white/10 border-dashed">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No clubs found</h3>
          <p className="text-gray-500 mb-6">
            {canManage ? "Create your first club to get started" : "Ask your college lead to create a club."}
          </p>
          {canManage && (
            <Link href="/dashboard/clubs/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Club
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}