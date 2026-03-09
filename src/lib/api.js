// src/lib/api.js - Centralized API utilities

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem("codexdashtoken");

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ===== DASHBOARD ANALYTICS APIs =====

export const dashboardApi = {
  // Super Admin Dashboard
  getSuperAdminDashboard: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/analytics/superadmin`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Super Admin Dashboard Error:", error);
      throw error;
    }
  },

  // College Lead Dashboard
  getCollegeLeadDashboard: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/analytics/college-lead`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("College Lead Dashboard Error:", error);
      throw error;
    }
  },

  // Club Admin Dashboard
  getClubAdminDashboard: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/analytics/club-admin`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Club Admin Dashboard Error:", error);
      throw error;
    }
  },

  // Student Dashboard
  getStudentDashboard: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/analytics/student`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Student Dashboard Error:", error);
      throw error;
    }
  },
};

// ===== USER MANAGEMENT APIs =====

export const userApi = {
  getAllUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "20",
        search: params.search || "",
        role: params.role || "",
        collegeId: params.collegeId || "",
        verified: params.verified !== undefined ? params.verified.toString() : "",
        status: params.status || "",
        sortBy: params.sortBy || "createdAt",
        order: params.order || "desc",
      });

      const response = await fetch(`${API_URL}/user/users?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      console.error("Get All Users Error:", error);
      throw error;
    }
  },
};

// ===== EVENT APIS =====

export const eventApi = {
  // Get event by slug (public)
  getEventBySlug: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/user/events/${slug}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch event");

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Get Event Error:", error);
      throw error;
    }
  },

  // Get event form by slug
  getEventForm: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/user/events/form/${slug}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch event form");

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Get Event Form Error:", error);
      throw error;
    }
  },

  // Register for event
  registerForEvent: async (slug, formData) => {
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      const response = await fetch(`${API_URL}/user/events/register/${slug}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: submitData,
      });

      if (!response.ok) throw new Error("Registration failed");

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Register For Event Error:", error);
      throw error;
    }
  },

  // Create event form
  createEventForm: async (eventId, fields) => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/form`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) throw new Error("Failed to create form");

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Create Event Form Error:", error);
      throw error;
    }
  },

  // Update event form
  updateEventForm: async (eventId, fields) => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/form`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) throw new Error("Failed to update form");

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Update Event Form Error:", error);
      throw error;
    }
  },
};

// ===== COLLEGE APIS =====

export const collegeApi = {
  getCollegeById: async (collegeId) => {
    try {
      const response = await fetch(`${API_URL}/public/college/${collegeId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch college");

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Get College Error:", error);
      throw error;
    }
  },

  getAllColleges: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "12",
        search: params.search || "",
        city: params.city || "",
        state: params.state || "",
        tier: params.tier || "",
        status: params.status || "ACTIVE",
        sortBy: params.sortBy || "performance.score",
        sortOrder: params.sortOrder || "desc",
      });

      const response = await fetch(`${API_URL}/public/colleges/all?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch colleges");

      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      console.error("Get All Colleges Error:", error);
      throw error;
    }
  },
};

export default {
  dashboard: dashboardApi,
  user: userApi,
  event: eventApi,
  college: collegeApi,
};
