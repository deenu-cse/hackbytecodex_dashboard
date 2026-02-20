"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Github,
    Globe,
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
    Code2,
    Layers,
    Link as LinkIcon,
    Eye,
    Sparkles,
    Terminal
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const steps = [
    { id: "basic", label: "Basic Info", icon: Code2 },
    { id: "tech", label: "Tech Stack", icon: Layers },
    { id: "links", label: "Links", icon: LinkIcon },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "review", label: "Review", icon: Check },
];

const commonTechStacks = [
    "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express",
    "Python", "Django", "Flask", "MongoDB", "PostgreSQL", "MySQL",
    "Firebase", "Supabase", "AWS", "Docker", "TypeScript", "JavaScript",
    "Tailwind CSS", "Bootstrap", "Material UI", "Redux", "GraphQL",
    "REST API", "Socket.io", "WebRTC", "Three.js", "TensorFlow",
    "PyTorch", "OpenAI", "Stripe", "PayPal", "Auth0", "JWT"
];

const commonTags = [
    "Web App", "Mobile App", "AI/ML", "E-commerce", "SaaS", "Open Source",
    "Portfolio", "Dashboard", "Social Media", "Education", "Healthcare",
    "Finance", "Gaming", "IoT", "Blockchain", "DevOps", "Tool", "Library"
];

