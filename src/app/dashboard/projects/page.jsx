"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Code2,
  Plus,
  Search,
  Filter,
  Github,
  Globe,
  Eye,
  Heart,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  Trash2,
  Edit
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTech, setFilterTech] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchProjects = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("codexdashtoken");
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
        ...(filterTech !== "ALL" && { tech: filterTech }),
      });

      const response = await fetch(`${API_URL}/projects/all?${params}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
        setPagination({
          page: data.page,
          pages: data.pages,
          total: data.total
        });
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterTech]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLike = async (projectId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem("codexdashtoken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/like/${projectId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => prev.map(p => 
          p._id === projectId 
            ? { ...p, likeCount: data.liked ? p.likeCount + 1 : p.likeCount - 1, isLiked: data.liked }
            : p
        ));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    const token = localStorage.getItem("codexdashtoken");
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const allTechStacks = [...new Set(projects.flatMap(p => p.techStack))].slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Project Showcase</h1>
            <p className="text-gray-400">Discover amazing projects from our community</p>
          </div>
        </div>
        
        <Link href="/dashboard/projects/create">
          <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 group">
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Add Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: pagination.total, icon: Code2, color: "blue" },
          { label: "This Week", value: projects.filter(p => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(p.createdAt) > weekAgo;
          }).length, icon: Globe, color: "green" },
          { label: "Total Views", value: projects.reduce((acc, p) => acc + (p.viewCount || 0), 0).toLocaleString(), icon: Eye, color: "purple" },
          { label: "Total Likes", value: projects.reduce((acc, p) => acc + (p.likeCount || 0), 0).toLocaleString(), icon: Heart, color: "red" }
        ].map((stat, idx) => (
          <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 hover:border-white/20 transition-all">
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="sticky top-20 z-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search projects, tech stacks, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchProjects()}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); fetchProjects(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-3 h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-400" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-colors ${viewMode === "grid" ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-colors ${viewMode === "list" ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <label className="text-sm text-gray-500 mb-2 block">Filter by Technology</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setFilterTech("ALL"); fetchProjects(); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterTech === "ALL" ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                All Technologies
              </button>
              {allTechStacks.map(tech => (
                <button
                  key={tech}
                  onClick={() => { setFilterTech(tech); fetchProjects(); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filterTech === tech ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <Button onClick={() => fetchProjects()} variant="outline" size="sm" className="ml-auto border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {loading && (
        <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6 animate-pulse">
              <div className="h-48 bg-white/5 rounded-2xl mb-4" />
              <div className="h-6 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <Link key={project._id} href={`/dashboard/projects/${project.slug}`}>
              <div className="group relative rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                <div className="h-48 relative overflow-hidden">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage.url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => handleLike(project._id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors ${
                        project.isLiked ? 'bg-red-500/20 text-red-400' : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${project.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{project.likeCount || 0}</span>
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.slice(0, 3).map(tech => (
                        <Badge key={tech} className="bg-black/50 backdrop-blur-md text-white border-white/20 text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {project.techStack.length > 3 && (
                        <Badge className="bg-black/50 backdrop-blur-md text-white border-white/20 text-xs">
                          +{project.techStack.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                    {project.shortDescription}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      {project.owner && (
                        <div className="flex items-center gap-2">
                          {project.owner.avatar ? (
                            <img src={project.owner.avatar} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                              {project.owner.fullName?.[0] || "U"}
                            </div>
                          )}
                          <span className="text-sm text-gray-400 truncate max-w-[100px]">
                            {project.owner.fullName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="flex items-center gap-1 text-sm">
                        <Eye className="w-4 h-4" />
                        {project.viewCount || 0}
                      </span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Projects List */}
      {!loading && viewMode === "list" && (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project._id} href={`/dashboard/projects/${project.slug}`}>
              <div className="group flex gap-6 p-6 rounded-3xl bg-[#0f0f0f] border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer">
                {/* Thumbnail */}
                <div className="w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage.url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                        {project.shortDescription}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.techStack.map(tech => (
                          <Badge key={tech} className="bg-white/5 text-gray-400 border-white/10">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400">
                      <button
                        onClick={(e) => handleLike(project._id, e)}
                        className={`flex items-center gap-1.5 hover:text-red-400 transition-colors ${
                          project.isLiked ? 'text-red-400' : ''
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${project.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{project.likeCount || 0}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-5 h-5" />
                        <span className="text-sm">{project.viewCount || 0}</span>
                      </div>
                      {user?._id === project.owner?._id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                            <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                              onClick={(e) => { e.preventDefault(); handleDelete(project._id); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-24 rounded-3xl bg-[#0f0f0f] border border-white/10 border-dashed">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Code2 className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">Be the first to showcase your work</p>
          <Link href="/dashboard/projects/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchProjects(page)}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                pagination.page === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
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