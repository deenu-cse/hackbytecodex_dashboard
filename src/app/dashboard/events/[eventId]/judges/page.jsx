// app/dashboard/events/[eventId]/judges/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft, Users, Search, Plus, X, CheckCircle2,
    Trophy, Eye, Lock, Unlock, RefreshCw, Loader2,
    Star, AlertCircle, ExternalLink
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EventJudgesPage() {
    const { isCollegeLead, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const eventId = params.eventId;

    const [judges, setJudges] = useState ([]);
    const [availableUsers, setAvailableUsers] = useState  ([]);
    const [event, setEvent] = useState  (null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [leaderboard, setLeaderboard] = useState ([]);
    const [scoresLocked, setScoresLocked] = useState(false);
    const [generatingLeaderboard, setGeneratingLeaderboard] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("codexdashtoken");
            if (!token) throw new Error("Authentication required");

            const eventRes = await fetch(`${API_URL}/events/single/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (eventRes.ok) {
                const eventData = await eventRes.json();
                if (eventData.success) setEvent(eventData.data);
            }

            const judgesRes = await fetch(`${API_URL}/judges/event/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (judgesRes.ok) {
                const judgesData = await judgesRes.json();
                if (judgesData.success) setJudges(judgesData.data || []);
            }
            const lbRes = await fetch(`${API_URL}/judges/leaderboard/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (lbRes.ok) {
                const lbData = await lbRes.json();
                if (lbData.success) {
                    setLeaderboard(lbData.data || []);
                    setScoresLocked(lbData.locked || false);
                }
            }

        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (isCollegeLead) fetchData();
    }, [isCollegeLead, fetchData]);

    const fetchAvailableUsers = async () => {
        try {
            const token = localStorage.getItem("codexdashtoken");
            if (!user?.college?.collegeId) return;

            const res = await fetch(
                `${API_URL}/admin/college/${user.college.collegeId._id}/users?search=${searchQuery}&limit=20`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    const assignedIds = new Set(judges.map(j => j.user._id));
                    setAvailableUsers(data.data.filter((u) => !assignedIds.has(u._id)));
                }
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    useEffect(() => {
        if (showAssignModal) fetchAvailableUsers();
    }, [showAssignModal, searchQuery]);

    const assignJudge = async (userId) => {
        try {
            setAssigning(true);
            const token = localStorage.getItem("codexdashtoken");

            const res = await fetch(`${API_URL}/judges/add-judge/${eventId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error("Failed to assign judge");

            await fetchData();
            setShowAssignModal(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to assign judge");
        } finally {
            setAssigning(false);
        }
    };

    const toggleScoresLock = async () => {
        try {
            const token = localStorage.getItem("codexdashtoken");
            const res = await fetch(`${API_URL}/judges/score/lock-event/${eventId}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to toggle lock");

            setScoresLocked(!scoresLocked);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to toggle lock");
        }
    };

    const generateLeaderboardData = async () => {
        try {
            setGeneratingLeaderboard(true);
            const token = localStorage.getItem("codexdashtoken");

            const res = await fetch(`${API_URL}/judges/leaderboard/${eventId}/generate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to generate leaderboard");

            await fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to generate");
        } finally {
            setGeneratingLeaderboard(false);
        }
    };

    const openJudgePanel = () => {
        window.open(`/judge/${eventId}`, '_blank');
    };

    if (!isCollegeLead) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/events/${eventId}`}>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Judge Management</h1>
                        <p className="text-gray-400">{event?.title || 'Loading...'}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10 rounded-xl"
                        onClick={openJudgePanel}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Judge Panel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        onClick={() => setShowAssignModal(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Judge
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{judges.length}</p>
                    <p className="text-xs text-gray-500">Assigned Judges</p>
                </div>
                <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {judges.filter(j => j.isActive).length}
                    </p>
                    <p className="text-xs text-gray-500">Active Judges</p>
                </div>
                <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-3">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
                    <p className="text-xs text-gray-500">Ranked Teams</p>
                </div>
                <div
                    className={`rounded-2xl border p-4 cursor-pointer transition-colors ${scoresLocked
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-green-500/10 border-green-500/30'
                        }`}
                    onClick={toggleScoresLock}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${scoresLocked ? 'bg-red-500/20' : 'bg-green-500/20'
                        }`}>
                        {scoresLocked ? (
                            <Lock className="w-5 h-5 text-red-400" />
                        ) : (
                            <Unlock className="w-5 h-5 text-green-400" />
                        )}
                    </div>
                    <p className={`text-2xl font-bold ${scoresLocked ? 'text-red-400' : 'text-green-400'}`}>
                        {scoresLocked ? 'Locked' : 'Open'}
                    </p>
                    <p className="text-xs text-gray-500">Scoring Status</p>
                </div>
            </div>

            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Assigned Judges</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={fetchData}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : judges.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No judges assigned yet</p>
                        <Button onClick={() => setShowAssignModal(true)} className="bg-blue-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Assign First Judge
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {judges.map((judge) => (
                            <div key={judge._id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
                                        {judge.user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{judge.user.fullName}</p>
                                        <p className="text-sm text-gray-500">{judge.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={judge.isActive
                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                    }>
                                        {judge.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {leaderboard.length > 0 && (
                <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Live Leaderboard
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-white hover:bg-white/10"
                            onClick={generateLeaderboardData}
                            disabled={generatingLeaderboard}
                        >
                            {generatingLeaderboard ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Update
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 text-left text-sm font-medium text-gray-400">Rank</th>
                                    <th className="p-4 text-left text-sm font-medium text-gray-400">Participant/Team</th>
                                    <th className="p-4 text-left text-sm font-medium text-gray-400">Average Score</th>
                                    <th className="p-4 text-left text-sm font-medium text-gray-400">Judges</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.slice(0, 10).map((entry) => (
                                    <tr key={entry._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                                        entry.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                                                            'bg-white/5 text-gray-400'
                                                }`}>
                                                {entry.rank}
                                            </div>
                                        </td>
                                        <td className="p-4 text-white font-medium">{entry.name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="text-white font-bold">{entry.avgScore}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400">{entry.judges} judges</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl bg-[#0f0f0f] border border-white/10 p-6 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Assign Judge</h3>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                            />
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {availableUsers.map((u) => (
                                <button
                                    key={u._id}
                                    onClick={() => assignJudge(u._id)}
                                    disabled={assigning}
                                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                            {u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-medium">{u.fullName}</p>
                                            <p className="text-sm text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                    <Plus className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                </button>
                            ))}
                            {availableUsers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p>No users found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}