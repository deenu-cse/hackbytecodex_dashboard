"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowLeft, Shield, Users, Trophy, Star, Calendar,
    Code2, TrendingUp, Copy, Check, Link as LinkIcon,
    MoreHorizontal, Plus, Crown, Zap, Target, Gift,
    UserPlus, Mail, Globe, Edit, Trash2,
    Clock, CheckCircle2, XCircle, Search, Loader2, AlertCircle
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getTierColor = (tier) => {
    const colors = {
        BRONZE: "from-orange-600 to-orange-400",
        SILVER: "from-gray-400 to-gray-300",
        GOLD: "from-yellow-500 to-yellow-300",
        PLATINUM: "from-cyan-500 to-blue-400"
    };
    return colors[tier] || colors.BRONZE;
};

const getTierBgColor = (tier) => {
    const colors = {
        BRONZE: "from-orange-600/20 to-orange-400/20 border-orange-500/30 text-orange-400",
        SILVER: "from-gray-400/20 to-gray-300/20 border-gray-400/30 text-gray-300",
        GOLD: "from-yellow-500/20 to-yellow-300/20 border-yellow-500/30 text-yellow-400",
        PLATINUM: "from-cyan-500/20 to-blue-400/20 border-cyan-500/30 text-cyan-400"
    };
    return colors[tier] || colors.BRONZE;
};