export default function AddProjectPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const coverInputRef = useRef(null);
    const imagesInputRef = useRef(null);
    const videosInputRef = useRef(null);

    const [currentStep, setCurrentStep] = useState("basic");
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdProject, setCreatedProject] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        shortDescription: "",
        techStack: [],
        tags: [],
        github: "",
        live: "",
        links: [],
        status: "PUBLISHED",
        cover: null,
        coverPreview: null,
        images: [],
        imagePreviews: [],
        videos: [],
        videoPreviews: []
    });

    const [errors, setErrors] = useState({});
    const [newLink, setNewLink] = useState({ title: "", url: "" });
    const [techInput, setTechInput] = useState("");
    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const validateStep = (step) => {
        const newErrors = {};

        if (step === "basic") {
            if (!formData.title.trim()) newErrors.title = "Project title is required";
            if (!formData.description.trim()) newErrors.description = "Description is required";
            if (!formData.shortDescription.trim()) {
                newErrors.shortDescription = "Short description is required";
            } else if (formData.shortDescription.length > 200) {
                newErrors.shortDescription = "Must be under 200 characters";
            }
        }

        if (step === "tech") {
            if (formData.techStack.length === 0) {
                newErrors.techStack = "Add at least one technology";
            }
            if (formData.tags.length === 0) {
                newErrors.tags = "Add at least one tag";
            }
        }

        if (step === "links") {
            if (!formData.github.trim()) {
                newErrors.github = "GitHub URL is required";
            } else if (!isValidUrl(formData.github)) {
                newErrors.github = "Please enter a valid URL";
            }
            if (formData.live && !isValidUrl(formData.live)) {
                newErrors.live = "Please enter a valid URL";
            }
        }

        if (step === "media") {
            if (!formData.cover) {
                newErrors.cover = "Cover image is required";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
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

    // Tech Stack Management
    const addTechStack = (tech) => {
        if (tech && !formData.techStack.includes(tech)) {
            setFormData(prev => ({
                ...prev,
                techStack: [...prev.techStack, tech]
            }));
            setTechInput("");
        }
    };

    const removeTechStack = (tech) => {
        setFormData(prev => ({
            ...prev,
            techStack: prev.techStack.filter(t => t !== tech)
        }));
    };

    // Tags Management
    const addTag = (tag) => {
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
            setTagInput("");
        }
    };

    const removeTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    // Links Management
    const addLink = () => {
        if (newLink.title && newLink.url && isValidUrl(newLink.url)) {
            setFormData(prev => ({
                ...prev,
                links: [...prev.links, { ...newLink }]
            }));
            setNewLink({ title: "", url: "" });
        }
    };

    const removeLink = (index) => {
        setFormData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    };

    // File Upload Handlers
    const handleCoverUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, cover: "File must be less than 5MB" }));
                return;
            }
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, cover: "Only images allowed" }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                cover: file,
                coverPreview: URL.createObjectURL(file)
            }));
            setErrors(prev => ({ ...prev, cover: null }));
        }
    };

    const handleImagesUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxFiles = 5 - formData.images.length;

        if (files.length > maxFiles) {
            setErrors(prev => ({ ...prev, images: `Maximum ${5} images allowed` }));
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) return false;
            if (!file.type.startsWith('image/')) return false;
            return true;
        });

        const newPreviews = validFiles.map(file => URL.createObjectURL(file));

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validFiles],
            imagePreviews: [...prev.imagePreviews, ...newPreviews]
        }));
    };

    const handleVideosUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxFiles = 3 - formData.videos.length;

        console.log('Selected files:', files);

        if (files.length > maxFiles) {
            setErrors(prev => ({ ...prev, videos: `Maximum ${3} videos allowed` }));
            return;
        }

        const validFiles = files.filter(file => {
            console.log('File:', file.name, 'Type:', file.type, 'Size:', file.size);
            if (file.size > 50 * 1024 * 1024) {
                console.log('File too large');
                return false;
            }
            // More lenient video type check
            const isVideo = file.type.startsWith('video/') || file.type === '' || file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv|flv)$/i);
            if (!isVideo) {
                console.log('Not a video file');
                return false;
            }
            return true;
        });

        console.log('Valid files to add:', validFiles);

        if (validFiles.length === 0) {
            setErrors(prev => ({ ...prev, videos: 'No valid video files selected' }));
            return;
        }

        const newPreviews = validFiles.map(file => {
            const url = URL.createObjectURL(file);
            console.log('Created preview URL:', url);
            return url;
        });

        setFormData(prev => ({
            ...prev,
            videos: [...prev.videos, ...validFiles],
            videoPreviews: [...prev.videoPreviews, ...newPreviews]
        }));
        
        setErrors(prev => ({ ...prev, videos: null }));
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
        }));
    };

    const removeVideo = (index) => {
        setFormData(prev => ({
            ...prev,
            videos: prev.videos.filter((_, i) => i !== index),
            videoPreviews: prev.videoPreviews.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!validateStep("media")) return;

        setLoading(true);
        setSubmitError(null);

        try {
            const token = localStorage.getItem("codexdashtoken");
            if (!token) throw new Error("Authentication required");

            const submitData = new FormData();

            submitData.append("title", formData.title.trim());
            submitData.append("description", formData.description);
            submitData.append("shortDescription", formData.shortDescription);
            submitData.append("techStack", JSON.stringify(formData.techStack));
            submitData.append("tags", JSON.stringify(formData.tags));
            submitData.append("github", formData.github);
            submitData.append("live", formData.live);
            submitData.append("links", JSON.stringify(formData.links));
            submitData.append("status", formData.status);

            if (formData.cover) {
                submitData.append("cover", formData.cover);
            }

            formData.images.forEach(file => {
                submitData.append("images", file);
            });

            formData.videos.forEach(file => {
                submitData.append("videos", file);
            });

            const response = await fetch(`${API_URL}/projects/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: submitData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create project");
            }

            if (data.success) {
                setCreatedProject(data.data);
                setIsSuccess(true);
            }
        } catch (error) {
            console.error("Submit error:", error);
            setSubmitError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center animate-in zoom-in duration-300">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Project Published!
                    </h2>
                    <p className="text-gray-400 mb-6">
                        {createdProject?.title} is now live in the showcase.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={() => router.push(`/dashboard/projects/${createdProject?.slug}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            View Project
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/dashboard/projects")}
                            className="border-white/10 text-white hover:bg-white/10"
                        >
                            All Projects
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/projects">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Add New Project</h1>
                    <p className="text-gray-400">Showcase your work to the community</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = steps.findIndex((s) => s.id === currentStep) > idx;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className={`flex flex-col items-center ${idx !== steps.length - 1 ? "flex-1" : ""}`}>
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                : isCompleted
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-white/5 text-gray-500"
                                            }`}
                                    >
                                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs font-medium transition-colors ${isActive ? "text-blue-400" : isCompleted ? "text-green-400" : "text-gray-500"
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

            {submitError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{submitError}</span>
                </div>
            )}

            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                {/* BASIC INFO STEP */}
                {currentStep === "basic" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Code2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
                                <p className="text-sm text-gray-500">Tell us about your project</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-gray-300">
                                    Project Title <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    placeholder="e.g., AI-Powered Task Manager"
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

                            <div>
                                <Label className="text-gray-300">
                                    Short Description <span className="text-red-400">*</span>
                                    <span className="text-gray-500 text-xs ml-2">({formData.shortDescription.length}/200)</span>
                                </Label>
                                <Textarea
                                    placeholder="Brief tagline for your project"
                                    value={formData.shortDescription}
                                    onChange={(e) => updateFormData("shortDescription", e.target.value)}
                                    maxLength={200}
                                    className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500 resize-none"
                                />
                                {errors.shortDescription && (
                                    <p className="mt-2 text-sm text-red-400">{errors.shortDescription}</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-gray-300">
                                    Full Description <span className="text-red-400">*</span>
                                </Label>
                                <Textarea
                                    placeholder="Describe your project, features, challenges faced, and learnings..."
                                    value={formData.description}
                                    onChange={(e) => updateFormData("description", e.target.value)}
                                    className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500 resize-none"
                                />
                                {errors.description && (
                                    <p className="mt-2 text-sm text-red-400">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                <div>
                                    <h4 className="text-white font-medium">Visibility</h4>
                                    <p className="text-sm text-gray-500">Make project visible in showcase</p>
                                </div>
                                <Switch
                                    checked={formData.status === "PUBLISHED"}
                                    onCheckedChange={(checked) => updateFormData("status", checked ? "PUBLISHED" : "DRAFT")}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TECH STACK STEP */}
                {currentStep === "tech" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <Layers className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Tech Stack & Tags</h3>
                                <p className="text-sm text-gray-500">What technologies did you use?</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Tech Stack */}
                            <div>
                                <Label className="text-gray-300 mb-2 block">
                                    Technologies Used <span className="text-red-400">*</span>
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.techStack.map((tech) => (
                                        <Badge
                                            key={tech}
                                            className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1.5 text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                            onClick={() => removeTechStack(tech)}
                                        >
                                            {tech} <X className="w-3 h-3 ml-1 inline" />
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add technology..."
                                        value={techInput}
                                        onChange={(e) => setTechInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack(techInput))}
                                        className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => addTechStack(techInput)}
                                        className="h-12 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {commonTechStacks.filter(t => !formData.techStack.includes(t)).slice(0, 8).map(tech => (
                                        <button
                                            key={tech}
                                            onClick={() => addTechStack(tech)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            + {tech}
                                        </button>
                                    ))}
                                </div>
                                {errors.techStack && (
                                    <p className="mt-2 text-sm text-red-400">{errors.techStack}</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-gray-300 mb-2 block">
                                    Project Tags <span className="text-red-400">*</span>
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1.5 text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                            onClick={() => removeTag(tag)}
                                        >
                                            {tag} <X className="w-3 h-3 ml-1 inline" />
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add tag..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                                        className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => addTag(tagInput)}
                                        className="h-12 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {commonTags.filter(t => !formData.tags.includes(t)).slice(0, 6).map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => addTag(tag)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                                {errors.tags && (
                                    <p className="mt-2 text-sm text-red-400">{errors.tags}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* LINKS STEP */}
                {currentStep === "links" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <LinkIcon className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Project Links</h3>
                                <p className="text-sm text-gray-500">Share your repositories and demos</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-gray-300">
                                    GitHub Repository <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative mt-2">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        placeholder="https://github.com/username/repo"
                                        value={formData.github}
                                        onChange={(e) => updateFormData("github", e.target.value)}
                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                                    />
                                </div>
                                {errors.github && (
                                    <p className="mt-2 text-sm text-red-400">{errors.github}</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-gray-300">Live Demo URL</Label>
                                <div className="relative mt-2">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        placeholder="https://your-project.vercel.app"
                                        value={formData.live}
                                        onChange={(e) => updateFormData("live", e.target.value)}
                                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                                    />
                                </div>
                                {errors.live && (
                                    <p className="mt-2 text-sm text-red-400">{errors.live}</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <Label className="text-gray-300 mb-3 block">Additional Links</Label>

                                {formData.links.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2 mb-2 p-3 rounded-xl bg-white/5">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{link.title}</p>
                                            <p className="text-sm text-gray-500 truncate">{link.url}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeLink(idx)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex gap-2 mt-3">
                                    <Input
                                        placeholder="Link title (e.g., Documentation)"
                                        value={newLink.title}
                                        onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                                        className="flex-[1.5] h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl"
                                    />
                                    <Input
                                        placeholder="URL"
                                        value={newLink.url}
                                        onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                                        className="flex-[2] h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl"
                                    />
                                    <Button
                                        type="button"
                                        onClick={addLink}
                                        disabled={!newLink.title || !newLink.url}
                                        className="h-12 px-4 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MEDIA STEP */}
                {currentStep === "media" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-pink-500/10">
                                <ImageIcon className="w-6 h-6 text-pink-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Project Media</h3>
                                <p className="text-sm text-gray-500">Add screenshots and videos</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Cover Image */}
                            <div>
                                <Label className="text-gray-300 mb-2 block">
                                    Cover Image <span className="text-red-400">*</span>
                                </Label>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    onChange={handleCoverUpload}
                                    accept="image/*"
                                    className="hidden"
                                />

                                {formData.coverPreview ? (
                                    <div className="relative aspect-video rounded-2xl overflow-hidden group">
                                        <img
                                            src={formData.coverPreview}
                                            alt="Cover preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => coverInputRef.current?.click()}
                                                className="border-white/30 text-white hover:bg-white/20"
                                            >
                                                Change Cover
                                            </Button>
                                        </div>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, cover: null, coverPreview: null }))}
                                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                                            <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-400" />
                                        </div>
                                        <p className="text-sm text-gray-400">Click to upload cover image</p>
                                        <p className="text-xs text-gray-600 mt-1">Recommended: 1920x1080, max 5MB</p>
                                    </div>
                                )}
                                {errors.cover && (
                                    <p className="mt-2 text-sm text-red-400">{errors.cover}</p>
                                )}
                            </div>

                            {/* Additional Images */}
                            <div>
                                <Label className="text-gray-300 mb-2 block">
                                    Screenshots <span className="text-gray-500 text-xs">(Optional, max 5)</span>
                                </Label>
                                <input
                                    type="file"
                                    ref={imagesInputRef}
                                    onChange={handleImagesUpload}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.imagePreviews.map((preview, idx) => (
                                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group">
                                            <img
                                                src={preview}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}

                                    {formData.images.length < 5 && (
                                        <button
                                            onClick={() => imagesInputRef.current?.click()}
                                            className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                                        >
                                            <Plus className="w-8 h-8 mb-2" />
                                            <span className="text-xs">Add Image</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Videos */}
                            <div>
                                <Label className="text-gray-300 mb-2 block">
                                    Demo Videos <span className="text-gray-500 text-xs">(Optional, max 3, 50MB each)</span>
                                </Label>
                                <input
                                    type="file"
                                    ref={videosInputRef}
                                    onChange={handleVideosUpload}
                                    accept="video/*"
                                    multiple
                                    className="hidden"
                                />

                                <div className="space-y-3">
                                    {formData.videoPreviews.length > 0 && (
                                        <div className="text-sm text-green-400 mb-2">✓ {formData.videoPreviews.length} video(s) selected</div>
                                    )}
                                    {formData.videoPreviews.map((preview, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/3 border border-white/10">
                                            <div className="flex-shrink-0 w-40 h-24 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                                <video
                                                    src={preview}
                                                    className="w-full h-full object-cover"
                                                    controls
                                                    controlsList="nodownload"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium text-sm break-words">{formData.videos[idx]?.name || `video_${idx + 1}`}</p>
                                                <p className="text-gray-400 text-xs mt-1">{(formData.videos[idx].size / (1024 * 1024)).toFixed(1)} MB</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeVideo(idx)}
                                                className="h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg flex-shrink-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))}

                                    {formData.videos.length < 3 && (
                                        <button
                                            onClick={() => videosInputRef.current?.click()}
                                            className="w-full py-6 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center gap-2 text-gray-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="text-sm">Add Video</span>
                                        </button>
                                    )}
                                    {errors.videos && (
                                        <p className="mt-2 text-sm text-red-400">{errors.videos}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === "review" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <Check className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Review & Publish</h3>
                                <p className="text-sm text-gray-500">Verify all details before publishing</p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
                            {formData.coverPreview && (
                                <div className="aspect-video rounded-xl overflow-hidden">
                                    <img
                                        src={formData.coverPreview}
                                        alt="Project cover"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div>
                                <h4 className="text-2xl font-bold text-white mb-2">{formData.title}</h4>
                                <p className="text-gray-400">{formData.shortDescription}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {formData.techStack.map(tech => (
                                    <Badge key={tech} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                        {tech}
                                    </Badge>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-gray-500">GitHub</span>
                                        <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[200px]">
                                            {formData.github}
                                        </a>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-gray-500">Live Demo</span>
                                        <span className="text-white">{formData.live || "Not provided"}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-gray-500">Status</span>
                                        <Badge className={formData.status === "PUBLISHED" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                                            {formData.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-gray-500">Images</span>
                                        <span className="text-white">{formData.images.length + (formData.cover ? 1 : 0)} files</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className="text-sm text-blue-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Your project will be visible in the showcase immediately after publishing.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
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
                            disabled={loading}
                            className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Publish Project
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}