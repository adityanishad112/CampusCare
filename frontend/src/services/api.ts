import {
  User, Department, ComplaintDetail, PaginatedComplaints,
  Notification, AIPredictionResult, PrioritySuggestionResult,
  DuplicateSuggestionResult, AnalyticsSummary, MLMetricsReport
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

class ApiClient {
  getToken(): string | null {
    return localStorage.getItem("campuscare_token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token and redirect if unauthorized
      localStorage.removeItem("campuscare_token");
      localStorage.removeItem("campuscare_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    return this.request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { email: string; password: string; full_name: string }) {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<User>("/auth/me");
  }

  async listUsers(role?: string, department_id?: number) {
    let url = "/auth/users?";
    if (role) url += `role=${role}&`;
    if (department_id) url += `department_id=${department_id}&`;
    return this.request<User[]>(url);
  }

  async createUserAdmin(data: { email: string; password: string; full_name: string; role: string; department_id?: number }) {
    return this.request<User>("/auth/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Departments
  async getDepartments() {
    return this.request<Department[]>("/departments/");
  }

  async getDepartment(id: number) {
    return this.request<Department>(`/departments/${id}`);
  }

  async createDepartment(data: { name: string; code: string; description?: string; contact_email?: string }) {
    return this.request<Department>("/departments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: number, data: Partial<Department>) {
    return this.request<Department>(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getDepartmentStaff(id: number) {
    return this.request<User[]>(`/departments/${id}/staff`);
  }

  // Complaints
  async submitComplaint(data: {
    title: string;
    description: string;
    category: string;
    location: string;
    suggested_category?: string;
    ai_confidence?: number;
    priority?: string;
    priority_reason?: string;
  }) {
    return this.request<ComplaintDetail>("/complaints/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listComplaints(params: {
    page?: number;
    size?: number;
    status?: string;
    category?: string;
    priority?: string;
    department_id?: number;
    search?: string;
    assigned_to_me?: boolean;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.size) query.append("size", params.size.toString());
    if (params.status) query.append("status", params.status);
    if (params.category) query.append("category", params.category);
    if (params.priority) query.append("priority", params.priority);
    if (params.department_id) query.append("department_id", params.department_id.toString());
    if (params.search) query.append("search", params.search);
    if (params.assigned_to_me) query.append("assigned_to_me", "true");

    return this.request<PaginatedComplaints>(`/complaints/?${query.toString()}`);
  }

  async getComplaint(id: number) {
    return this.request<ComplaintDetail>(`/complaints/${id}`);
  }

  async transitionStatus(id: number, data: { new_status: string; remarks?: string; resolution_notes?: string }) {
    return this.request<ComplaintDetail>(`/complaints/${id}/transition`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async claimComplaint(id: number) {
    return this.request<ComplaintDetail>(`/complaints/${id}/claim`, {
      method: "POST",
    });
  }

  async reopenComplaint(id: number, data: { reopened_reason: string }) {
    return this.request<ComplaintDetail>(`/complaints/${id}/reopen`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async reassignComplaint(id: number, data: { department_id?: number; assigned_staff_id?: number; remarks: string }) {
    return this.request<ComplaintDetail>(`/complaints/${id}/reassign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async adminOverride(id: number, data: { category?: string; priority?: string; department_id?: number; remarks: string }) {
    return this.request<ComplaintDetail>(`/complaints/${id}/override`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addComment(id: number, data: { content: string; is_internal?: boolean }) {
    return this.request(`/complaints/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadAttachment(id: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request(`/complaints/${id}/attachments`, {
      method: "POST",
      body: formData,
    });
  }

  async submitFeedback(id: number, data: { rating: number; comments?: string }) {
    return this.request(`/complaints/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDuplicateSuggestions(id: number) {
    return this.request<DuplicateSuggestionResult>(`/complaints/${id}/duplicates`);
  }

  async linkDuplicate(id: number, data: { primary_complaint_id: number; duplicate_complaint_id: number; notes?: string }) {
    return this.request(`/complaints/${id}/link-duplicate`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ML Services
  async predictCategory(data: { title: string; description: string; location?: string }) {
    return this.request<AIPredictionResult>("/ml/predict-category", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async suggestPriority(title: string, description: string, category: string = "") {
    const params = new URLSearchParams({ title, description, category });
    return this.request<PrioritySuggestionResult>(`/ml/suggest-priority?${params.toString()}`, {
      method: "POST",
    });
  }

  async getMLMetrics() {
    return this.request<MLMetricsReport>("/ml/metrics");
  }

  // Analytics
  async getAnalytics(department_id?: number) {
    const url = department_id ? `/analytics/summary?department_id=${department_id}` : "/analytics/summary";
    return this.request<AnalyticsSummary>(url);
  }

  getCSVExportUrl(params: { status?: string; category?: string; department_id?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.category) query.append("category", params.category);
    if (params.department_id) query.append("department_id", params.department_id.toString());
    return `${API_BASE}/analytics/export/csv?${query.toString()}`;
  }

  // Notifications
  async getNotifications() {
    return this.request<Notification[]>("/notifications/");
  }

  async markNotificationRead(id: number) {
    return this.request<Notification>(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>("/notifications/read-all", {
      method: "PUT",
    });
  }

  getAttachmentUrl(downloadUrl: string): string {
    if (!downloadUrl) return "";
    const token = this.getToken();
    const serverBase = API_BASE.replace(/\/api\/v1\/?$/, "");
    const fullUrl = downloadUrl.startsWith("http") ? downloadUrl : `${serverBase}${downloadUrl}`;
    if (!token) return fullUrl;
    const separator = fullUrl.includes("?") ? "&" : "?";
    return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  getFileUrl(fileUrl?: string): string {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    const serverBase = API_BASE.replace(/\/api\/v1\/?$/, "");
    return `${serverBase}${fileUrl}`;
  }
}

export const api = new ApiClient();
