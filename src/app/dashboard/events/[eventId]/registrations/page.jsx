"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Users, Search, Filter, Download,
  CheckCircle2, XCircle, Clock, CreditCard,
  MoreHorizontal, ChevronDown, X, Eye,
  Mail, Phone, Calendar, Check, AlertCircle,
  TrendingUp, DollarSign, QrCode, RefreshCw, Loader2,
  MapPin, ScanLine, Crosshair, Smartphone
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const statusColors = {
  REGISTERED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30"
};

const paymentStatusColors = {
  FREE: "bg-green-500/20 text-green-400 border-green-500/30",
  PAID: "bg-green-500/20 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function EventRegistrationsPage() {
  const { isCollegeLead, isClubAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId;

  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(50);
  const qrIntervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchEventAndRegistrations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const eventRes = await fetch(`${API_URL}/events/single/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!eventRes.ok) throw new Error("Failed to fetch event");
      const eventData = await eventRes.json();
      if (eventData.success) setEvent(eventData.data);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== "ALL" && { status: filterStatus }),
        ...(filterPayment !== "ALL" && { paymentStatus: filterPayment }),
      });

      const regRes = await fetch(`${API_URL}/events/${eventId}/registrations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!regRes.ok) {
        const err = await regRes.json();
        throw new Error(err.message || "Failed to fetch registrations");
      }

      const regData = await regRes.json();
      if (regData.success) {
        setRegistrations(regData.data);
        setPagination({ page: regData.page, pages: regData.pages, total: regData.total });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, searchQuery, filterStatus, filterPayment]);

  useEffect(() => {
    if (isCollegeLead || isClubAdmin) {
      fetchEventAndRegistrations();
    }
  }, [isCollegeLead, isClubAdmin, fetchEventAndRegistrations]);

  const generateQR = async () => {
    try {
      setQrLoading(true);
      setQrError(null);

      const token = localStorage.getItem("codexdashtoken");
      const res = await fetch(`${API_URL}/events/${eventId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate QR");
      }

      setQrToken(data.token);

      const qrData = await QRCode.toDataURL(data.token, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',    
          light: '#ffffff'    
        },
        errorCorrectionLevel: 'H'
      });

      setQrDataUrl(qrData);
      setTimeLeft(50);

    } catch (err) {
      console.error("QR generation error:", err);
      setQrError(err.message);
    } finally {
      setQrLoading(false);
    }
  };

  const startQRRotation = () => {
    generateQR();

    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    qrIntervalRef.current = setInterval(() => {
      generateQR();
    }, 50000);

    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 50;
        return prev - 1;
      });
    }, 1000);
  };

  const stopQRRotation = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setQrToken("");
    setQrDataUrl("");
    setTimeLeft(50);
  };

  const handleOpenQR = () => {
    setShowQRModal(true);
    startQRRotation();
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
    stopQRRotation();
  };

  useEffect(() => {
    return () => {
      stopQRRotation();
    };
  }, []);

  const filteredRegistrations = registrations;

  const stats = {
    total: pagination.total,
    registered: registrations.filter(r => r.status === "REGISTERED").length,
    attended: registrations.filter(r => r.attendance?.marked).length,
    paid: registrations.filter(r => r.payment?.status === "PAID").length,
    revenue: registrations.filter(r => r.payment?.status === "PAID").reduce((acc, r) => acc + (r.payment?.amount || 0), 0)
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredRegistrations.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRegistrations.map(r => r._id)));
    }
  };

  const toggleSelectRow = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const updateStatus = async (ids, newStatus) => {
    try {
      const token = localStorage.getItem("codexdashtoken");

      await Promise.all(ids.map(id =>
        fetch(`${API_URL}/events/${eventId}/registrations/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        })
      ));

      fetchEventAndRegistrations();
      setSelectedRows(new Set());
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const markAttendance = async (id, attended) => {
    try {
      const token = localStorage.getItem("codexdashtoken");

      const response = await fetch(`${API_URL}/events/${eventId}/registrations/${id}/attendance`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendance: attended }),
      });

      if (!response.ok) throw new Error("Failed to update attendance");

      setRegistrations(prev => prev.map(r => r._id === id ? { ...r, attendance: { ...r.attendance, marked: attended } } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "College", "Status", "Payment", "Attendance", "Registered At", "Checked In At"];
    const csvContent = [
      headers.join(","),
      ...filteredRegistrations.map(r => [
        `"${r.user?.fullName || ''}"`,
        `"${r.user?.email || ''}"`,
        `"${r.user?.college?.collegeName || r.college?.name || ''}"`,
        r.status,
        r.payment?.status,
        r.attendance?.marked ? "Yes" : "No",
        new Date(r.createdAt).toLocaleDateString(),
        r.attendance?.markedAt ? new Date(r.attendance.markedAt).toLocaleString() : "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event?.title || 'event'}_registrations.csv`;
    link.click();
  };

  if (!isCollegeLead && !isClubAdmin) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Registrations</h1>
            <p className="text-gray-400">{event?.title || 'Loading...'}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/10 rounded-xl"
            onClick={handleOpenQR}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Show QR
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            onClick={exportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "blue" },
          { label: "Registered", value: stats.registered, icon: CheckCircle2, color: "green" },
          { label: "Attended", value: stats.attended, icon: Calendar, color: "purple" },
          { label: "Paid", value: stats.paid, icon: CreditCard, color: "yellow" },
          { label: "Revenue", value: `₹${stats.revenue}`, icon: DollarSign, color: "green" }
        ].map((stat, idx) => (
          <div key={idx} className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4">
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <Button onClick={() => fetchEventAndRegistrations()} variant="outline" size="sm" className="ml-auto border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {/* Filters & Bulk Actions */}
      <div className="sticky top-20 z-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by name, email, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchEventAndRegistrations()}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); fetchEventAndRegistrations(); }}
              className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => { setFilterPayment(e.target.value); fetchEventAndRegistrations(); }}
              className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Payments</option>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-in slide-in-from-top-2">
            <span className="text-sm text-blue-400">{selectedRows.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(Array.from(selectedRows), "COMPLETED")}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(Array.from(selectedRows), "CANCELLED")}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Participant</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">College</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Team</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Payment</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Attendance</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Checked In</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(reg._id)}
                        onChange={() => toggleSelectRow(reg._id)}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                          {(reg.user?.fullName || "UN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{reg.user?.fullName || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{reg.user?.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{reg.user?.college?.collegeName || reg.college?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{reg.formData?.department || ""}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{reg.formData?.teamName || "—"}</p>
                      <p className="text-xs text-gray-500">{reg.formData?.teamSize || "1"} members</p>
                    </td>
                    <td className="p-4">
                      <Badge className={`${paymentStatusColors[reg.payment?.status || 'FREE']} text-xs`}>
                        {reg.payment?.status === "PAID" && <Check className="w-3 h-3 mr-1" />}
                        {reg.payment?.status || "FREE"}
                      </Badge>
                      {(reg.payment?.amount || 0) > 0 && (
                        <p className="text-xs text-gray-500 mt-1">₹{reg.payment.amount}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusColors[reg.status]} text-xs`}>
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => markAttendance(reg._id, !reg.attendance?.marked)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${reg.attendance?.marked
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                          }`}
                      >
                        <Check className={`w-5 h-5 ${reg.attendance?.marked ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {reg.attendance?.marked ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-400">
                              {new Date(reg.attendance.markedAt).toLocaleTimeString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">Not checked in</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDetailModal(reg)}
                          className="hover:bg-white/10"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-white/10">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No registrations found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchEventAndRegistrations(page)}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${pagination.page === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={handleCloseQR}>
          <div
            className="w-full max-w-md rounded-3xl bg-[#0f0f0f] border border-white/10 p-8 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Attendance QR</h3>
                  <p className="text-sm text-gray-500">Scan to mark attendance</p>
                </div>
              </div>
              <button
                onClick={handleCloseQR}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* QR Display */}
            <div className="flex flex-col items-center">
              <div className="relative p-6 rounded-2xl bg-white border-4 border-blue-500/20">
                {qrLoading ? (
                  <div className="w-[300px] h-[300px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : qrError ? (
                  <div className="w-[300px] h-[300px] flex flex-col items-center justify-center text-red-400">
                    <AlertCircle className="w-12 h-12 mb-2" />
                    <p className="text-sm">{qrError}</p>
                    <Button
                      onClick={generateQR}
                      variant="outline"
                      size="sm"
                      className="mt-4 border-red-500/30 text-red-400"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : qrDataUrl ? (
                  <>
                    <img
                      src={qrDataUrl}
                      alt="Attendance QR Code"
                      className="w-[300px] h-[300px]"
                    />
                    {/* Corner markers for scanning */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-lg" />
                  </>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">
                    Refreshes in {timeLeft}s
                  </span>
                </div>
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 50) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 w-full">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-400">
                    <p className="text-white font-medium mb-1">How to scan:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Open your phone camera or QR scanner</li>
                      <li>• Point at the QR code above</li>
                      <li>• Must be within 120m of event location</li>
                      <li>• QR refreshes every 50 seconds for security</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={generateQR}
                disabled={qrLoading}
                variant="outline"
                className="mt-4 border-white/10 text-white hover:bg-white/10 rounded-xl"
              >
                {qrLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDetailModal(null)}>
          <div className="w-full max-w-2xl rounded-3xl bg-[#0f0f0f] border border-white/10 p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                  {(showDetailModal.user?.fullName || "UN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{showDetailModal.user?.fullName || "Unknown"}</h3>
                  <p className="text-gray-400">{showDetailModal.user?.email || "No email"}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Personal Info</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-white text-sm">{showDetailModal.user?.phone || showDetailModal.formData?.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-white text-sm">{showDetailModal.user?.email || showDetailModal.formData?.email || "N/A"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500 mb-1">College</p>
                    <p className="text-white text-sm">{showDetailModal.user?.college?.collegeName || showDetailModal.college?.name || "Unknown"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Registration Details</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500 mb-1">Registration ID</p>
                    <p className="text-white text-sm font-mono">{showDetailModal._id}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500 mb-1">Team</p>
                    <p className="text-white text-sm font-medium">{showDetailModal.formData?.teamName || "Individual"}</p>
                    <p className="text-xs text-gray-500">{showDetailModal.formData?.teamSize || "1"} members</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500 mb-1">Interests</p>
                    <p className="text-white text-sm">{showDetailModal.formData?.your_intrest || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Section */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                Attendance Status
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${showDetailModal.attendance?.marked ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className={showDetailModal.attendance?.marked ? 'text-green-400' : 'text-gray-400'}>
                    {showDetailModal.attendance?.marked ? 'Checked In' : 'Not Checked In'}
                  </span>
                </div>
                {showDetailModal.attendance?.marked && (
                  <span className="text-sm text-gray-500">
                    {new Date(showDetailModal.attendance.markedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {showDetailModal.attendance?.location && (
                <div className="mt-3 p-3 rounded-xl bg-black/20">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>
                      Location: {showDetailModal.attendance.location.lat?.toFixed(6)}, {showDetailModal.attendance.location.lng?.toFixed(6)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {showDetailModal.payment?.status !== "FREE" && showDetailModal.payment && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-white">₹{showDetailModal.payment.amount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge className={`${paymentStatusColors[showDetailModal.payment.status]} mt-1`}>
                      {showDetailModal.payment.status}
                    </Badge>
                  </div>
                  {showDetailModal.payment.transactionId && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="text-sm text-white font-mono">{showDetailModal.payment.transactionId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Data Section */}
            {showDetailModal.formData && Object.keys(showDetailModal.formData).length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Submitted Form Data</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(showDetailModal.formData).map(([key, value]) => {
                    if (typeof value === 'object' && value?.url) {
                      // File upload
                      return (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                          <span className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <a
                            href={value.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            View File
                          </a>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-white text-right truncate max-w-[200px]">
                          {value?.toString() || "N/A"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/10 rounded-xl"
                onClick={() => setShowDetailModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}