"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Plus, Search, Filter, MapPin, Users, Trophy,
    Star, MoreHorizontal, ArrowUpRight, Building2,
    ChevronDown, X, Crown, Shield, CheckCircle2,
    Clock, AlertCircle, GraduationCap, Loader2
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

const getStatusColor = (status) => {
    const colors = {
        ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
        PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20"
    };
    return colors[status] || colors.PENDING;
};

export default function CollegesPage() {
    const { isSuperAdmin } = useAuth();
    const router = useRouter();
    
    const [colleges, setColleges] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10
    });
    
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTier, setFilterTier] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchColleges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("codexdashtoken");
            if (!token) {
                throw new Error("Authentication required");
            }

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(filterStatus !== "ALL" && { status: filterStatus })
            });

            const response = await fetch(`${API_URL}/admin/college?${params}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("codexdashtoken");
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to fetch colleges");
            }

            const data = await response.json();
            
            if (data.success) {
                setColleges(data.data);
                setPagination({
                    total: data.total,
                    page: data.page,
                    pages: data.pages,
                    limit: pagination.limit
                });
            } else {
                throw new Error(data.message || "Failed to fetch colleges");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, filterStatus, router]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchColleges();
        }
    }, [fetchColleges, isSuperAdmin]);

    useEffect(() => {
        if (!isSuperAdmin && !loading) {
            router.push("/dashboard");
        }
    }, [isSuperAdmin, loading, router]);

    const filteredColleges = colleges.filter(college => {
        if (filterTier === "ALL") return true;
        return college.performance?.tier === filterTier;
    });

    const totalStats = {
        colleges: pagination.total,
        active: colleges.filter(c => c.status === "ACTIVE").length,
        pending: colleges.filter(c => c.status === "PENDING").length,
        students: colleges.reduce((acc, c) => acc + (c.stats?.activeStudents || 0), 0)
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.pages) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setFilterTier("ALL");
        setFilterStatus("ALL");
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    if (!isSuperAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400">Only Super Admins can view colleges.</p>
                    <Button 
                        onClick={() => router.push("/dashboard")} 
                        className="mt-4"
                        variant="outline"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-white mb-2">Error Loading Colleges</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Button onClick={fetchColleges} variant="outline">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-full overflow-x-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Colleges</h1>
                            <p className="text-gray-400">Manage and oversee all chapter institutions</p>
                        </div>
                    </div>
                </div>

                <Link href="/dashboard/colleges/add">
                    <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 group">
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                        Add College
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Colleges", value: totalStats.colleges, icon: Building2, color: "blue" },
                    { label: "Active Chapters", value: totalStats.active, icon: CheckCircle2, color: "green" },
                    { label: "Pending Approval", value: totalStats.pending, icon: Clock, color: "yellow" },
                    { label: "Total Students", value: totalStats.students.toLocaleString(), icon: Users, color: "purple" }
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
                            placeholder="Search colleges, codes, cities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {loading && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-3 h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors min-w-0 sm:min-w-[200px]"
                        >
                            <Filter className="w-5 h-5 text-gray-400" />
                            <span className="flex-1 text-left">Filters</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full mt-2 right-0 w-72 bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 space-y-4 shadow-2xl z-30">
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Tier</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["ALL", "BRONZE", "SILVER", "GOLD", "PLATINUM"].map(tier => (
                                            <button
                                                key={tier}
                                                onClick={() => setFilterTier(tier)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTier === tier
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {tier}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["ALL", "ACTIVE", "PENDING", "SUSPENDED"].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => { setFilterStatus(status); setPagination(prev => ({ ...prev, page: 1 })); }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === status
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {(filterTier !== "ALL" || filterStatus !== "ALL") && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {filterTier !== "ALL" && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Tier: {filterTier}
                                <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setFilterTier("ALL")} />
                            </Badge>
                        )}
                        {filterStatus !== "ALL" && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Status: {filterStatus}
                                <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setFilterStatus("ALL")} />
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                    Showing {filteredColleges.length} of {pagination.total} college{pagination.total !== 1 ? 's' : ''}
                    {pagination.pages > 1 && ` • Page ${pagination.page} of ${pagination.pages}`}
                </div>
            </div>

            <div className="space-y-4">
                {filteredColleges.map((college, idx) => (
                    <Link key={college.code} href={`/dashboard/colleges/${college.code}`}>
                        <div
                            className="group relative rounded-3xl bg-[#0f0f0f] border border-white/10 hover:border-blue-500/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer mt-2"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="p-3 lg:p-4">
                                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-w-0">
                                    <div className="flex items-start gap-4 lg:w-1/3 min-w-0">
                                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getTierGradient(college.performance?.tier || "BRONZE")} p-0.5 flex-shrink-0`}>
                                            <div className="w-full h-full rounded-2xl bg-[#0f0f0f] flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                                                {college.logo?.url ? (
                                                    <img 
                                                        src={college.logo.url} 
                                                        alt={college.name}
                                                        className="w-full h-full object-cover rounded-2xl"
                                                    />
                                                ) : (
                                                    college.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                                    {college.name}
                                                </h3>
                                                {college.isVerified && (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono mb-2">{college.code}</p>
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">
                                                    {college.address?.city || "Unknown City"}, {college.address?.state || "Unknown State"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:w-1/3 min-w-0">
                                        <div className="text-center p-3 rounded-xl">
                                            <p className="text-xl font-bold text-white">{college.stats?.eventsHosted || 0}</p>
                                            <p className="text-xs text-gray-500 mt-1">Events</p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl">
                                            <p className="text-xl font-bold text-white">{college.stats?.hackathonsHosted || 0}</p>
                                            <p className="text-xs text-gray-500 mt-1">Hackathons</p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl">
                                            <p className="text-xl font-bold text-white">{college.stats?.activeStudents || 0}</p>
                                            <p className="text-xs text-gray-500 mt-1">Students</p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl">
                                            <p className="text-xl font-bold text-white">{college.stats?.clubsCount || 0}</p>
                                            <p className="text-xs text-gray-500 mt-1">Clubs</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between lg:w-1/3 lg:items-end gap-4">
                                        <div className="flex items-center gap-3">
                                            <Badge className={`bg-gradient-to-r ${getTierColor(college.performance?.tier || "BRONZE")} border px-3 py-1`}>
                                                <Crown className="w-3 h-3 mr-1" />
                                                {college.performance?.tier || "BRONZE"}
                                            </Badge>
                                            <Badge className={getStatusColor(college.status || "PENDING")}>
                                                {college.status || "PENDING"}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-6 w-full lg:w-auto">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-2xl font-bold text-white">
                                                    {(college.performance?.rating || 0).toFixed(1)}
                                                </span>
                                                <span className="text-sm text-gray-500">/5</span>
                                            </div>

                                            <div className="flex-1 lg:flex-none">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                    <span>Score</span>
                                                    <span className="text-white font-medium">
                                                        {college.performance?.score || 0}/100
                                                    </span>
                                                </div>
                                                <div className="w-full max-w-[120px] h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${getTierGradient(college.performance?.tier || "BRONZE")} rounded-full transition-all`}
                                                        style={{ width: `${college.performance?.score || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="hidden lg:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                            </div>
                                        </div>

                                        {college.collegeLead ? (
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {college.collegeLead.fullName?.split(" ").map(n => n[0]).join("") || "CL"}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-white font-medium">{college.collegeLead.fullName}</p>
                                                    <p className="text-xs">College Lead</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                No Lead Assigned
                                            </Badge>
                                        )}
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

            {loading && colleges.length === 0 && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-white/5"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 bg-white/5 rounded w-1/3"></div>
                                    <div className="h-4 bg-white/5 rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredColleges.length === 0 && (
                <div className="text-center py-24 rounded-3xl bg-[#0f0f0f] border border-white/10 border-dashed">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No colleges found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="border-white/10 text-white hover:bg-white/10"
                    >
                        Clear all filters
                    </Button>
                </div>
            )}
        </div>
    );
}