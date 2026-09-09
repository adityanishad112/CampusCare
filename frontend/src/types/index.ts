export type UserRole = "student" | "staff" | "admin";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: number | null;
  department_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  contact_email?: string;
  created_at: string;
  staff_count: number;
  active_complaints_count: number;
}

export type ComplaintStatus =
  | "Submitted"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | "Reopened";

export type ComplaintPriority = "Low" | "Medium" | "High";

export interface Attachment {
  id: number;
  complaint_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  content_type: string;
  uploaded_by_id?: number;
  created_at: string;
  download_url: string;
  file_url?: string;
}

export interface Comment {
  id: number;
  complaint_id: number;
  author_id?: number;
  author_name?: string;
  author_role?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface StatusHistory {
  id: number;
  old_status?: string | null;
  new_status: string;
  action: string;
  changed_by_name?: string;
  changed_by_role?: string;
  remarks?: string;
  created_at: string;
}

export interface Feedback {
  id: number;
  complaint_id: number;
  student_id: number;
  student_name?: string;
  rating: number;
  comments?: string;
  created_at: string;
}

export interface DuplicateLink {
  id: number;
  primary_complaint_id: number;
  duplicate_complaint_id: number;
  duplicate_tracking_number?: string;
  duplicate_title?: string;
  similarity_score?: number;
  notes?: string;
  created_at: string;
}

export interface ComplaintListItem {
  id: number;
  tracking_number: string;
  title: string;
  category: string;
  location: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  student_id: number;
  student_name?: string;
  department_id?: number | null;
  department_name?: string | null;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  ai_confidence?: number | null;
  is_low_confidence: boolean;
  comments_count: number;
  attachments_count: number;
  created_at: string;
  updated_at: string;
}

export interface ComplaintDetail extends ComplaintListItem {
  description: string;
  suggested_category?: string;
  priority_reason?: string;
  resolution_notes?: string;
  reopened_reason?: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  attachments: Attachment[];
  comments: Comment[];
  status_history: StatusHistory[];
  feedback?: Feedback | null;
  duplicates: DuplicateLink[];
}

export interface PaginatedComplaints {
  items: ComplaintListItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface CategoryConfidence {
  category: string;
  probability: number;
}

export interface AIPredictionResult {
  suggested_category: string;
  confidence: number;
  is_low_confidence: boolean;
  top_categories: CategoryConfidence[];
  model_version: string;
}

export interface PrioritySuggestionResult {
  suggested_priority: ComplaintPriority;
  reason: string;
  is_rule_based: boolean;
}

export interface DuplicateSuggestionItem {
  complaint_id: number;
  tracking_number: string;
  title: string;
  category: string;
  location: string;
  status: string;
  similarity_score: number;
  created_at: string;
}

export interface DuplicateSuggestionResult {
  has_potential_duplicates: boolean;
  suggestions: DuplicateSuggestionItem[];
}

export interface CountByLabel {
  label: string;
  count: number;
}

export interface WeeklyTrendPoint {
  date: string;
  submitted: number;
  resolved: number;
}

export interface DepartmentWorkload {
  department_id: number;
  department_name: string;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  avg_resolution_hours: number;
}

export interface AnalyticsSummary {
  total_complaints: number;
  submitted_count: number;
  assigned_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
  reopened_count: number;
  avg_resolution_hours: number;
  satisfaction_rate: number;
  categories_breakdown: CountByLabel[];
  status_breakdown: CountByLabel[];
  priority_breakdown: CountByLabel[];
  weekly_trends: WeeklyTrendPoint[];
  department_workloads: DepartmentWorkload[];
}

export interface MLMetricsReport {
  dataset_note: string;
  test_samples_count: number;
  macro_f1: number;
  weighted_f1: number;
  macro_precision: number;
  macro_recall: number;
  per_category: Record<string, { precision: number; recall: number; f1_score: number; support: number }>;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
}
