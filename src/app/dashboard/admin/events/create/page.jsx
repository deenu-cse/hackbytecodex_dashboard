// app/dashboard/admin/events/create/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
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
    Plus,
    Trash2,
    GripVertical,
    CalendarDays,
    Crown,
    Star
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

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
    { id: "basic", label: "Basic Info", icon: Crown },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "timeline", label: "Timeline", icon: CalendarDays },
    { id: "registration", label: "Registration", icon: Users },
    { id: "rewards", label: "Rewards", icon: Star },
    { id: "externallinks", label: "External Links", icon: Globe },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "review", label: "Review", icon: Check },
];

export default function AdminCreateEventPage() {
    const { user, isSuperAdmin, isAuthenticated } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [currentStep, setCurrentStep] = useState("basic");
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdEvent, setCreatedEvent] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        eventType: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        mode: "",
        registration: {
            isOpen: true,
            lastDate: "",
            limit: "",
            fee: 0,
        },
        rewardPoints: {
            organizer: 10,
            participant: 5
        },
        externalLinks: {
            website: "",
            registration: "",
            referralCode: "",
            additionalInfo: {}
        },
        banners: [],
        bannerPreviews: [],
        timeline: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        if (!isSuperAdmin) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, isSuperAdmin, router]);

    const addTimelineDay = () => {
        const newDay = {
            date: formData.startDate || new Date().toISOString().split('T')[0],
            activities: [{
                title: "",
                description: "",
                startTime: "09:00",
                endTime: "10:00",
                location: ""
            }]
        };
        setFormData(prev => ({ ...prev, timeline: [...prev.timeline, newDay] }));
    };

    const removeTimelineDay = (dayIndex) => {
        setFormData(prev => ({
            ...prev,
            timeline: prev.timeline.filter((_, idx) => idx !== dayIndex)
        }));
    };

    const updateDayDate = (dayIndex, date) => {
        setFormData(prev => {
            const newTimeline = [...prev.timeline];
            newTimeline[dayIndex] = { ...newTimeline[dayIndex], date };
            return { ...prev, timeline: newTimeline };
        });
    };

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

    const removeActivity = (dayIndex, activityIndex) => {
        setFormData(prev => {
            const newTimeline = [...prev.timeline];
            newTimeline[dayIndex].activities = newTimeline[dayIndex].activities.filter((_, idx) => idx !== activityIndex);
            return { ...prev, timeline: newTimeline };
        });
    };

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
                activities: [{
                    title: "",
                    description: "",
                    startTime: "09:00",
                    endTime: "17:00",
                    location: formData.location || ""
                }]
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
            if (!formData.description.trim()) newErrors.description = "Description is required";
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
                if (end <= start) newErrors.endDate = "End must be after start";
            }

            if (formData.mode !== "ONLINE" && !formData.location.trim()) {
                newErrors.location = "Location is required for offline/hybrid events";
            }
        }

        if (step === "timeline" && formData.timeline.length > 0) {
            for (let i = 0; i < formData.timeline.length; i++) {
                const day = formData.timeline[i];
                if (!day.date) newErrors[`timeline_day_${i}`] = `Day ${i + 1} date is required`;
                for (let j = 0; j < day.activities.length; j++) {
                    const act = day.activities[j];
                    if (!act.title.trim()) {
                        newErrors[`timeline_day_${i}_act_${j}`] = `Activity ${j + 1} title is required`;
                    }
                }
            }
        }

        if (step === "registration" && formData.registration.isOpen) {
            if (!formData.registration.lastDate) {
                newErrors.lastDate = "Registration deadline is required";
            } else {
                const regClose = new Date(formData.registration.lastDate);
                const eventStart = new Date(`${formData.startDate}T${formData.startTime}`);
                if (regClose >= eventStart) newErrors.lastDate = "Must close before event starts";
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
        if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1].id);
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const updateRegistrationData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            registration: { ...prev.registration, [field]: value }
        }));
    };

    const updateRewardPoints = (field, value) => {
        setFormData(prev => ({
            ...prev,
            rewardPoints: { ...prev.rewardPoints, [field]: parseInt(value) || 0 }
        }));
    };

    const handleBannerUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxFiles = 5;
        const currentCount = formData.banners.length;

        if (currentCount + files.length > maxFiles) {
            setErrors(prev => ({ ...prev, banners: `Maximum ${maxFiles} banners allowed` }));
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, banners: "Each file must be less than 5MB" }));
                return false;
            }
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                setErrors(prev => ({ ...prev, banners: "Only JPG, PNG, WEBP allowed" }));
                return false;
            }
            return true;
        });

        const newPreviews = validFiles.map(file => URL.createObjectURL(file));

        setFormData(prev => ({
            ...prev,
            banners: [...prev.banners, ...validFiles],
            bannerPreviews: [...prev.bannerPreviews, ...newPreviews]
        }));
    };

    const removeBanner = (index) => {
        setFormData(prev => ({
            ...prev,
            banners: prev.banners.filter((_, i) => i !== index),
            bannerPreviews: prev.bannerPreviews.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!validateStep("registration")) return;

        setLoading(true);
        setSubmitError(null);

        try {
            const token = localStorage.getItem("codexdashtoken");
            if (!token) throw new Error("Authentication required");

            const submitData = new FormData();

            submitData.append("title", formData.title);
            submitData.append("description", formData.description);
            submitData.append("eventType", formData.eventType);

            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
            const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();

            submitData.append("startDate", startDateTime);
            submitData.append("endDate", endDateTime);
            submitData.append("location", formData.location);
            submitData.append("mode", formData.mode);

            if (formData.timeline.length > 0) {
                const timelineData = formData.timeline.map(day => ({
                    ...day,
                    date: new Date(day.date).toISOString()
                }));
                submitData.append("timeline", JSON.stringify(timelineData));
            }

            submitData.append("registration", JSON.stringify({
                isOpen: formData.registration.isOpen,
                lastDate: formData.registration.lastDate
                    ? new Date(formData.registration.lastDate).toISOString()
                    : null,
                limit: formData.registration.limit ? parseInt(formData.registration.limit) : null,
                fee: parseInt(formData.registration.fee) || 0,
            }));

            submitData.append("rewardPoints", JSON.stringify(formData.rewardPoints));

            // Add external links
            if (formData.externalLinks.website) {
                submitData.append("externalLinks[website]", formData.externalLinks.website);
            }
            if (formData.externalLinks.registration) {
                submitData.append("externalLinks[registration]", formData.externalLinks.registration);
            }
            if (formData.externalLinks.referralCode) {
                submitData.append("externalLinks[referralCode]", formData.externalLinks.referralCode);
            }
            if (formData.externalLinks.additionalInfo && Object.keys(formData.externalLinks.additionalInfo).length > 0) {
                submitData.append("externalLinks[additionalInfo]", JSON.stringify(formData.externalLinks.additionalInfo));
            }

            formData.banners.forEach(file => submitData.append("banners", file));

            // Use admin endpoint - no collegeId needed!
            const response = await fetch(`${API_URL}/events/global`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: submitData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to create event");

            if (data.success) {
                setCreatedEvent(data.data);
                setIsSuccess(true);
            }
        } catch (error) {
            console.error("Submit error:", error);
            setSubmitError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date, time) => {
        if (!date || !time) return "Not set";
        return new Date(`${date}T${time}`).toLocaleString("en-US", {
            weekday: "short", month: "short", day: "numeric", year: "numeric",
            hour: "numeric", minute: "2-digit"
        });
    };

    if (!isSuperAdmin) return null;

    if (isSuccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center animate-in zoom-in duration-300">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Crown className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Global Event Created!</h2>
                    <p className="text-gray-400 mb-6">{createdEvent?.title} is now live for all users.</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => router.push(`/dashboard/admin/events/${createdEvent?._id}`)}
                            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                            View Event
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/dashboard/admin/events")}
                            className="border-white/10 text-white hover:bg-white/10">
                            All Events
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/admin/events">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Crown className="w-6 h-6 text-yellow-500" />
                        <h1 className="text-3xl font-bold text-white">Create Global Event</h1>
                    </div>
                    <p className="text-gray-400">Host a platform-wide event for all colleges</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
                        const StepIcon = step.icon;
                        return (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className={`flex flex-col items-center ${idx !== steps.length - 1 ? "flex-1" : ""}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30" :
                                        isCompleted ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-500"
                                        }`}>
                                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${isActive ? "text-yellow-400" : isCompleted ? "text-green-400" : "text-gray-500"}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx !== steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-4 rounded-full ${isCompleted ? "bg-green-500/50" : "bg-white/10"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {submitError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{submitError}</span>
                </div>
            )}

            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                {/* Step Content - Similar to college lead but without club selection */}
                {currentStep === "basic" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                                <Crown className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
                                <p className="text-sm text-gray-500">Create a platform-wide event</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-gray-300">Event Title <span className="text-red-400">*</span></Label>
                                <Input placeholder="e.g., National Coding Championship 2024" value={formData.title}
                                    onChange={(e) => updateFormData("title", e.target.value)}
                                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl" />
                                {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title}</p>}
                            </div>

                            <div>
                                <Label className="text-gray-300">Event Type <span className="text-red-400">*</span></Label>
                                <Select value={formData.eventType} onValueChange={(v) => updateFormData("eventType", v)}>
                                    <SelectTrigger className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                                        {eventTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value} className="text-white">
                                                <div className="flex items-center gap-2">
                                                    <type.icon className={`w-4 h-4 ${type.color}`} />
                                                    {type.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-gray-300">Description <span className="text-red-400">*</span></Label>
                                <Textarea placeholder="Describe your global event..." value={formData.description}
                                    onChange={(e) => updateFormData("description", e.target.value)}
                                    className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white rounded-xl" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Step - Same as college lead */}
                {currentStep === "schedule" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Calendar className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Schedule & Location</h3>
                                <p className="text-sm text-gray-500">When and where is your event?</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-300">Start Date <span className="text-red-400">*</span></Label>
                                    <Input type="date" value={formData.startDate}
                                        onChange={(e) => updateFormData("startDate", e.target.value)}
                                        className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                </div>
                                <div>
                                    <Label className="text-gray-300">Start Time <span className="text-red-400">*</span></Label>
                                    <Input type="time" value={formData.startTime}
                                        onChange={(e) => updateFormData("startTime", e.target.value)}
                                        className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-300">End Date <span className="text-red-400">*</span></Label>
                                    <Input type="date" value={formData.endDate}
                                        onChange={(e) => updateFormData("endDate", e.target.value)}
                                        min={formData.startDate}
                                        className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                </div>
                                <div>
                                    <Label className="text-gray-300">End Time <span className="text-red-400">*</span></Label>
                                    <Input type="time" value={formData.endTime}
                                        onChange={(e) => updateFormData("endTime", e.target.value)}
                                        className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-300">Event Mode <span className="text-red-400">*</span></Label>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {eventModes.map(mode => (
                                        <button key={mode.value} type="button" onClick={() => updateFormData("mode", mode.value)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${formData.mode === mode.value ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/10 bg-white/5 text-gray-400"
                                                }`}>
                                            <mode.icon className="w-6 h-6" />
                                            <span className="text-sm font-medium">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.mode !== "ONLINE" && (
                                <div>
                                    <Label className="text-gray-300">Location <span className="text-red-400">*</span></Label>
                                    <Input placeholder="e.g., Multiple Venues / Main Campus" value={formData.location}
                                        onChange={(e) => updateFormData("location", e.target.value)}
                                        className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Timeline Step - Same as college lead */}
                {currentStep === "timeline" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-indigo-500/10">
                                    <CalendarDays className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Event Timeline</h3>
                                    <p className="text-sm text-gray-500">Schedule detailed activities</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={autoGenerateTimeline}
                                    disabled={!formData.startDate || !formData.endDate}
                                    className="border-white/10 text-gray-300 rounded-xl">
                                    Auto-Generate
                                </Button>
                                <Button type="button" onClick={addTimelineDay}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                                    <Plus className="w-4 h-4 mr-2" /> Add Day
                                </Button>
                            </div>
                        </div>

                        {formData.timeline.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/10">
                                <CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <Button onClick={addTimelineDay} variant="outline" className="border-white/10 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Add First Day
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {formData.timeline.map((day, dayIndex) => (
                                    <div key={dayIndex} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
                                            <div className="flex items-center gap-4">
                                                <GripVertical className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <h4 className="text-white font-medium">Day {dayIndex + 1}</h4>
                                                    <Input type="date" value={day.date}
                                                        onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                                                        className="mt-1 h-8 bg-transparent border-white/10 text-white text-sm [color-scheme:dark]" />
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeTimelineDay(dayIndex)}
                                                className="text-red-400 hover:bg-red-500/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            {day.activities.map((activity, actIndex) => (
                                                <div key={actIndex} className="relative pl-6 border-l-2 border-indigo-500/30">
                                                    <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-indigo-500" />
                                                    <div className="grid md:grid-cols-2 gap-3 items-start">
                                                        <div className="md:col-span-2 flex items-center gap-2">
                                                            <Input placeholder="Activity title" value={activity.title}
                                                                onChange={(e) => updateActivity(dayIndex, actIndex, "title", e.target.value)}
                                                                className="flex-1 bg-white/5 border-white/10 text-white rounded-xl" />
                                                            {/* REMOVE ACTIVITY BUTTON */}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeActivity(dayIndex, actIndex)}
                                                                className="text-red-400 hover:bg-red-500/10 h-10 w-10 p-0"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Input type="time" value={activity.startTime}
                                                                onChange={(e) => updateActivity(dayIndex, actIndex, "startTime", e.target.value)}
                                                                className="bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                                            <Input type="time" value={activity.endTime}
                                                                onChange={(e) => updateActivity(dayIndex, actIndex, "endTime", e.target.value)}
                                                                className="bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                                        </div>
                                                        <Input placeholder="Location" value={activity.location}
                                                            onChange={(e) => updateActivity(dayIndex, actIndex, "location", e.target.value)}
                                                            className="bg-white/5 border-white/10 text-white rounded-xl" />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" onClick={() => addActivity(dayIndex)}
                                                className="w-full border-dashed border-white/20 text-gray-400 rounded-xl">
                                                <Plus className="w-4 h-4 mr-2" /> Add Activity
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Registration Step */}
                {currentStep === "registration" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Users className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Registration Settings</h3>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div>
                                <h4 className="text-white font-medium">Open Registration</h4>
                            </div>
                            <Switch checked={formData.registration.isOpen}
                                onCheckedChange={(c) => updateRegistrationData("isOpen", c)}
                                className="data-[state=checked]:bg-blue-600" />
                        </div>
                        {formData.registration.isOpen && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Registration Deadline</Label>
                                    <Input type="datetime-local" value={formData.registration.lastDate}
                                        onChange={(e) => updateRegistrationData("lastDate", e.target.value)}
                                        className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]" />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Participant Limit</Label>
                                        <Input type="number" placeholder="Unlimited" value={formData.registration.limit}
                                            onChange={(e) => updateRegistrationData("limit", e.target.value)}
                                            className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl" />
                                    </div>
                                    <div>
                                        <Label>Registration Fee (₹)</Label>
                                        <Input type="number" placeholder="0" value={formData.registration.fee}
                                            onChange={(e) => updateRegistrationData("fee", e.target.value)}
                                            className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* NEW: Rewards Step */}
                {currentStep === "rewards" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <Star className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Reward Points</h3>
                                <p className="text-sm text-gray-500">Set platform reward points for this event</p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                                <Label className="text-yellow-400 font-medium">Organizer Points</Label>
                                <p className="text-sm text-gray-400 mb-4">Points awarded to event organizers</p>
                                <Input type="number" value={formData.rewardPoints.organizer}
                                    onChange={(e) => updateRewardPoints("organizer", e.target.value)}
                                    className="h-12 bg-black/20 border-yellow-500/30 text-white text-2xl font-bold text-center" />
                            </div>
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                                <Label className="text-blue-400 font-medium">Participant Points</Label>
                                <p className="text-sm text-gray-400 mb-4">Points awarded to attendees</p>
                                <Input type="number" value={formData.rewardPoints.participant}
                                    onChange={(e) => updateRewardPoints("participant", e.target.value)}
                                    className="h-12 bg-black/20 border-blue-500/30 text-white text-2xl font-bold text-center" />
                            </div>
                        </div>
                    </div>
                )}

                {/* NEW: External Links Step */}
                {currentStep === "externallinks" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-cyan-500/10">
                                <Globe className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">External Links & Info</h3>
                                <p className="text-sm text-gray-500">Add website, referral codes, and additional information</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <Label className="text-gray-300">Event Website URL</Label>
                                <Input 
                                    placeholder="https://your-event-website.com" 
                                    value={formData.externalLinks.website}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        externalLinks: { ...prev.externalLinks, website: e.target.value }
                                    }))}
                                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Direct Registration Link</Label>
                                <Input 
                                    placeholder="https://forms.example.com/register" 
                                    value={formData.externalLinks.registration}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        externalLinks: { ...prev.externalLinks, registration: e.target.value }
                                    }))}
                                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Referral Code</Label>
                                <Input 
                                    placeholder="REF2024" 
                                    value={formData.externalLinks.referralCode}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        externalLinks: { ...prev.externalLinks, referralCode: e.target.value.toUpperCase() }
                                    }))}
                                    className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300">Additional Information</Label>
                                <div className="space-y-2 mt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input 
                                            placeholder="Key (e.g., Discord, Sponsor)" 
                                            id="info-key"
                                            className="h-10 bg-white/5 border-white/10 text-white rounded-xl"
                                        />
                                        <Input 
                                            placeholder="Value" 
                                            id="info-value"
                                            className="h-10 bg-white/5 border-white/10 text-white rounded-xl"
                                        />
                                    </div>
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const keyInput = document.getElementById('info-key');
                                            const valueInput = document.getElementById('info-value');
                                            if (keyInput.value && valueInput.value) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    externalLinks: {
                                                        ...prev.externalLinks,
                                                        additionalInfo: {
                                                            ...prev.externalLinks.additionalInfo,
                                                            [keyInput.value]: valueInput.value
                                                        }
                                                    }
                                                }));
                                                keyInput.value = '';
                                                valueInput.value = '';
                                            }
                                        }}
                                        className="w-full border-dashed border-white/20 text-gray-400 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Info
                                    </Button>
                                </div>
                                
                                {/* Display added info */}
                                {formData.externalLinks.additionalInfo && Object.keys(formData.externalLinks.additionalInfo).length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        {Object.entries(formData.externalLinks.additionalInfo).map(([key, value], idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <div>
                                                    <span className="text-sm font-medium text-cyan-400">{key}:</span>
                                                    <span className="text-sm text-gray-300 ml-2">{value}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newInfo = { ...formData.externalLinks.additionalInfo };
                                                        delete newInfo[key];
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            externalLinks: { ...prev.externalLinks, additionalInfo: newInfo }
                                                        }));
                                                    }}
                                                    className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Media Step */}
                {currentStep === "media" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-pink-500/10">
                                <ImageIcon className="w-6 h-6 text-pink-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Event Media</h3>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleBannerUpload} accept="image/*" multiple className="hidden" />
                        <div onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/30 cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-4" />
                            <p className="text-sm text-gray-400">Click to upload banners (max 5)</p>
                        </div>
                        {formData.bannerPreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-4">
                                {formData.bannerPreviews.map((preview, idx) => (
                                    <div key={idx} className="relative aspect-video">
                                        <img src={preview} className="w-full h-full object-cover rounded-xl" />
                                        <button onClick={() => removeBanner(idx)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Review Step */}
                {currentStep === "review" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Check className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Review & Publish</h3>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <Crown className="w-8 h-8 text-yellow-500" />
                                <div>
                                    <h4 className="text-2xl font-bold text-white">{formData.title}</h4>
                                    <Badge className="bg-yellow-500/20 text-yellow-400">Global Event</Badge>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-500">Type</span>
                                    <span className="text-white">{formData.eventType}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-500">Mode</span>
                                    <span className="text-white">{formData.mode}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-500">Starts</span>
                                    <span className="text-white">{formatDateTime(formData.startDate, formData.startTime)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-gray-500">Rewards</span>
                                    <span className="text-white">{formData.rewardPoints.organizer} / {formData.rewardPoints.participant} pts</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <p className="text-sm text-yellow-400">
                                    This will create a <strong>Global Event</strong> visible to all platform users across all colleges.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === "basic"}
                        className="h-12 px-6 border-white/10 text-white hover:bg-white/10 rounded-xl">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    {currentStep !== "review" ? (
                        <Button onClick={handleNext} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            Continue <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}
                            className="h-12 px-8 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Crown className="w-5 h-5 mr-2" /> Publish Global Event</>}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}