export default function ClubDetailPage() {
    const { clubId } = useParams();
    const { isCollegeLead, isAuthenticated } = useAuth();
    const router = useRouter();
    const canManage = isCollegeLead;

    const [activeTab, setActiveTab] = useState("overview");
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const [membersData, setMembersData] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersSearch, setMembersSearch] = useState("");
    const [membersPagination, setMembersPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
    const [assigningAdmin, setAssigningAdmin] = useState(false);

    const [eventsData, setEventsData] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsSearch, setEventsSearch] = useState("");
    const [eventsType, setEventsType] = useState("ALL");
    const [eventsStatus, setEventsStatus] = useState("ALL");
    const [eventsPagination, setEventsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 9 });

    const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
    const [rewardForm, setRewardForm] = useState({ points: "", title: "", reason: "" });
    const [awardingReward, setAwardingReward] = useState(false);

    // Old members state used for Admin Assignment
    const [adminAssigMembers, setAdminAssignMembers] = useState([]);
    const [adminAssignMembersLoading, setAdminAssignMembersLoading] = useState(false);
    const [adminAssignMembersSearch, setAdminAssignMembersSearch] = useState("");

    const fetchClubDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("codexdashtoken");
            if (!token) throw new Error("Authentication required");

            const response = await fetch(`${API_URL}/clubs/code/${clubId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("codexdashtoken");
                    router.push("/login");
                    return;
                }
                if (response.status === 404) {
                    throw new Error("Club not found");
                }
                throw new Error("Failed to fetch club details");
            }

            const data = await response.json();

            if (data.success) {
                setClub(data.data);
                setInviteLink(`https://www.hackbytecodex.com/clubs/${data.data.code}/join`);
            } else {
                throw new Error(data.message || "Failed to fetch club");
            }
        } catch (err) {
            console.error("Fetch club error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clubId, router]);

    const fetchAdminAssignMembers = useCallback(async () => {
        if (!club?._id) return;

        try {
            setAdminAssignMembersLoading(true);
            const token = localStorage.getItem("codexdashtoken");

            const params = new URLSearchParams({
                ...(adminAssignMembersSearch && { search: adminAssignMembersSearch }),
                limit: "50"
            });

            const response = await fetch(
                `${API_URL}/clubs/${club._id}/members?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!response.ok) throw new Error("Failed to fetch members");

            const data = await response.json();
            if (data.success) {
                const adminIds = club.admins?.map(a => a._id.toString()) || [];
                setAdminAssignMembers(data.data.filter(m => !adminIds.includes(m._id.toString())));
            }
        } catch (err) {
            console.error("Fetch members error:", err);
        } finally {
            setAdminAssignMembersLoading(false);
        }
    }, [club?._id, adminAssignMembersSearch, club?.admins]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchClubDetails();
        }
    }, [fetchClubDetails, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (canManage && isAssignAdminOpen) {
            fetchAdminAssignMembers();
        }
    }, [canManage, isAssignAdminOpen, fetchAdminAssignMembers]);

    // Fetch members for Members tab
    const fetchMembers = useCallback(async () => {
        if (!club?._id) return;
        try {
            setMembersLoading(true);
            const token = localStorage.getItem("codexdashtoken");
            const params = new URLSearchParams({
                page: membersPagination.page.toString(),
                limit: membersPagination.limit.toString(),
                ...(membersSearch && { search: membersSearch })
            });
            const response = await fetch(`${API_URL}/clubs/${club._id}/members?${params}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch members");
            const data = await response.json();
            if (data.success) {
                setMembersData(data.data);
                setMembersPagination(prev => ({ ...prev, total: data.total, pages: data.pages }));
            }
        } catch (err) {
            console.error("Fetch members error:", err);
        } finally {
            setMembersLoading(false);
        }
    }, [club?._id, membersPagination.page, membersPagination.limit, membersSearch]);

    useEffect(() => {
        if (activeTab === "members" && club?._id) {
            const timer = setTimeout(() => fetchMembers(), 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, fetchMembers, club?._id]);

    // Fetch events for Events tab
    const fetchEvents = useCallback(async () => {
        if (!club?._id) return;
        try {
            setEventsLoading(true);
            const token = localStorage.getItem("codexdashtoken");
            const params = new URLSearchParams({
                page: eventsPagination.page.toString(),
                limit: eventsPagination.limit.toString(),
                clubId: club._id,
                ...(eventsSearch && { search: eventsSearch }),
                ...(eventsType !== "ALL" && { eventType: eventsType }),
                ...(eventsStatus !== "ALL" && { status: eventsStatus })
            });
            // We use the same events endpoint, passing clubId
            const response = await fetch(`${API_URL}/events/college/${club.college.collegeId._id || club.college.collegeId}?${params}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch events");
            const data = await response.json();
            if (data.success) {
                setEventsData(data.data);
                setEventsPagination(prev => ({ ...prev, total: data.total, pages: data.pages }));
            }
        } catch (err) {
            console.error("Fetch events error:", err);
        } finally {
            setEventsLoading(false);
        }
    }, [club?._id, club?.college?.collegeId, eventsPagination.page, eventsPagination.limit, eventsSearch, eventsType, eventsStatus]);

    useEffect(() => {
        if (activeTab === "events" && club?._id) {
            const timer = setTimeout(() => fetchEvents(), 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, fetchEvents, club?._id]);

    // Award reward
    const handleAwardReward = async (e) => {
        e.preventDefault();
        if (!rewardForm.points || !rewardForm.title) return;
        try {
            setAwardingReward(true);
            const token = localStorage.getItem("codexdashtoken");
            const response = await fetch(`${API_URL}/admin/rewards/club/${club._id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ points: Number(rewardForm.points), title: rewardForm.title, reason: rewardForm.reason })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to award");
            if (data.success) {
                await fetchClubDetails();
                setIsRewardDialogOpen(false);
                setRewardForm({ points: "", title: "", reason: "" });
            }
        } catch (err) {
            console.error("Award error:", err);
            alert(err.message);
        } finally {
            setAwardingReward(false);
        }
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateNewLink = async () => {
        try {
            const token = localStorage.getItem("codexdashtoken");
            const response = await fetch(`${API_URL}/clubs/${club._id}/regenerate-link`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setInviteLink(data.data.inviteLink);
                }
            }
        } catch (error) {
            console.error("Regenerate link error:", error);
        }
    };

    const handleAssignAdmin = async (memberId) => {
        try {
            setAssigningAdmin(true);
            const token = localStorage.getItem("codexdashtoken");

            const response = await fetch(`${API_URL}/clubs/${club._id}/admins`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId: memberId })
            });

            if (!response.ok) throw new Error("Failed to assign admin");

            const data = await response.json();
            if (data.success) {
                await fetchClubDetails();
                setIsAssignAdminOpen(false);
            }
        } catch (error) {
            console.error("Assign admin error:", error);
            alert(error.message);
        } finally {
            setAssigningAdmin(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                    <p className="text-gray-400 mb-4">{error || "Club not found"}</p>
                    <Button onClick={() => router.push("/dashboard/clubs")} variant="outline">
                        Back to Clubs
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Back Navigation */}
            <Link href="/dashboard/clubs">
                <Button variant="ghost" className="text-gray-400 hover:text-white -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Clubs
                </Button>
            </Link>

            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(club.performance?.tier || "BRONZE")} opacity-20`} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                <div className="relative p-8 lg:p-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Logo */}
                        <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-gradient-to-br ${getTierColor(club.performance?.tier || "BRONZE")} p-1 flex-shrink-0`}>
                            <div className="w-full h-full rounded-3xl bg-[#0a0a0a] flex items-center justify-center text-4xl lg:text-5xl font-bold text-white overflow-hidden">
                                {club.logo?.url ? (
                                    <img src={club.logo.url} alt={club.name} className="w-full h-full object-cover rounded-3xl" />
                                ) : (
                                    club.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-3xl lg:text-5xl font-bold text-white">{club.name}</h1>
                                <Badge className={`bg-gradient-to-r ${getTierBgColor(club.performance?.tier || "BRONZE")} px-4 py-1.5`}>
                                    <Crown className="w-4 h-4 mr-2" />
                                    {club.performance?.tier || "BRONZE"}
                                </Badge>
                            </div>

                            <p className="text-lg text-gray-400 font-mono mb-4">{club.code}</p>
                            <p className="text-gray-300 leading-relaxed max-w-2xl mb-6">
                                {club.description || "No description available"}
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {club.performance?.badges?.map((badge, i) => (
                                    <Badge key={i} className="bg-white/10 text-gray-300 border-white/20 px-4 py-1.5">
                                        <Trophy className="w-3 h-3 mr-2 text-yellow-500" />
                                        {badge}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {canManage && (
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => setIsInviteDialogOpen(true)}
                                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                >
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Invite Members
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 border-white/10 text-white hover:bg-white/10 rounded-xl"
                                    onClick={() => setIsAssignAdminOpen(true)}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Assign Admin
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Members", value: club.membersCount || 0, icon: Users, color: "blue" },
                    { label: "Events Hosted", value: club.stats?.eventsHosted || 0, icon: Calendar, color: "purple" },
                    { label: "Projects", value: club.stats?.projectsCompleted || 0, icon: Code2, color: "green" },
                    { label: "Club Points", value: (club.rewards?.points || 0).toLocaleString(), icon: Trophy, color: "yellow" }
                ].map((stat, idx) => (
                    <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
                        <stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-4`} />
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-[#0f0f0f] border border-white/10 p-1 rounded-xl h-auto flex flex-wrap">
                    {[
                        { id: "overview", label: "Overview", icon: Shield },
                        { id: "members", label: "Members", icon: Users },
                        { id: "events", label: "Events", icon: Calendar },
                        { id: "projects", label: "Projects", icon: Code2 },
                        { id: "rewards", label: "Rewards", icon: Trophy }
                    ].map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 transition-all"
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Performance Card */}
                        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                Performance
                            </h3>

                            <div className="flex items-center gap-8">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="64" cy="64" r="56"
                                            stroke="url(#clubGradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray="351"
                                            strokeDashoffset={351 - (351 * (club.performance?.score || 0)) / 100}
                                        />
                                        <defs>
                                            <linearGradient id="clubGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#06b6d4" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{club.performance?.score || 0}</span>
                                        <span className="text-xs text-gray-500">Score</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Rating</span>
                                            <span className="text-white font-medium">{(club.performance?.rating || 0).toFixed(1)}/5.0</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${((club.performance?.rating || 0) / 5) * 100}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-white font-medium">Rank #{club.rankInCollege || "—"}</span>
                                        <span className="text-gray-500">in college</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Quick Actions
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <Link href={`/dashboard/events/create?club=${club._id}`}>
                                    <Button variant="outline" className="h-24 w-full flex-col gap-2 border-white/10 hover:bg-white/5 rounded-xl">
                                        <Calendar className="w-6 h-6 text-blue-400" />
                                        <span className="text-sm text-gray-300">Host Event</span>
                                    </Button>
                                </Link>
                                <Button variant="outline" className="h-24 flex-col gap-2 border-white/10 hover:bg-white/5 rounded-xl">
                                    <Code2 className="w-6 h-6 text-purple-400" />
                                    <span className="text-sm text-gray-300">New Project</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Events */}
                    <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                        <h3 className="text-xl font-semibold text-white mb-6">Recent Events</h3>
                        <div className="space-y-4">
                            {club.recentEvents?.length > 0 ? club.recentEvents.map((event, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${event.status === "PUBLISHED" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                                            }`}>
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{event.title}</h4>
                                            <p className="text-sm text-gray-500">
                                                {new Date(event.startDate).toLocaleDateString()} • {event.participantsCount || 0} participants
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={event.status === "PUBLISHED" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}>
                                        {event.status}
                                    </Badge>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center py-8">No events yet</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="members" className="mt-6 animate-in fade-in duration-300">
                    <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Club Members ({club.membersCount || 0})</h3>
                            {canManage && (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => setIsInviteDialogOpen(true)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Invite Member
                                </Button>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {club.admins?.length > 0 && (
                                <>
                                    <div className="md:col-span-2">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Admins ({club.adminsCount || 0})</h4>
                                    </div>
                                    {club.admins.map((admin, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                                                {admin.fullName?.split(" ").map(n => n[0]).join("") || "A"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-white font-semibold">{admin.fullName}</h4>
                                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Admin</Badge>
                                                </div>
                                                <p className="text-sm text-gray-400">{admin.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="mt-8 border-t border-white/10 pt-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Members Directory</h4>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input placeholder="Search members..." value={membersSearch} onChange={(e) => { setMembersSearch(e.target.value); setMembersPagination(p => ({ ...p, page: 1 })); }} className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl" />
                                </div>
                            </div>
                            
                            {membersLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
                            ) : membersData.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No other members found</p>
                            ) : (
                                <>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {membersData.map((member, idx) => (
                                            <div key={member._id || idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                    {member.avatar ? <img src={member.avatar} alt="" className="w-full h-full object-cover rounded-xl" /> : (member.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?")}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-medium text-sm truncate">{member.fullName}</h4>
                                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {membersPagination.pages > 1 && (
                                        <div className="flex items-center justify-center gap-4 mt-6">
                                            <Button variant="outline" size="sm" disabled={membersPagination.page <= 1} onClick={() => setMembersPagination(p => ({ ...p, page: p.page - 1 }))} className="border-white/10 text-white hover:bg-white/10">Prev</Button>
                                            <span className="text-xs text-gray-400">Page {membersPagination.page} of {membersPagination.pages}</span>
                                            <Button variant="outline" size="sm" disabled={membersPagination.page >= membersPagination.pages} onClick={() => setMembersPagination(p => ({ ...p, page: p.page + 1 }))} className="border-white/10 text-white hover:bg-white/10">Next</Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Other Tabs Placeholders */}
                <TabsContent value="events" className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input placeholder="Search events..." value={eventsSearch} onChange={(e) => { setEventsSearch(e.target.value); setEventsPagination(p => ({ ...p, page: 1 })); }} className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {["ALL", "HACKATHON", "WORKSHOP", "SEMINAR", "COMPETITION"].map(t => (
                                    <button key={t} onClick={() => { setEventsType(t); setEventsPagination(p => ({ ...p, page: 1 })); }} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${eventsType === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{t === "ALL" ? "All Types" : t}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {["ALL", "PUBLISHED", "COMPLETED", "DRAFT"].map(s => (
                                    <button key={s} onClick={() => { setEventsStatus(s); setEventsPagination(p => ({ ...p, page: 1 })); }} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${eventsStatus === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{s === "ALL" ? "All Status" : s}</button>
                                ))}
                            </div>
                        </div>
                        {eventsLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
                        ) : eventsData.length === 0 ? (
                            <div className="text-center py-12"><Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-500">No events found</p></div>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {eventsData.map((event, idx) => (
                                        <Link key={event._id || idx} href={`/dashboard/events/${event.slug || event._id}`}>
                                            <div className="rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 p-5 transition-all hover:-translate-y-1 cursor-pointer h-full">
                                                {event.banners?.[0]?.url && <img src={event.banners[0].url} alt="" className="w-full h-32 object-cover rounded-xl mb-4" />}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={event.status === 'PUBLISHED' ? 'bg-blue-500/20 text-blue-400' : event.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>{event.status}</Badge>
                                                    <Badge className="bg-purple-500/10 text-purple-400">{event.eventType}</Badge>
                                                </div>
                                                <h4 className="text-white font-semibold mb-2 line-clamp-2">{event.title}</h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {eventsPagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-4 mt-6">
                                        <Button variant="outline" size="sm" disabled={eventsPagination.page <= 1} onClick={() => setEventsPagination(p => ({ ...p, page: p.page - 1 }))} className="border-white/10 text-white hover:bg-white/10">Previous</Button>
                                        <span className="text-sm text-gray-400">Page {eventsPagination.page} of {eventsPagination.pages} ({eventsPagination.total} events)</span>
                                        <Button variant="outline" size="sm" disabled={eventsPagination.page >= eventsPagination.pages} onClick={() => setEventsPagination(p => ({ ...p, page: p.page + 1 }))} className="border-white/10 text-white hover:bg-white/10">Next</Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="projects" className="mt-6">
                    <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-12 text-center">
                        <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Projects</h3>
                        <p className="text-gray-500">Track club projects and contributions</p>
                    </div>
                </TabsContent>

                <TabsContent value="rewards" className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                            <h3 className="text-lg font-semibold text-white mb-4">Total Points</h3>
                            <p className="text-5xl font-bold text-white mb-2">{(club.rewards?.points || 0).toLocaleString()}</p>
                            <Badge className={`bg-gradient-to-r ${getTierColor(club.performance?.tier || 'BRONZE')} border px-4 py-1.5 mt-2`}><Crown className="w-4 h-4 mr-2" />{club.performance?.tier || 'BRONZE'}</Badge>
                            {canManage && (
                                <Button onClick={() => setIsRewardDialogOpen(true)} className="w-full mt-6 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-xl"><Trophy className="w-4 h-4 mr-2" />Award Points</Button>
                            )}
                        </div>
                        <div className="lg:col-span-2 rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                            <h3 className="text-lg font-semibold text-white mb-4">Tier Perks</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {(() => { const tiers = { BRONZE: ['Certificate of Participation', 'Community Badge'], SILVER: ['HackByteCodex Swag', 'Priority Event Access', 'LinkedIn Shoutout'], GOLD: ['Internship Eligibility', 'Letter of Recommendation', 'Paid Workshop Access'], PLATINUM: ['National Leadership Role', 'Stipend / Revenue Share', 'CSR Project Ownership'] }; return (tiers[club.performance?.tier] || tiers.BRONZE).map((perk, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5"><CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" /><span className="text-sm text-gray-300">{perk}</span></div>
                                )); })()}
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />Rewards History</h3>
                        <div className="space-y-3">
                            {club.rewards?.history?.length > 0 ? club.rewards.history.slice().reverse().map((reward, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Trophy className="w-6 h-6 text-yellow-400" /></div>
                                        <div>
                                            <h4 className="text-white font-medium">{reward.title}</h4>
                                            <p className="text-sm text-gray-500">{reward.reason && <span className="text-gray-400">{reward.reason} • </span>}{new Date(reward.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-green-400">+{reward.points}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center py-8">No rewards history yet</p>
                            )}
                        </div>
                    </div>

                    {/* Award Dialog */}
                    <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
                        <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />Award Points</DialogTitle>
                                <DialogDescription className="text-gray-400">Award reward points to {club.name}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAwardReward} className="space-y-4 mt-4">
                                <div><label className="text-sm text-gray-400 mb-1 block">Points</label><Input type="number" min="1" value={rewardForm.points} onChange={e => setRewardForm(p => ({ ...p, points: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="e.g. 10" required /></div>
                                <div><label className="text-sm text-gray-400 mb-1 block">Title</label><Input value={rewardForm.title} onChange={e => setRewardForm(p => ({ ...p, title: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="e.g. Hackathon Winner" required /></div>
                                <div><label className="text-sm text-gray-400 mb-1 block">Reason (optional)</label><Input value={rewardForm.reason} onChange={e => setRewardForm(p => ({ ...p, reason: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="e.g. Won first place at..." /></div>
                                <Button type="submit" disabled={awardingReward} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl">{awardingReward ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}{awardingReward ? 'Awarding...' : 'Award Points'}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>

            {canManage && (
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <LinkIcon className="w-6 h-6 text-blue-400" />
                                Invite Members
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Share this link to invite students to join {club.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(club.performance?.tier || "BRONZE")} p-0.5`}>
                                        <div className="w-full h-full rounded-xl bg-[#0f0f0f] flex items-center justify-center text-sm font-bold text-white">
                                            {club.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{club.name}</p>
                                        <p className="text-sm text-gray-500">{club.code}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/10">
                                    <input
                                        type="text"
                                        value={inviteLink}
                                        readOnly
                                        className="flex-1 bg-transparent text-sm text-gray-300 outline-none"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={copyInviteLink}
                                        className={copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <Button
                                    variant="ghost"
                                    onClick={generateNewLink}
                                    className="w-full text-gray-400 hover:text-white"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Generate New Link
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Assign Admin Dialog */}
            {canManage && (
                <Dialog open={isAssignAdminOpen} onOpenChange={setIsAssignAdminOpen}>
                    <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <Crown className="w-6 h-6 text-yellow-400" />
                                Assign Club Admin
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Select a member to promote as club administrator
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    placeholder="Search members..."
                                    value={adminAssignMembersSearch}
                                    onChange={(e) => setAdminAssignMembersSearch(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <ScrollArea className="max-h-[300px]">
                                <div className="space-y-2">
                                    {adminAssignMembersLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        </div>
                                    ) : adminAssigMembers.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No eligible members found</p>
                                    ) : (
                                        adminAssigMembers.map((member, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                                                    {member.fullName?.split(" ").map(n => n[0]).join("") || "M"}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-medium">{member.fullName}</h4>
                                                    <p className="text-sm text-gray-400">{member.email}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                                                    onClick={() => handleAssignAdmin(member._id)}
                                                    disabled={assigningAdmin}
                                                >
                                                    {assigningAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}