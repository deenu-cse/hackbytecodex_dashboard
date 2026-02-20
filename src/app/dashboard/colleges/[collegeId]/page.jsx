"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Globe,
  Edit, Users, Trophy, Star, Calendar, Code2,
  CheckCircle2, Clock, Crown, TrendingUp,
  MoreHorizontal, Plus, Link as LinkIcon, Search,
  Loader2, AlertCircle, X, UserPlus, UserCog
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

const getStatusColor = (status) => {
  const colors = {
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    SUSPENDED: "bg-red-500/20 text-red-400 border-red-500/30"
  };
  return colors[status] || colors.PENDING;
};

export default function CollegeDetailPage() {
  const { isSuperAdmin, isCollegeLead, isStudent } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { collegeId } = params;

  const canManage = isSuperAdmin;
  const canView = isSuperAdmin || isCollegeLead || isStudent;

  const [activeTab, setActiveTab] = useState("overview");
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [collegeUsers, setCollegeUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [assigningLead, setAssigningLead] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: { city: "", state: "", country: "India" }
  });
  const [updatingCollege, setUpdatingCollege] = useState(false);

  // Fetch college details
  const fetchCollegeDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("codexdashtoken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/admin/college/code/${collegeId}`, {
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
        if (response.status === 404) {
          throw new Error("College not found");
        }
        throw new Error("Failed to fetch college details");
      }

      const data = await response.json();

      if (data.success) {
        setCollege(data.data);
        // Initialize edit form with current data
        setEditForm({
          name: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          website: data.data.website || "",
          address: {
            city: data.data.address?.city || "",
            state: data.data.address?.state || "",
            country: data.data.address?.country || "India"
          }
        });
      } else {
        throw new Error(data.message || "Failed to fetch college details");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collegeId, router]);

  const fetchCollegeUsers = useCallback(async () => {
    if (!college?._id) return;

    try {
      setUsersLoading(true);
      const token = localStorage.getItem("codexdashtoken");

      const params = new URLSearchParams({
        ...(usersSearchQuery && { search: usersSearchQuery }),
        limit: "50"
      });

      const response = await fetch(`${API_URL}/admin/college/${college._id}/users?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      if (data.success) {
        // Filter out users who are already college leads elsewhere
        setCollegeUsers(data.data.filter(user => user.role !== "COLLEGE_LEAD"));
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [college?._id, usersSearchQuery]);

  // Assign college lead
  const handleAssignLead = async (userId) => {
    try {
      setAssigningLead(true);
      const token = localStorage.getItem("codexdashtoken");

      const response = await fetch(`${API_URL}/admin/college/assignCollegeLead`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          collegeId: college._id,
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign lead");
      }

      if (data.success) {
        // Refresh college data to show new lead
        await fetchCollegeDetails();
        setIsLeadDialogOpen(false);
      }
    } catch (err) {
      console.error("Assign lead error:", err);
      alert(err.message);
    } finally {
      setAssigningLead(false);
    }
  };

  // Update college details
  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    try {
      setUpdatingCollege(true);
      const token = localStorage.getItem("codexdashtoken");

      const response = await fetch(`${API_URL}/admin/college/updateCollege/${college._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update college");
      }

      if (data.success) {
        await fetchCollegeDetails();
        setIsEditDialogOpen(false);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(err.message);
    } finally {
      setUpdatingCollege(false);
    }
  };

  useEffect(() => {
    if (canView && collegeId) {
      fetchCollegeDetails();
    }
  }, [fetchCollegeDetails, canView, collegeId]);

  useEffect(() => {
    if (canManage && isLeadDialogOpen && college?._id) {
      fetchCollegeUsers();
    }
  }, [canManage, isLeadDialogOpen, fetchCollegeUsers, college?._id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canManage && isLeadDialogOpen) {
        fetchCollegeUsers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usersSearchQuery, canManage, isLeadDialogOpen, fetchCollegeUsers]);

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don&apos;t have access to view this college.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4" variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error || "College not found"}</p>
          <Button onClick={() => router.push("/dashboard/colleges")} variant="outline">
            Back to Colleges
          </Button>
        </div>
      </div>
    );
  }

  const hasCollegeLead = !!college.collegeLead;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Navigation */}
      <Link href="/dashboard/colleges">
        <Button variant="ghost" className="text-gray-400 hover:text-white -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Colleges
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(college.performance?.tier || "BRONZE")} opacity-20`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Logo */}
            <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-gradient-to-br ${getTierColor(college.performance?.tier || "BRONZE")} p-1 flex-shrink-0`}>
              <div className="w-full h-full rounded-3xl bg-[#0a0a0a] flex items-center justify-center text-4xl lg:text-5xl font-bold text-white overflow-hidden">
                {college.logo?.url ? (
                  <img
                    src={college.logo.url}
                    alt={college.name}
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  college.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl lg:text-5xl font-bold text-white">{college.name}</h1>
                {college.isVerified && (
                  <CheckCircle2 className="w-8 h-8 text-blue-500" />
                )}
              </div>

              <p className="text-lg text-gray-400 font-mono mb-4">{college.code}</p>

              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {college.address?.city || "Unknown City"}, {college.address?.state || "Unknown State"}
                </span>
                {college.email && (
                  <>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                    <span className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      {college.email}
                    </span>
                  </>
                )}
                {college.website && (
                  <>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                      <Globe className="w-5 h-5" />
                      Website
                      <LinkIcon className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge className={`bg-gradient-to-r ${getTierBgColor(college.performance?.tier || "BRONZE")} border px-4 py-1.5 text-sm`}>
                  <Crown className="w-4 h-4 mr-2" />
                  {college.performance?.tier || "BRONZE"} Tier
                </Badge>
                <Badge className={getStatusColor(college.status || "PENDING")}>
                  {college.status || "PENDING"}
                </Badge>
                {college.performance?.badges?.map((badge, i) => (
                  <Badge key={i} className="bg-white/10 text-gray-300 border-white/20 px-4 py-1.5 text-sm">
                    <Trophy className="w-3 h-3 mr-2 text-yellow-500" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            {canManage ? (
              <div className="flex flex-col gap-3">
                <Button
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit College
                </Button>

                {hasCollegeLead ? (
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-white/10 text-white hover:bg-white/10 rounded-xl"
                    onClick={() => setIsLeadDialogOpen(true)}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Change Lead
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-white/10 text-white hover:bg-white/10 rounded-xl"
                    onClick={() => setIsLeadDialogOpen(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Lead
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-start lg:items-end gap-2">
                <Badge className="bg-white/10 text-gray-300 border-white/20 px-4 py-2">
                  View only
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#0f0f0f] border border-white/10 p-1 rounded-xl h-auto flex flex-wrap">
          {[
            { id: "overview", label: "Overview", icon: Building2 },
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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Events", value: college.stats?.eventsHosted || 0, icon: Calendar, color: "blue" },
              { label: "Hackathons", value: college.stats?.hackathonsHosted || 0, icon: Trophy, color: "purple" },
              { label: "Active Students", value: college.stats?.activeStudents || 0, icon: Users, color: "green" },
              { label: "Projects Built", value: college.stats?.projectsBuilt || 0, icon: Code2, color: "orange" }
            ].map((stat, idx) => (
              <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 hover:border-white/20 transition-all">
                <stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-4`} />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Performance Card */}
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Performance Metrics
              </h3>

              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="12" fill="none" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#perfGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="351"
                      strokeDashoffset={351 - (351 * (college.performance?.score || 0)) / 100}
                    />
                    <defs>
                      <linearGradient id="perfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{college.performance?.score || 0}</span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Rating</span>
                      <span className="text-white font-medium">{(college.performance?.rating || 0).toFixed(1)}/5.0</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${((college.performance?.rating || 0) / 5) * 100}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-white font-medium">Rank #{college.performance?.rank || "—"}</span>
                    <span className="text-gray-500">out of all colleges</span>
                  </div>
                </div>
              </div>
            </div>

            {/* College Lead Card */}
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Leadership
              </h3>

              <div className="space-y-4">
                {hasCollegeLead ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                      {college.collegeLead.fullName?.split(" ").map(n => n[0]).join("") || "CL"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-white">{college.collegeLead.fullName}</h4>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Lead</Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{college.collegeLead.email}</p>
                      {college.collegeLead.phone && (
                        <p className="text-gray-500 text-xs mt-1">{college.collegeLead.phone}</p>
                      )}
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-white/10"
                        onClick={() => setIsLeadDialogOpen(true)}
                      >
                        <Edit className="w-5 h-5 text-gray-400" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 rounded-2xl bg-white/5 border border-dashed border-white/10">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h4 className="text-white font-medium mb-1">No College Lead Assigned</h4>
                    <p className="text-gray-500 text-sm mb-4">Assign a lead to activate this college</p>
                    {canManage && (
                      <Button
                        onClick={() => setIsLeadDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Lead
                      </Button>
                    )}
                  </div>
                )}

                {/* Admins */}
                {college.admins?.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {college.admins.map((admin, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                          {admin.fullName?.split(" ").map(n => n[0]).join("") || "A"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{admin.fullName}</p>
                          <p className="text-xs text-gray-500">Admin</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {college.recentEvents?.length > 0 ? college.recentEvents.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${event.status === "Upcoming" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                      }`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-500">{event.date} • {event.participants} participants</p>
                    </div>
                  </div>
                  <Badge className={event.status === "Upcoming" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}>
                    {event.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="members" className="mt-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Members Directory</h3>
            <p className="text-gray-500">View all students and faculty members</p>
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Events History</h3>
            <p className="text-gray-500">View all past and upcoming events</p>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-12 text-center">
            <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Projects Showcase</h3>
            <p className="text-gray-500">Browse projects built by this chapter</p>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Rewards History
              </h3>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{(college.rewards?.points || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Points</p>
              </div>
            </div>

            <div className="space-y-3">
              {college.rewards?.history?.length > 0 ? college.rewards.history.map((reward, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{reward.title}</h4>
                      <p className="text-sm text-gray-500">{new Date(reward.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-green-400">+{reward.points}</span>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-8">No rewards history yet</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Lead Dialog */}
      {canManage && (
        <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
          <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                {hasCollegeLead ? "Change College Lead" : "Assign College Lead"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {hasCollegeLead
                  ? "Select a new user to replace the current college lead"
                  : "Select a user from this college to assign as lead"}
              </DialogDescription>
            </DialogHeader>

          <div className="space-y-4 mt-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search users by name..."
                value={usersSearchQuery}
                onChange={(e) => setUsersSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : collegeUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users found</p>
              ) : (
                collegeUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                        {user.fullName?.split(" ").map(n => n[0]).join("") || "U"}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-600 capitalize">{user.role?.toLowerCase()}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignLead(user._id)}
                      disabled={assigningLead}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {assigningLead ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Assign
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit College Dialog */}
      {canManage && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                Edit College Details
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the college information
              </DialogDescription>
            </DialogHeader>

          <form onSubmit={handleUpdateCollege} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">College Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Website</Label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">City</Label>
                  <Input
                    value={editForm.address.city}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      address: { ...editForm.address, city: e.target.value }
                    })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">State</Label>
                  <Input
                    value={editForm.address.state}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      address: { ...editForm.address, state: e.target.value }
                    })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Country</Label>
                <Input
                  value={editForm.address.country}
                  disabled
                  className="mt-1.5 bg-white/5 border-white/5 text-gray-400"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingCollege}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updatingCollege ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}