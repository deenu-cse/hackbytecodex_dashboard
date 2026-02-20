"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, Plus, Search, Filter, Clock, Users, 
  MapPin, Video, Building2, Trophy, Star, TrendingUp,
  ChevronDown, X, MoreHorizontal, ArrowUpRight,
  CheckCircle2, AlertCircle, Hourglass, Loader2
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const eventTypeColors = {
  HACKATHON: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WORKSHOP: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SEMINAR: "bg-green-500/20 text-green-400 border-green-500/30",
  COMPETITION: "bg-orange-500/20 text-orange-400 border-orange-500/30"
};

const eventTypeIcons = {
  HACKATHON: Trophy,
  WORKSHOP: Calendar,
  SEMINAR: Users,
  COMPETITION: Star
};

const statusColors = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  PUBLISHED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30"
};

const modeIcons = {
  ONLINE: Video,
  OFFLINE: MapPin,
  HYBRID: Building2
};

export default function EventsPage() {
  const { isCollegeLead, isStudent, user } = useAuth();
  const router = useRouter();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchEvents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        scope: "college",
        ...(searchQuery && { search: searchQuery }),
        ...(filterType !== "ALL" && { eventType: filterType }),
        ...(filterStatus !== "ALL" && { status: filterStatus }),
      });

      const idForClg = user.college.collegeId._id;

      const response = await fetch(`${API_URL}/events/college/${idForClg}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to fetch events");
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
        setPagination({
          page: data.page,
          pages: data.pages,
          total: data.total
        });
      }
    } catch (err) {
      console.error("Fetch events error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, filterStatus]);

  // Allow both college lead and student to view, others redirected
  useEffect(() => {
    if (!isCollegeLead && !isStudent) {
      router.push("/dashboard");
    }
  }, [isCollegeLead, isStudent, router]);

  useEffect(() => {
    if (isCollegeLead || isStudent) {
      fetchEvents();
    }
  }, [isCollegeLead, isStudent, fetchEvents]);

  const filteredEvents = events; 

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const regClose = new Date(event.registration?.lastDate || event.endDate);

    if (event.status === "COMPLETED") return "completed";
    if (event.status === "CANCELLED") return "cancelled";
    if (event.status === "DRAFT") return "draft";
    if (now > end) return "ended";
    if (now >= start && now <= end) return "live";
    if (now > regClose && now < start) return "registration_closed";
    return "upcoming";
  };

  const getStatusDisplay = (event) => {
    const status = getEventStatus(event);
    const displays = {
      live: { text: "LIVE NOW", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Clock },
      upcoming: { text: "Upcoming", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Calendar },
      ended: { text: "Ended", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: CheckCircle2 },
      completed: { text: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Trophy },
      cancelled: { text: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: X },
      draft: { text: "Draft", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertCircle },
      registration_closed: { text: "Closed", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Hourglass }
    };
    return displays[status] || displays.upcoming;
  };

  const getBannerGradient = (event) => {
    if (event.banners && event.banners.length > 0) {
      return `url(${event.banners[0].url})`;
    }
    const gradients = {
      HACKATHON: "from-blue-600 via-purple-600 to-pink-600",
      WORKSHOP: "from-orange-600 via-red-600 to-pink-600",
      SEMINAR: "from-green-600 via-teal-600 to-cyan-600",
      COMPETITION: "from-purple-600 via-indigo-600 to-blue-600"
    };
    return gradients[event.eventType] || gradients.HACKATHON;
  };

  if (!isCollegeLead && !isStudent) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Events</h1>
              <p className="text-gray-400">Manage hackathons, workshops, and competitions</p>
            </div>
          </div>
        </div>
        
        {isCollegeLead && (
          <Link href="/dashboard/events/create">
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: pagination.total, icon: Calendar, color: "blue" },
          { label: "Live/Upcoming", value: events.filter(e => {
            const s = getEventStatus(e);
            return s === "live" || s === "upcoming";
          }).length, icon: Clock, color: "green" },
          { label: "Total Participants", value: events.reduce((acc, e) => acc + (e.participantsCount || 0), 0).toLocaleString(), icon: Users, color: "purple" },
          { label: "Avg Rating", value: events.length > 0 ? (events.reduce((acc, e) => acc + (e.performance?.rating || 0), 0) / events.filter(e => e.performance?.rating > 0).length || 0).toFixed(1) : "0.0", icon: Star, color: "yellow" }
        ].map((stat, idx) => (
          <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 hover:border-white/20 transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <Button onClick={() => fetchEvents()} variant="outline" size="sm" className="ml-auto border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      <div className="sticky top-20 z-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search events, clubs, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchEvents()}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); fetchEvents(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <Filter className="w-5 h-5 text-gray-400" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Event Type</label>
              <div className="flex flex-wrap gap-2">
                {["ALL", "HACKATHON", "WORKSHOP", "SEMINAR", "COMPETITION"].map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); fetchEvents(); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filterType === type 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {type === "ALL" ? "All Types" : type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {["ALL", "DRAFT", "PUBLISHED", "COMPLETED"].map(status => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); fetchEvents(); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filterStatus === status 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {status === "ALL" ? "All Status" : status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6 animate-pulse">
              <div className="h-48 bg-white/5 rounded-2xl mb-4" />
              <div className="h-6 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredEvents.map((event, idx) => {
            const statusDisplay = getStatusDisplay(event);
            const StatusIcon = statusDisplay.icon;
            const TypeIcon = eventTypeIcons[event.eventType];
            const ModeIcon = modeIcons[event.mode];
            const bannerStyle = event.banners?.length > 0 
              ? { backgroundImage: `url(${event.banners[0].url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {};
            const gradientClass = !event.banners?.length ? `bg-gradient-to-br ${getBannerGradient(event)}` : '';
            
            return (
              <Link key={event._id} href={`/dashboard/events/${event._id}`}>
                <div 
                  className="group relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`h-48 relative overflow-hidden ${gradientClass}`} style={bannerStyle}>
                    <div className="absolute inset-0 bg-black/20" />
                    {event.banners?.length > 0 && <div className="absolute inset-0 bg-black/40" />}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30" />
                    
                    <div className="absolute top-4 left-4">
                      <Badge className={`${statusDisplay.color} ${getEventStatus(event) === 'live' ? 'animate-pulse' : ''}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusDisplay.text}
                      </Badge>
                    </div>

                    <div className="absolute top-4 right-4">
                      <Badge className={`${eventTypeColors[event.eventType]} backdrop-blur-md`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {event.eventType}
                      </Badge>
                    </div>

                    {(event.participantsCount || 0) > 0 && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                        <Users className="w-4 h-4 text-white" />
                        <span className="text-sm text-white font-medium">{event.participantsCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ModeIcon className="w-4 h-4" />
                        {event.mode}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {event.club?.clubName || 'Unknown Club'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        {(event.registration?.fee || 0) > 0 ? (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                            ₹{event.registration.fee}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            Free
                          </Badge>
                        )}
                        {event.registration?.isOpen && event.registration?.lastDate && (
                          <span className="text-xs text-gray-500">
                            Closes {new Date(event.registration.lastDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {(event.performance?.rating || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-white">{event.performance.rating}</span>
                          </div>
                        )}
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                    {(event.rewardPoints?.organizer || event.rewardPoints?.participant) && (
                      <div className="mt-4 flex items-center gap-4 p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-400">Rewards:</span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-gray-400">
                            Organizer: <span className="text-white font-medium">+{event.rewardPoints.organizer || 0}</span>
                          </span>
                          <span className="text-gray-400">
                            Participant: <span className="text-white font-medium">+{event.rewardPoints.participant || 0}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-24 rounded-3xl bg-[#0f0f0f] border border-white/10 border-dashed">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
          <p className="text-gray-500 mb-6">Create your first event to get started</p>
          {isCollegeLead && (
            <Link href="/dashboard/events/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          )}
        </div>
      )}

      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchEvents(page)}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                pagination.page === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}