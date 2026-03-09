"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Trophy,
  Star, Edit, Trash2, Share2, Download, CheckCircle2,
  XCircle, AlertCircle, TrendingUp, Gift, Eye, Loader2,
  Globe, Video, Building2, Check, ChevronRight, 
  BarChart3, CreditCard, Activity, DollarSign, School
} from "lucide-react";
import Link from "next/link";
import RegistrationFormBuilder from "./RegistrationFormBuilder";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const eventTypeColors = {
  HACKATHON: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WORKSHOP: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SEMINAR: "bg-green-500/20 text-green-400 border-green-500/30",
  COMPETITION: "bg-orange-500/20 text-orange-400 border-orange-500/30"
};

const modeIcons = {
  ONLINE: Video,
  OFFLINE: MapPin,
  HYBRID: Building2
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function EventDetailPage() {
  const { isCollegeLead, isStudent } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId;

  const [activeTab, setActiveTab] = useState("overview");
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${API_URL}/events/single/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Event not found");
        }
        const err = await response.json();
        throw new Error(err.message || "Failed to fetch event");
      }

      const data = await response.json();

      if (data.success) {
        setEvent(data.data.event);
        setAnalytics(data.data.analytics);
      }
    } catch (err) {
      console.error("Fetch event error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isCollegeLead || isStudent) {
      fetchEvent();
    }
  }, [isCollegeLead, isStudent, fetchEvent]);

  // Allow both college lead and student to view, others redirected
  useEffect(() => {
    if (!isCollegeLead && !isStudent) {
      router.push("/dashboard");
    }
  }, [isCollegeLead, isStudent, router]);

  const getTimeRemaining = () => {
    if (!event?.startDate) return "TBA";
    const now = new Date();
    const start = new Date(event.startDate);
    const diff = start - now;

    if (diff < 0) return "Event started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h remaining`;
  };

  const getRegistrationStatus = () => {
    if (!event?.registration) return { text: "Unknown", color: "bg-gray-500/20 text-gray-400" };

    const now = new Date();
    const lastDate = new Date(event.registration.lastDate);
    if (now > lastDate) return { text: "Closed", color: "bg-red-500/20 text-red-400" };
    if (!event.registration.isOpen) return { text: "Paused", color: "bg-yellow-500/20 text-yellow-400" };
    return { text: "Open", color: "bg-green-500/20 text-green-400" };
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("codexdashtoken");

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete event");
      }

      router.push("/dashboard/events");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setShareLoading(true);
      const shareData = {
        title: event.title,
        text: event.description,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setShareLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ event, analytics }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '_')}_event_data.json`;
    link.click();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getOverviewStats = () => {
    if (!analytics?.overview) return {
      totalRegistrations: 0,
      attended: 0,
      cancelled: 0,
      completed: 0,
      totalRevenue: 0
    };
    return analytics.overview;
  };

  const getPaymentData = () => {
    if (!analytics?.paymentStats?.length) return [];
    return analytics.paymentStats.map(item => ({
      name: item._id || 'Unknown',
      value: item.count
    }));
  };

  const getRegistrationTrend = () => {
    if (!analytics?.registrationsByDay?.length) return [];
    return analytics.registrationsByDay.map(item => ({
      date: item._id,
      registrations: item.count
    }));
  };

  const getTopCollegesData = () => {
    if (!analytics?.topColleges?.length) return [];
    return analytics.topColleges.map((item, index) => ({
      name: item._id || `College ${index + 1}`,
      registrations: item.registrations
    }));
  };

  if (!isCollegeLead && !isStudent) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Error</h2>
        <p className="text-gray-400">{error}</p>
        <Button onClick={fetchEvent} variant="outline" className="border-white/10">
          Retry
        </Button>
      </div>
    );
  }
  if (!event) return null;

  const regStatus = getRegistrationStatus();
  const ModeIcon = modeIcons[event.mode] || Globe;
  const bannerStyle = event.banners?.length > 0
    ? { backgroundImage: `url(${event.banners[0].url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const stats = getOverviewStats();
  const paymentData = getPaymentData();
  const registrationTrend = getRegistrationTrend();
  const topColleges = getTopCollegesData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/events">
        <Button variant="ghost" className="text-gray-400 hover:text-white -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </Link>

      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${event.banners?.length ? '' : 'from-blue-600 via-purple-600 to-pink-600'}`} style={bannerStyle}>
        <div className="absolute inset-0 bg-black/60" />
        {event.banners?.length > 0 && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />}

        <div className="relative p-8 lg:p-12">
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge className={`${eventTypeColors[event.eventType]} text-sm px-4 py-1.5`}>
              {event.eventType}
            </Badge>
            <Badge className={`${regStatus.color} text-sm px-4 py-1.5`}>
              Registration {regStatus.text}
            </Badge>
            <Badge className="bg-white/10 text-white border-white/20 text-sm px-4 py-1.5">
              {event.mode}
            </Badge>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 max-w-3xl">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{getTimeRemaining()}</span>
            </div>
            <div className="flex items-center gap-2">
              <ModeIcon className="w-5 h-5" />
              <span>{event.location.name || "Online"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            {isCollegeLead && (
              <>
                <Link href={`/dashboard/events/${eventId}/edit`}>
                  <Button className="bg-white text-black hover:bg-gray-200 rounded-xl cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                  onClick={handleShare}
                  disabled={shareLoading}
                >
                  {shareLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                  Share
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl ml-auto"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete Event
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative bg-black/40 backdrop-blur-md border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            <div className="p-6 text-center">
              <p className="text-3xl font-bold text-white">{event.participantsCount || 0}</p>
              <p className="text-sm text-white/60">Registered</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-bold text-white">
                {Math.max(0, (event.registration?.limit || 0) - (event.participantsCount || 0))}
              </p>
              <p className="text-sm text-white/60">Spots Left</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                {analytics?.ratings?.avgRating?.toFixed(1) || event.performance?.rating || "0.0"}
              </p>
              <p className="text-sm text-white/60">Rating ({analytics?.ratings?.totalRatings || 0})</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-bold text-white">{event.performance?.score || 0}</p>
              <p className="text-sm text-white/60">Score</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#0f0f0f] border border-white/10 p-1 rounded-xl h-auto flex flex-wrap">
          {[
            { id: "overview", label: "Overview" },
            { id: "registrations", label: "Registrations", href: `/dashboard/events/${eventId}/registrations` },
            { id: "form", label: "Registration Form" },
            { id: "timeline", label: "Timeline" },
            { id: "analytics", label: "Analytics" },
            { id: "judges", label: "Judges", href: `/dashboard/events/${eventId}/judges` },
          ].map(tab => (
            tab.href ? (
              <Link key={tab.id} href={tab.href} className="flex-1">
                <TabsTrigger
                  value={tab.id}
                  className="w-full py-3 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 transition-all"
                >
                  {tab.label}
                </TabsTrigger>
              </Link>
            ) : (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 py-3 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 transition-all"
              >
                {tab.label}
              </TabsTrigger>
            )
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in duration-300">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                <h3 className="text-xl font-semibold text-white mb-4">About This Event</h3>
                <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                  {event.description || "No description provided."}
                </p>
              </div>

              {event.banners?.length > 0 && (
                <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                  <h3 className="text-xl font-semibold text-white mb-6">Event Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.banners.map((banner, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden">
                        <img
                          src={banner.url}
                          alt={`Event banner ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Prizes & Rewards
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { position: "1st", prize: "TBA", perks: ["To be announced"] },
                    { position: "2nd", prize: "TBA", perks: ["To be announced"] },
                    { position: "3rd", prize: "TBA", perks: ["To be announced"] }
                  ].map((prize, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl ${idx === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                      idx === 1 ? 'bg-gradient-to-br from-gray-400/20 to-gray-300/20 border border-gray-500/30' :
                        'bg-gradient-to-br from-orange-600/20 to-orange-400/20 border border-orange-500/30'
                      }`}>
                      <div className="text-3xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                      <p className="text-2xl font-bold text-white mb-1">{prize.prize}</p>
                      <p className="text-sm text-gray-400 mb-3">{prize.position} Prize</p>
                      <ul className="space-y-1">
                        {prize.perks.map((perk, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Organized By</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold text-white">
                    {(event.club?.clubName || "CL").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{event.club?.clubName || "Unknown Club"}</p>
                    <p className="text-sm text-gray-500">{event.college?.collegeName || "Unknown College"}</p>
                  </div>
                </div>
                {event.createdBy && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                      {(event.createdBy.fullName || "UN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{event.createdBy.fullName || "Unknown"}</p>
                      <p className="text-xs text-gray-500">Event Coordinator</p>
                    </div>
                  </div>
                )}
              </div>

              {event.rewardPoints && (
                <div className="rounded-3xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-6">
                  <h3 className="text-sm font-medium text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Reward Points
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">As Organizer</span>
                      <span className="text-2xl font-bold text-white">+{event.rewardPoints.organizer || 0}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Per Participant</span>
                      <span className="text-xl font-bold text-white">+{event.rewardPoints.participant || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Registration Progress</span>
                      <span className="text-white">
                        {event.registration?.limit
                          ? Math.round(((event.participantsCount || 0) / event.registration.limit) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${event.registration?.limit ? Math.min(100, ((event.participantsCount || 0) / event.registration.limit) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fee</span>
                    <span className="text-white">{(event.registration?.fee || 0) > 0 ? `₹${event.registration.fee}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Date</span>
                    <span className="text-white">
                      {event.registration?.lastDate
                        ? new Date(event.registration.lastDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    <span className="text-white capitalize">{event.status?.toLowerCase() || 'unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

          <TabsContent value="form" className="mt-6">
            <RegistrationFormBuilder eventId={eventId} event={event} token={localStorage.getItem("codexdashtoken") || ""} />
          </TabsContent>
        <TabsContent value="timeline" className="mt-6 space-y-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-400" />
                  Event Timeline
                </h3>
                <p className="text-gray-400 mt-1">Schedule and activities for {event.title}</p>
              </div>
              {isCollegeLead && (
                <Link href={`/dashboard/events/${eventId}/timeline/edit`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Timeline
                  </Button>
                </Link>
              )}
            </div>

            {event.timeline?.length > 0 ? (
              <div className="space-y-8">
                {event.timeline.map((day, dayIndex) => (
                  <div key={day._id || dayIndex} className="relative">
                    <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm py-4 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            Day {dayIndex + 1}
                          </h4>
                          <p className="text-sm text-blue-400">{formatDate(day.date)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="relative pl-6 space-y-4">
                      {/* Vertical Line */}
                      <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent" />

                      {day.activities.map((activity, actIndex) => (
                        <div 
                          key={activity._id || actIndex} 
                          className="relative group"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute -left-[19px] top-4 w-4 h-4 rounded-full bg-[#0f0f0f] border-2 border-blue-500 group-hover:border-purple-500 group-hover:scale-125 transition-all duration-300" />
                          
                          {/* Activity Card */}
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="text-lg font-semibold text-white">
                                    {activity.title}
                                  </h5>
                                  {actIndex === 0 && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                      Starting
                                    </Badge>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-gray-400 text-sm mb-3">
                                    {activity.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span>
                                      {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                                    </span>
                                  </div>
                                  {activity.location && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <MapPin className="w-4 h-4 text-purple-400" />
                                      <span>{activity.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Duration Badge */}
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <Activity className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-gray-300">
                                  {(() => {
                                    if (!activity.startTime || !activity.endTime) return 'TBA';
                                    const [startH, startM] = activity.startTime.split(':').map(Number);
                                    const [endH, endM] = activity.endTime.split(':').map(Number);
                                    const diff = (endH * 60 + endM) - (startH * 60 + startM);
                                    const hours = Math.floor(diff / 60);
                                    const mins = diff % 60;
                                    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">No Timeline Set</h4>
                <p className="text-gray-500 mb-6">Add activities and schedule for your event</p>
                <Link href={`/dashboard/events/${eventId}/timeline/edit`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Create Timeline
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-gray-400">Total</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalRegistrations}</p>
              <p className="text-xs text-gray-500 mt-1">Registrations</p>
            </div>

            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-sm text-gray-400">Attended</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.attended}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalRegistrations > 0 
                  ? `${Math.round((stats.attended / stats.totalRegistrations) * 100)}% rate`
                  : 'No data'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-sm text-gray-400">Cancelled</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.cancelled}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalRegistrations > 0 
                  ? `${Math.round((stats.cancelled / stats.totalRegistrations) * 100)}% rate`
                  : 'No data'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-sm text-gray-400">Revenue</span>
              </div>
              <p className="text-3xl font-bold text-white">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total collected</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Registration Trend Chart */}
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Registration Trend
              </h4>
              {registrationTrend.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationTrend}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorReg)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No registration data available yet
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Payment Status
              </h4>
              {paymentData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {paymentData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-400">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No payment data available
                </div>
              )}
            </div>
          </div>

          {/* Top Colleges Chart */}
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <School className="w-5 h-5 text-green-400" />
              Top Participating Colleges
            </h4>
            {topColleges.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topColleges} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#6b7280" 
                      fontSize={12}
                      width={150}
                      tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="registrations" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No college data available yet
              </div>
            )}
          </div>

          {/* Ratings Section */}
          {analytics?.ratings?.avgRating > 0 && (
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                Event Ratings
              </h4>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl font-bold text-white">{analytics.ratings.avgRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-400 mt-1">Average Rating</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">Based on {analytics.ratings.totalRatings} ratings</p>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                      style={{ width: `${(analytics.ratings.avgRating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}