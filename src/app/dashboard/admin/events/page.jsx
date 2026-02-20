"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Calendar, Plus, Search, Filter, Crown, Globe, Building2,
    ChevronDown, X, MoreHorizontal, ArrowUpRight, TrendingUp
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const eventTypeColors = {
    HACKATHON: "bg-purple-500/20 text-purple-400",
    WORKSHOP: "bg-blue-500/20 text-blue-400",
    SEMINAR: "bg-green-500/20 text-green-400",
    COMPETITION: "bg-orange-500/20 text-orange-400"
};

export default function AdminEventsPage() {
    const { isSuperAdmin } = useAuth();
    const router = useRouter();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterScope, setFilterScope] = useState("ALL"); // 'ALL', 'GLOBAL', 'COLLEGE'
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchEvents = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("codexdashtoken");

            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(searchQuery && { search: searchQuery }),
                ...(filterScope !== "ALL" && { scope: filterScope.toLowerCase() }),
            });

            const response = await fetch(`${API_URL}/events/all?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch events");

            const data = await response.json();
            if (data.success) {
                setEvents(data.data);
                setPagination({ page: data.page, pages: data.pages, total: data.total });
            }
        } catch (err) {
            console.error("Fetch events error:", err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filterScope]);

    useEffect(() => {
        if (isSuperAdmin) fetchEvents();
    }, [isSuperAdmin, fetchEvents]);

    if (!isSuperAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400">Only Super Admins can see global Events.</p>
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-600 to-orange-600">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">All Events</h1>
                            <p className="text-gray-400">Manage platform-wide and college events</p>
                        </div>
                    </div>
                </div>

                <Link href="/dashboard/admin/events/create">
                    <Button className="h-12 px-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-yellow-500/25">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Global Event
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Events", value: pagination.total, icon: Calendar, color: "blue" },
                    { label: "Global Events", value: events.filter(e => e.isGlobal).length, icon: Globe, color: "yellow" },
                    { label: "College Events", value: events.filter(e => !e.isGlobal).length, icon: Building2, color: "purple" },
                    {
                        label: "Active Now", value: events.filter(e => {
                            const now = new Date();
                            return new Date(e.startDate) <= now && new Date(e.endDate) >= now;
                        }).length, icon: TrendingUp, color: "green"
                    }
                ].map((stat, idx) => (
                    <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
                        <stat.icon className={`w-6 h-6 text-${stat.color}-400 mb-4`} />
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="sticky top-20 z-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input placeholder="Search all events..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchEvents()}
                            className="pl-12 h-12 bg-white/5 border-white/10 text-white rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                        {["ALL", "GLOBAL", "COLLEGE"].map(scope => (
                            <button key={scope} onClick={() => { setFilterScope(scope); fetchEvents(); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterScope === scope ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}>
                                {scope === "ALL" ? "All Events" : scope === "GLOBAL" ? "Global Only" : "College Only"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6 animate-pulse h-64" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {events.map(event => (
                        <Link key={event._id} href={`/dashboard/admin/events/${event._id}`}>
                            <div className="group relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden hover:border-yellow-500/30 transition-all">
                                <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative">
                                    {event.banners?.[0] && (
                                        <img src={event.banners[0].url} className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {event.isGlobal ? (
                                            <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
                                                <Globe className="w-3 h-3 mr-1" /> Global
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-blue-500/20 text-blue-400">
                                                <Building2 className="w-3 h-3 mr-1" /> {event.college?.collegeName}
                                            </Badge>
                                        )}
                                        <Badge className={eventTypeColors[event.eventType]}>
                                            {event.eventType}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{event.description}</p>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                        <span>{event.mode}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}