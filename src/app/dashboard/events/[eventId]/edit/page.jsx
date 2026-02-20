"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Trophy,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
  Plus,
  GripVertical,
  CalendarDays
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const eventTypes = [
  { value: "HACKATHON", label: "Hackathon", icon: Trophy, color: "text-purple-400" },
  { value: "WORKSHOP", label: "Workshop", icon: Users, color: "text-blue-400" },
  { value: "SEMINAR", label: "Seminar", icon: Globe, color: "text-green-400" },
  { value: "COMPETITION", label: "Competition", icon: Trophy, color: "text-orange-400" },
];

const eventModes = [
  { value: "ONLINE", label: "Online", icon: Globe },
  { value: "OFFLINE", label: "Offline", icon: MapPin },
  { value: "HYBRID", label: "Hybrid", icon: Users },
];

const steps = [
  { id: "basic", label: "Basic Info", icon: Trophy },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "timeline", label: "Timeline", icon: CalendarDays },
  { id: "registration", label: "Registration", icon: Users },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "review", label: "Review", icon: Check },
];

// Helper to format date for input
const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper to format time for input (HH:MM)
const formatTimeForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
};

export default function EditEventPage() {
  const { user, isCollegeLead, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId;
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingClubs, setFetchingClubs] = useState(true);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [existingBanners, setExistingBanners] = useState([]);
  const [bannersToDelete, setBannersToDelete] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "",
    clubId: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    mode: "",
    status: "PUBLISHED",
    registration: {
      isOpen: true,
      lastDate: "",
      limit: "",
      fee: 0,
    },
    banners: [],
    bannerPreviews: [],
    timeline: []
  });

  const [errors, setErrors] = useState({});
  const [clubs, setClubs] = useState([]);

  const fetchEvent = useCallback(async () => {
    try {
      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${API_URL}/events/single/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error("Event not found");
        const err = await response.json();
        throw new Error(err.message || "Failed to fetch event");
      }

      const data = await response.json();
      if (data.success) {
        const event = data.data.event || data.data;
        
        // Parse dates
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const regLastDate = event.registration?.lastDate ? new Date(event.registration.lastDate) : null;

        // Parse existing timeline
        const existingTimeline = event.timeline || [];
        const formattedTimeline = existingTimeline.map(day => ({
          date: formatDateForInput(day.date),
          activities: day.activities.map(act => ({
            title: act.title || "",
            description: act.description || "",
            startTime: act.startTime || "09:00",
            endTime: act.endTime || "10:00",
            location: act.location || ""
          }))
        }));

        setFormData({
          title: event.title || "",
          description: event.description || "",
          eventType: event.eventType || "",
          clubId: event.club?.clubId || "",
          startDate: formatDateForInput(event.startDate),
          startTime: formatTimeForInput(event.startDate),
          endDate: formatDateForInput(event.endDate),
          endTime: formatTimeForInput(event.endDate),
          location: event.location || "",
          mode: event.mode || "",
          status: event.status || "PUBLISHED",
          registration: {
            isOpen: event.registration?.isOpen ?? true,
            lastDate: regLastDate ? regLastDate.toISOString().slice(0, 16) : "",
            limit: event.registration?.limit?.toString() || "",
            fee: event.registration?.fee || 0,
          },
          banners: [],
          bannerPreviews: [],
          timeline: formattedTimeline
        });

        // Store existing banners separately
        setExistingBanners(event.banners || []);
      }
    } catch (error) {
      console.error("Fetch event error:", error);
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchClubs = useCallback(async () => {
    if (!user?.college?.collegeId) return;

    try {
      setFetchingClubs(true);
      const token = localStorage.getItem("codexdashtoken");

      const response = await fetch(
        `${API_URL}/clubs/college/${user.college.collegeId._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch clubs");

      const data = await response.json();
      if (data.success) {
        setClubs(data.data);
      }
    } catch (error) {
      console.error("Fetch clubs error:", error);
    } finally {
      setFetchingClubs(false);
    }
  }, [user?.college?.collegeId]);

  useEffect(() => {
    if (isCollegeLead && eventId) {
      fetchEvent();
      fetchClubs();
    }
  }, [isCollegeLead, eventId, fetchEvent, fetchClubs]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isCollegeLead) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isCollegeLead, router]);

  // ===== TIMELINE MANAGEMENT FUNCTIONS =====
  
  // Add a new day to timeline
  const addTimelineDay = () => {
    const newDay = {
      date: formData.startDate || new Date().toISOString().split('T')[0],
      activities: [
        {
          title: "",
          description: "",
          startTime: "09:00",
          endTime: "10:00",
          location: ""
        }
      ]
    };
    
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, newDay]
    }));
  };

  // Remove a day from timeline
  const removeTimelineDay = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.filter((_, idx) => idx !== dayIndex)
    }));
  };

  // Update day date
  const updateDayDate = (dayIndex, date) => {
    setFormData(prev => {
      const newTimeline = [...prev.timeline];
      newTimeline[dayIndex] = { ...newTimeline[dayIndex], date };
      return { ...prev, timeline: newTimeline };
    });
  };

  // Add activity to a day
  const addActivity = (dayIndex) => {
    setFormData(prev => {
      const newTimeline = [...prev.timeline];
      const lastActivity = newTimeline[dayIndex].activities[newTimeline[dayIndex].activities.length - 1];
      const newActivity = {
        title: "",
        description: "",
        startTime: lastActivity ? lastActivity.endTime : "09:00",
        endTime: lastActivity 
          ? new Date(`2000-01-01T${lastActivity.endTime}`).getHours() + 1 < 10 
            ? `0${new Date(`2000-01-01T${lastActivity.endTime}`).getHours() + 1}:00`
            : `${new Date(`2000-01-01T${lastActivity.endTime}`).getHours() + 1}:00`
          : "10:00",
        location: ""
      };
      newTimeline[dayIndex].activities.push(newActivity);
      return { ...prev, timeline: newTimeline };
    });
  };

  // Remove activity from a day
  const removeActivity = (dayIndex, activityIndex) => {
    setFormData(prev => {
      const newTimeline = [...prev.timeline];
      newTimeline[dayIndex].activities = newTimeline[dayIndex].activities.filter((_, idx) => idx !== activityIndex);
      return { ...prev, timeline: newTimeline };
    });
  };

  // Update activity field
  const updateActivity = (dayIndex, activityIndex, field, value) => {
    setFormData(prev => {
      const newTimeline = [...prev.timeline];
      newTimeline[dayIndex].activities[activityIndex] = {
        ...newTimeline[dayIndex].activities[activityIndex],
        [field]: value
      };
      return { ...prev, timeline: newTimeline };
    });
  };

  // Auto-generate timeline days based on event duration
  const autoGenerateTimeline = () => {
    if (!formData.startDate || !formData.endDate) {
      setErrors(prev => ({ ...prev, timeline: "Please set event dates first" }));
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = [];
    
    let current = new Date(start);
    while (current <= end) {
      days.push({
        date: current.toISOString().split('T')[0],
        activities: [
          {
            title: "",
            description: "",
            startTime: "09:00",
            endTime: "17:00",
            location: formData.location || ""
          }
        ]
      });
      current.setDate(current.getDate() + 1);
    }

    setFormData(prev => ({ ...prev, timeline: days }));
    setErrors(prev => ({ ...prev, timeline: null }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === "basic") {
      if (!formData.title.trim()) newErrors.title = "Event title is required";
      if (!formData.eventType) newErrors.eventType = "Event type is required";
      if (!formData.clubId) newErrors.clubId = "Club is required";
      if (!formData.description.trim())
        newErrors.description = "Description is required";
    }

    if (step === "schedule") {
      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (!formData.startTime) newErrors.startTime = "Start time is required";
      if (!formData.endDate) newErrors.endDate = "End date is required";
      if (!formData.endTime) newErrors.endTime = "End time is required";
      if (!formData.mode) newErrors.mode = "Event mode is required";

      if (formData.startDate && formData.endDate) {
        const start = new Date(`${formData.startDate}T${formData.startTime}`);
        const end = new Date(`${formData.endDate}T${formData.endTime}`);
        if (end <= start) {
          newErrors.endDate = "End must be after start";
        }
      }

      if (formData.mode !== "ONLINE" && !formData.location.trim()) {
        newErrors.location = "Location is required for offline/hybrid events";
      }
    }

    if (step === "timeline") {
      // Timeline is optional, but if present, validate it
      if (formData.timeline.length > 0) {
        for (let i = 0; i < formData.timeline.length; i++) {
          const day = formData.timeline[i];
          if (!day.date) {
            newErrors[`timeline_day_${i}`] = `Day ${i + 1} date is required`;
          }
          for (let j = 0; j < day.activities.length; j++) {
            const act = day.activities[j];
            if (!act.title.trim()) {
              newErrors[`timeline_day_${i}_act_${j}`] = `Activity ${j + 1} title is required`;
            }
            if (!act.startTime) {
              newErrors[`timeline_day_${i}_act_${j}_time`] = `Start time required`;
            }
          }
        }
      }
    }

    if (step === "registration") {
      if (formData.registration.isOpen) {
        if (!formData.registration.lastDate) {
          newErrors.lastDate = "Registration deadline is required";
        } else {
          const regClose = new Date(formData.registration.lastDate);
          const eventStart = new Date(`${formData.startDate}T${formData.startTime}`);
          if (regClose >= eventStart) {
            newErrors.lastDate = "Must close before event starts";
          }
        }
        if (formData.registration.limit && parseInt(formData.registration.limit) < 1) {
          newErrors.limit = "Limit must be at least 1";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (validateStep(currentStep) && currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateRegistrationData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      registration: { ...prev.registration, [field]: value },
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleBannerUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const currentCount = existingBanners.length + formData.banners.length - bannersToDelete.length;

    if (currentCount + files.length > maxFiles) {
      setErrors((prev) => ({
        ...prev,
        banners: `Maximum ${maxFiles} banners allowed`,
      }));
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          banners: "Each file must be less than 5MB",
        }));
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          banners: "Only JPG, PNG, WEBP allowed",
        }));
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      banners: [...prev.banners, ...validFiles],
      bannerPreviews: [...prev.bannerPreviews, ...newPreviews],
    }));

    setErrors((prev) => ({ ...prev, banners: null }));
  };

  const removeNewBanner = (index) => {
    setFormData((prev) => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== index),
      bannerPreviews: prev.bannerPreviews.filter((_, i) => i !== index),
    }));
  };

  const removeExistingBanner = (publicId) => {
    setBannersToDelete([...bannersToDelete, publicId]);
  };

  const restoreExistingBanner = (publicId) => {
    setBannersToDelete(bannersToDelete.filter(id => id !== publicId));
  };

  const handleSubmit = async () => {
    if (!validateStep("registration")) return;

    setSaving(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const submitData = new FormData();

      // Basic info
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("eventType", formData.eventType);
      submitData.append("clubId", formData.clubId);
      submitData.append("status", formData.status);

      // Schedule
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      ).toISOString();
      const endDateTime = new Date(
        `${formData.endDate}T${formData.endTime}`
      ).toISOString();

      submitData.append("startDate", startDateTime);
      submitData.append("endDate", endDateTime);
      submitData.append("location", formData.location);
      submitData.append("mode", formData.mode);

      // Timeline - convert to JSON string as backend expects
      if (formData.timeline.length > 0) {
        const timelineData = formData.timeline.map(day => ({
          ...day,
          date: new Date(day.date).toISOString()
        }));
        submitData.append("timeline", JSON.stringify(timelineData));
      } else {
        submitData.append("timeline", JSON.stringify([]));
      }

      submitData.append(
        "registration",
        JSON.stringify({
          isOpen: formData.registration.isOpen,
          lastDate: formData.registration.lastDate
            ? new Date(formData.registration.lastDate).toISOString()
            : null,
          limit: formData.registration.limit
            ? parseInt(formData.registration.limit)
            : null,
          fee: parseInt(formData.registration.fee) || 0,
        })
      );

      formData.banners.forEach((file) => {
        submitData.append("banners", file);
      });

      if (bannersToDelete.length > 0) {
        submitData.append("bannersToDelete", JSON.stringify(bannersToDelete));
      }

      const response = await fetch(`${API_URL}/events/${eventId}/${user.college.collegeId._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update event");
      }

      if (data.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("codexdashtoken");
      
      const response = await fetch(`${API_URL}/events/${eventId}/${user.college.collegeId._id}`, {
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
      setShowDeleteDialog(false);
    }
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "Not set";
    return new Date(`${date}T${time}`).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isCollegeLead) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">
            Only College Leads can edit events.
          </p>
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in zoom-in duration-300">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Event Updated!
          </h2>
          <p className="text-gray-400 mb-6">
            {formData.title} has been successfully updated.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() =>
                router.push(`/dashboard/events/${eventId}`)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Event
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/events")}
              className="border-white/10 text-white hover:bg-white/10"
            >
              All Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const visibleExistingBanners = existingBanners.filter(b => !bannersToDelete.includes(b.public_id));

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#0f0f0f] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{formData.title}"? This action cannot be undone and all registration data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Event</h1>
            <p className="text-gray-400">Update event details</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Event
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted =
              steps.findIndex((s) => s.id === currentStep) > idx;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div
                  className={`flex flex-col items-center ${idx !== steps.length - 1 ? "flex-1" : ""
                    }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-white/5 text-gray-500"
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium transition-colors ${isActive
                        ? "text-blue-400"
                        : isCompleted
                          ? "text-green-400"
                          : "text-gray-500"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx !== steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 rounded-full transition-colors ${isCompleted ? "bg-green-500/50" : "bg-white/10"
                      }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{submitError}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
        {/* Step 1: Basic Info */}
        {currentStep === "basic" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Basic Information
                </h3>
                <p className="text-sm text-gray-500">
                  Update event details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">
                  Event Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="e.g., CodeStorm Hackathon 2024"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.title}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">
                    Event Type <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) =>
                      updateFormData("eventType", value)
                    }
                  >
                    <SelectTrigger className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {eventTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <type.icon className={`w-4 h-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.eventType && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.eventType}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-300">
                    Organizing Club <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.clubId}
                    onValueChange={(value) => updateFormData("clubId", value)}
                    disabled={fetchingClubs}
                  >
                    <SelectTrigger className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl">
                      <SelectValue
                        placeholder={fetchingClubs ? "Loading clubs..." : "Select club"}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {clubs.map((club) => (
                        <SelectItem
                          key={club._id}
                          value={club._id}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clubId && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.clubId}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-gray-300">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateFormData("status", value)}
                >
                  <SelectTrigger className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="DRAFT" className="text-white hover:bg-white/10 focus:bg-white/10">Draft</SelectItem>
                    <SelectItem value="PUBLISHED" className="text-white hover:bg-white/10 focus:bg-white/10">Published</SelectItem>
                    <SelectItem value="COMPLETED" className="text-white hover:bg-white/10 focus:bg-white/10">Completed</SelectItem>
                    <SelectItem value="CANCELLED" className="text-white hover:bg-white/10 focus:bg-white/10">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">
                  Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  placeholder="Describe your event, what participants can expect, prizes, etc."
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500 resize-none"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-400">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {currentStep === "schedule" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Schedule & Location
                </h3>
                <p className="text-sm text-gray-500">
                  When and where is your event?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">
                    Start Date <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData("startDate", e.target.value)}
                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500 [color-scheme:dark]"
                  />
                  {errors.startDate && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">
                    Start Time <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData("startTime", e.target.value)}
                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500 [color-scheme:dark]"
                  />
                  {errors.startTime && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.startTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">
                    End Date <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateFormData("endDate", e.target.value)}
                    min={formData.startDate}
                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500 [color-scheme:dark]"
                  />
                  {errors.endDate && (
                    <p className="mt-2 text-sm text-red-400">{errors.endDate}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">
                    End Time <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateFormData("endTime", e.target.value)}
                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500 [color-scheme:dark]"
                  />
                  {errors.endTime && (
                    <p className="mt-2 text-sm text-red-400">{errors.endTime}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-gray-300">
                  Event Mode <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {eventModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => updateFormData("mode", mode.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${formData.mode === mode.value
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                    >
                      <mode.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
                {errors.mode && (
                  <p className="mt-2 text-sm text-red-400">{errors.mode}</p>
                )}
              </div>

              {formData.mode !== "ONLINE" && (
                <div>
                  <Label className="text-gray-300">
                    Location <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Main Auditorium, Block A"
                    value={formData.location}
                    onChange={(e) => updateFormData("location", e.target.value)}
                    className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                  />
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-400">
                      {errors.location}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Timeline - NEW */}
        {currentStep === "timeline" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <CalendarDays className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Event Timeline
                  </h3>
                  <p className="text-sm text-gray-500">
                    Schedule detailed activities for each day
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={autoGenerateTimeline}
                  className="border-white/10 text-gray-300 hover:bg-white/10 rounded-xl"
                  disabled={!formData.startDate || !formData.endDate}
                >
                  Auto-Generate Days
                </Button>
                <Button
                  type="button"
                  onClick={addTimelineDay}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Day
                </Button>
              </div>
            </div>

            {errors.timeline && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400">{errors.timeline}</span>
              </div>
            )}

            {formData.timeline.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/10">
                <CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Timeline Added</h4>
                <p className="text-gray-500 mb-4">Add days to your event schedule or auto-generate based on event dates</p>
                <Button
                  onClick={addTimelineDay}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Day
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.timeline.map((day, dayIndex) => (
                  <div key={dayIndex} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* Day Header */}
                    <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-gray-500" />
                        <div>
                          <h4 className="text-white font-medium">Day {dayIndex + 1}</h4>
                          <Input
                            type="date"
                            value={day.date}
                            onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                            className="mt-1 h-8 bg-transparent border-white/10 text-white text-sm rounded-lg focus:border-indigo-500 [color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimelineDay(dayIndex)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Activities */}
                    <div className="p-4 space-y-4">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="relative pl-6 border-l-2 border-indigo-500/30 space-y-3">
                          {/* Timeline dot */}
                          <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-indigo-500" />
                          
                          <div className="flex items-start gap-3">
                            <div className="flex-1 grid md:grid-cols-2 gap-3">
                              <div className="md:col-span-2">
                                <Input
                                  placeholder="Activity title (e.g., Opening Ceremony)"
                                  value={activity.title}
                                  onChange={(e) => updateActivity(dayIndex, actIndex, "title", e.target.value)}
                                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-indigo-500"
                                />
                                {errors[`timeline_day_${dayIndex}_act_${actIndex}`] && (
                                  <p className="mt-1 text-xs text-red-400">
                                    {errors[`timeline_day_${dayIndex}_act_${actIndex}`]}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-500 mb-1 block">Start</Label>
                                  <Input
                                    type="time"
                                    value={activity.startTime}
                                    onChange={(e) => updateActivity(dayIndex, actIndex, "startTime", e.target.value)}
                                    className="bg-white/5 border-white/10 text-white rounded-xl focus:border-indigo-500 [color-scheme:dark]"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-500 mb-1 block">End</Label>
                                  <Input
                                    type="time"
                                    value={activity.endTime}
                                    onChange={(e) => updateActivity(dayIndex, actIndex, "endTime", e.target.value)}
                                    className="bg-white/5 border-white/10 text-white rounded-xl focus:border-indigo-500 [color-scheme:dark]"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Location</Label>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                  <Input
                                    placeholder="Room/Location"
                                    value={activity.location}
                                    onChange={(e) => updateActivity(dayIndex, actIndex, "location", e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-indigo-500"
                                  />
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <Textarea
                                  placeholder="Description (optional)"
                                  value={activity.description}
                                  onChange={(e) => updateActivity(dayIndex, actIndex, "description", e.target.value)}
                                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-indigo-500 resize-none min-h-[60px]"
                                />
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeActivity(dayIndex, actIndex)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-6"
                              disabled={day.activities.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addActivity(dayIndex)}
                        className="w-full border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Activity
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Registration */}
        {currentStep === "registration" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Registration Settings
                </h3>
                <p className="text-sm text-gray-500">
                  Configure how participants can join
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="text-white font-medium">Open Registration</h4>
                  <p className="text-sm text-gray-500">
                    Allow participants to register for this event
                  </p>
                </div>
                <Switch
                  checked={formData.registration.isOpen}
                  onCheckedChange={(checked) =>
                    updateRegistrationData("isOpen", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {formData.registration.isOpen && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <Label className="text-gray-300">Registration Deadline</Label>
                    <Input
                      type="datetime-local"
                      value={formData.registration.lastDate}
                      onChange={(e) =>
                        updateRegistrationData("lastDate", e.target.value)
                      }
                      max={`${formData.startDate}T${formData.startTime}`}
                      className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500 [color-scheme:dark]"
                    />
                    {errors.lastDate && (
                      <p className="mt-2 text-sm text-red-400">
                        {errors.lastDate}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Participant Limit</Label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={formData.registration.limit}
                        onChange={(e) =>
                          updateRegistrationData("limit", e.target.value)
                        }
                        min="1"
                        className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Leave empty for unlimited
                      </p>
                      {errors.limit && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.limit}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-300">Registration Fee (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.registration.fee}
                        onChange={(e) =>
                          updateRegistrationData("fee", e.target.value)
                        }
                        min="0"
                        className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        0 for free events
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Media */}
        {currentStep === "media" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-pink-500/10">
                <ImageIcon className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Event Media</h3>
                <p className="text-sm text-gray-500">
                  Manage banners and promotional images
                </p>
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleBannerUpload}
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer group"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-400" />
                </div>
                <p className="text-sm text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  JPG, PNG, WEBP (max 5MB each, max 5 files total)
                </p>
              </div>

              {errors.banners && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.banners}
                </p>
              )}

              {/* Existing Banners */}
              {visibleExistingBanners.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Current Banners</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {visibleExistingBanners.map((banner, idx) => (
                      <div key={banner.public_id} className="relative group aspect-video">
                        <img
                          src={banner.url}
                          alt={`Banner ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          onClick={() => removeExistingBanner(banner.public_id)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                          {idx === 0 ? "Primary" : `Banner ${idx + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Banners */}
              {formData.bannerPreviews.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">New Banners</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.bannerPreviews.map((preview, idx) => (
                      <div key={idx} className="relative group aspect-video">
                        <img
                          src={preview}
                          alt={`New banner ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          onClick={() => removeNewBanner(idx)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500/50 rounded text-xs text-white">
                          New
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === "review" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Check className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Review & Update
                </h3>
                <p className="text-sm text-gray-500">
                  Verify all details before saving
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
              {/* Event Summary */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                  {eventTypes.find((t) => t.value === formData.eventType)?.icon &&
                    (() => {
                      const Icon =
                        eventTypes.find((t) => t.value === formData.eventType)
                          ?.icon || Trophy;
                      return <Icon className="w-8 h-8" />;
                    })()}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white">
                    {formData.title}
                  </h4>
                  <Badge className="mt-1 bg-blue-500/20 text-blue-400">
                    {eventTypes.find((t) => t.value === formData.eventType)?.label}
                  </Badge>
                  <Badge className="mt-1 ml-2 bg-gray-500/20 text-gray-400">
                    {formData.status}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Club</span>
                    <span className="text-white">
                      {clubs.find((c) => c._id === formData.clubId)?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Starts</span>
                    <span className="text-white">
                      {formatDateTime(formData.startDate, formData.startTime)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Ends</span>
                    <span className="text-white">
                      {formatDateTime(formData.endDate, formData.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Mode</span>
                    <span className="text-white">{formData.mode}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Location</span>
                    <span className="text-white">
                      {formData.location || "Online"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Registration</span>
                    <span className="text-white">
                      {formData.registration.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Fee</span>
                    <span className="text-white">
                      {formData.registration.fee > 0
                        ? `₹${formData.registration.fee}`
                        : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Limit</span>
                    <span className="text-white">
                      {formData.registration.limit || "Unlimited"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Summary */}
              {formData.timeline.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <h4 className="text-sm font-medium text-indigo-400 mb-2 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Timeline Summary
                  </h4>
                  <p className="text-sm text-gray-400">
                    {formData.timeline.length} day(s) with {formData.timeline.reduce((acc, day) => acc + day.activities.length, 0)} total activities
                  </p>
                  <div className="mt-2 space-y-1">
                    {formData.timeline.map((day, idx) => (
                      <div key={idx} className="text-xs text-gray-500 flex justify-between">
                        <span>Day {idx + 1}: {new Date(day.date).toLocaleDateString()}</span>
                        <span>{day.activities.length} activities</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Changes Summary */}
              {(formData.banners.length > 0 || bannersToDelete.length > 0) && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Media Changes</h4>
                  {formData.banners.length > 0 && (
                    <p className="text-sm text-gray-400">
                      + {formData.banners.length} new banner(s) to upload
                    </p>
                  )}
                  {bannersToDelete.length > 0 && (
                    <p className="text-sm text-gray-400">
                      - {bannersToDelete.length} banner(s) to delete
                    </p>
                  )}
                </div>
              )}

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  Review your changes carefully. Click "Save Changes" to update the event.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === "basic"}
            className="h-12 px-6 border-white/10 text-white hover:bg-white/10 rounded-xl disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep !== "review" ? (
            <Button
              onClick={handleNext}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}