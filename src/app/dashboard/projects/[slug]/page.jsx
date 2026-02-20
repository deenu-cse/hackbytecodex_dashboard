"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Github,
  Globe,
  ExternalLink,
  Heart,
  Eye,
  Calendar,
  Code2,
  Share2,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Play
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ProjectDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("codexdashtoken");
      
      if (token) {
        fetch(`${API_URL}/projects/view/${slug}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      const response = await fetch(`${API_URL}/projects/${slug}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error("Project not found");
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      
      if (data.success) {
        setProject(data.data);
        setLikeCount(data.data.likeCount || 0);
        setIsLiked(data.data.isLiked || false);
      }
    } catch (err) {
      console.error("Fetch project error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const token = localStorage.getItem("codexdashtoken");
    try {
      const response = await fetch(`${API_URL}/projects/like/${project._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          text: project.shortDescription,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

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
        <Button onClick={fetchProject} variant="outline" className="border-white/10">
          Retry
        </Button>
      </div>
    );
  }

  if (!project) return null;

  const allImages = [
    project.coverImage,
    ...(project.images || [])
  ].filter(Boolean);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Navigation */}
      <Link href="/dashboard/projects">
        <Button variant="ghost" className="text-gray-400 hover:text-white -ml-4 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0f0f0f] border border-white/10 mb-8">
        {/* Main Image Carousel */}
        <div className="relative aspect-video bg-black">
          {allImages[activeImageIndex] ? (
            <img
              src={allImages[activeImageIndex].url}
              alt={project.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
          )}

          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setActiveImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image Indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === activeImageIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Bar */}
        <div className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags?.map(tag => (
                  <Badge key={tag} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {project.title}
              </h1>
              
              <p className="text-gray-400 text-lg mb-6">
                {project.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(project.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{project.viewCount || 0} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-red-400 fill-red-400' : ''}`} />
                  <span>{likeCount} likes</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleLike}
                className={`h-12 px-6 rounded-xl ${
                  isLiked 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-12 px-6 rounded-xl border-white/10 text-white hover:bg-white/10"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>

              {project.github && (
                <a href={project.github} target="_blank" rel="noopener noreferrer">
                  <Button className="h-12 px-6 bg-white text-black hover:bg-gray-200 rounded-xl">
                    <Github className="w-5 h-5 mr-2" />
                    View Code
                  </Button>
                </a>
              )}
              
              {project.live && (
                <a href={project.live} target="_blank" rel="noopener noreferrer">
                  <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Globe className="w-5 h-5 mr-2" />
                    Live Demo
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
            <h3 className="text-xl font-semibold text-white mb-4">About This Project</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-400 whitespace-pre-line leading-relaxed">
                {project.description}
              </p>
            </div>
          </div>

          {/* Gallery */}
          {project.images?.length > 0 && (
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Screenshots</h3>
              <div className="grid grid-cols-2 gap-4">
                {project.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setActiveImageIndex(idx + 1)}
                  >
                    <img
                      src={img.url}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {project.videos?.length > 0 && (
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Demo Videos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {project.videos.map((video, idx) => (
                  <div 
                    key={idx}
                    className="aspect-video rounded-xl bg-black relative group cursor-pointer overflow-hidden"
                    onClick={() => setShowVideoModal(idx)}
                  >
                    <video
                      src={video.url}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Links */}
          {project.links?.length > 0 && (
            <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Resources</h3>
              <div className="space-y-3">
                {project.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <LinkIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        {link.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{link.url}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Created By
            </h3>
            <div className="flex items-center gap-4">
              {project.owner?.avatar ? (
                <img
                  src={project.owner.avatar}
                  alt={project.owner.fullName}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                  {project.owner?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">{project.owner?.fullName}</p>
                <p className="text-gray-500 text-sm">Project Owner</p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack?.map(tech => (
                <Badge 
                  key={tech} 
                  className="bg-white/5 text-gray-300 border-white/10 px-3 py-1.5 text-sm hover:bg-white/10 transition-colors"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Project Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Views</span>
                <span className="text-white font-semibold">{project.viewCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Likes</span>
                <span className="text-white font-semibold">{likeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <Badge className={project.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                  {project.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Created</span>
                <span className="text-white">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal !== false && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden">
            <video
              src={project.videos[showVideoModal].url}
              controls
              autoPlay
              className="w-full h-full"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}