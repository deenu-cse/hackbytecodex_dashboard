"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  Key
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function UsersManagementPage() {
  const { user, isSuperAdmin } = useAuth();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    college: "",
    verified: ""
  });
  const [colleges, setColleges] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("codexdashtoken");
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        ...(filters.role && { role: filters.role }),
        ...(filters.college && { collegeId: filters.college }),
        ...(filters.verified && { verified: filters.verified })
      });

      const response = await fetch(`${API_URL}/auth/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 1
        }));
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsersForExport = async () => {
    try {
      const token = localStorage.getItem("codexdashtoken");
      
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 2000,
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.college && { collegeId: filters.college }),
        ...(filters.verified && { verified: filters.verified })
      });

      const response = await fetch(`${API_URL}/auth/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users for export");
      
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error("Fetch all users error:", err);
      throw err;
    }
  };

  // Convert user data to CSV format
  const convertToCSV = (users) => {
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Role',
      'College',
      'College Code',
      'Verification Status',
      'Account Status',
      'Performance Rating',
      'Performance Score',
      'Rewards Points',
      'Rewards Tier',
      'Events Created',
      'Events Participated',
      'Hackathons Hosted',
      'Colleges Onboarded',
      'Badges',
      'Joined Date',
      'Last Login'
    ];

    const rows = users.map(user => {
      const badges = user.performance?.badges?.map(b => b.name || b.type).join(', ') || 'None';
      
      return [
        `"${user.fullName || ''}"`,
        `"${user.email || ''}"`,
        `"${user.phone || ''}"`,
        `"${user.role || ''}"`,
        `"${user.college?.collegeName || user.college?.collegeId?.name || ''}"`,
        `"${user.college?.collegeId?.code || ''}"`,
        `"${user.isVerified ? 'Verified' : 'Unverified'}"`,
        `"${user.status || 'ACTIVE'}"`,
        user.performance?.rating || 0,
        user.performance?.score || 0,
        user.rewards?.points || 0,
        `"${user.rewards?.tier || 'BRONZE'}"`,
        user.activity?.eventsCreated || 0,
        user.activity?.eventsParticipated || 0,
        user.activity?.hackathonsHosted || 0,
        user.activity?.collegesOnboarded || 0,
        `"${badges}"`,
        new Date(user.createdAt).toLocaleString(),
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Handle export to CSV
  const handleExportUsers = async () => {
    try {
      setExportLoading(true);
      
      // Fetch all users (not just current page)
      const allUsers = await fetchAllUsersForExport();
      
      if (allUsers.length === 0) {
        alert('No users to export');
        setExportLoading(false);
        return;
      }

      // Convert to CSV
      const csvData = convertToCSV(allUsers);
      
      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Successfully exported ${allUsers.length} users!`);
    } catch (err) {
      console.error("Export error:", err);
      alert('Failed to export users: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem("codexdashtoken");
      const response = await fetch(`${API_URL}/auth/colleges?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setColleges(data.data || []);
        }
      }
    } catch (err) {
      console.error("Fetch colleges error:", err);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchColleges();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [isSuperAdmin, router]);

  const handleMakeCollegeLead = async (userId, collegeId) => {
    if (!confirm("Make this user a College Lead?")) return;
    
    try {
      setActionLoading(userId);
      const token = localStorage.getItem("codexdashtoken");
      
      const response = await fetch(`${API_URL}/admins/assignCollegeLead`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, collegeId }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert("User is now a College Lead!");
        fetchUsers();
      } else {
        alert(data.message || "Failed to assign College Lead");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem("codexdashtoken");
      
      const response = await fetch(`${API_URL}/admins/users/${userId}/verify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("User verified successfully!");
        fetchUsers();
      }
    } catch (err) {
      alert("Error verifying user");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case "SUPER_ADMIN": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "COLLEGE_LEAD": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "CLUB_ADMIN": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] p-0">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage all users across colleges</p>
          </div>
          <Button 
            onClick={handleExportUsers}
            disabled={exportLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exportLoading ? 'Exporting...' : 'Export Users'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Filter by Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="COLLEGE_LEAD">College Lead</SelectItem>
                  <SelectItem value="CLUB_ADMIN">Club Admin</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* College Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Filter by College</Label>
              <Select
                value={filters.college}
                onValueChange={(value) => setFilters(prev => ({ ...prev, college: value }))}
              >
                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(college => (
                    <SelectItem key={college._id} value={college._id}>
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Verified Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Verification Status</Label>
              <Select
                value={filters.verified}
                onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value }))}
              >
                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="true">Verified Only</SelectItem>
                  <SelectItem value="false">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Filters */}
          {(filters.search || filters.role || filters.college || filters.verified) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ search: "", role: "", college: "", verified: "" })}
                className="border-white/20 text-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-500 mr-4" />
              <div>
                <p className="text-red-400 font-medium">Error loading users</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">College</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Joined</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={6} className="text-center py-20">
                        <UserX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No users found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id} className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {user.fullName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.fullName}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.college?.collegeName || user.college?.collegeId?.name ? (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Building2 className="w-4 h-4" />
                              {user.college.collegeName || user.college.collegeId.name}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={user.isVerified ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                            {user.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem className="text-gray-300 focus:text-white focus:bg-white/10">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {!user.isVerified && (
                                <DropdownMenuItem 
                                  className="text-green-400 focus:text-green-300 focus:bg-green-500/10"
                                  onClick={() => handleVerifyUser(user._id)}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Verify User
                                </DropdownMenuItem>
                              )}
                              {user.role === "STUDENT" && (
                                <DropdownMenuItem 
                                  className="text-blue-400 focus:text-blue-300 focus:bg-blue-500/10"
                                  onClick={() => handleMakeCollegeLead(user._id, user.college?.collegeId)}
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Make College Lead
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-6 border-t border-white/10">
                <div className="text-sm text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page > 1) {
                            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                          }
                        }}
                        className={pagination.page === 1 ? "pointer-events-none opacity-50" : "text-white hover:bg-white/10"}
                      />
                    </PaginationItem>
                    
                    {[...Array(pagination.pages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPagination(prev => ({ ...prev, page: i + 1 }));
                          }}
                          isActive={pagination.page === i + 1}
                          className="text-white"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page < pagination.pages) {
                            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                          }
                        }}
                        className={pagination.page === pagination.pages ? "pointer-events-none opacity-50" : "text-white hover:bg-white/10"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
