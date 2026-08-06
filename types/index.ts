// Account Types
export type AccountType = 'user' | 'employee' | 'business_owner' | 'other';
export type Gender = 'male' | 'female';

// Organization
export interface Organisation {
  id: number;
  created?: string;
  updated?: string;
  deleted?: string | null;
  name: string;
  subdomain: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  email_domain?: string | null;
  allowed_auth_methods?: string[];
  logo?: string | null;
  address?: any;
  owner?: number;
}

/** Organisation personalisation (branding, timezone, countries) – GET /api/v1/client/organisation/personalisation/current/ */
export interface OrganisationPersonalisation {
  id: number;
  organisation_id: number;
  organisation_name: string;
  subdomain: string;
  logo: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  favicon: string | null;
  countries: string[];
  timezone: string;
  display_name: string;
}

/** PATCH /api/v1/client/organisation/personalisation/current/ – all fields optional */
export interface UpdateOrganisationPersonalisationRequest {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  countries?: string[];
  timezone?: string;
  display_name?: string;
}

// Permission
export interface Permission {
  id: number;
  name: string;
  created?: string;
  updated?: string;
}

// Role
export interface Role {
  id: number;
  organisation: number;
  name: string;
  description: string;
  permissions: Permission[];
  permission_ids?: number[]; // For write operations
  created?: string;
  updated?: string;
}

// Employee Profile
export interface EmployeeProfile {
  id: number;
  created?: string;
  updated?: string;
  deleted?: string | null;
  position?: string;
  base_salary?: string;
  department?: string;
  date_hired?: string | null;
  emergency_contact?: string | null;
  national_id?: string | null;
  account: number;
  manager?: number | null;
  organisation: Organisation;
  role?: Role;
}

// User/Account
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  account_type: AccountType;
  phone_number_confirmed: boolean;
  must_reset_password: boolean;
  organisation?: Organisation;
  gender?: Gender | null;
  employee_profile?: EmployeeProfile;
}

// Authentication Request Types
export interface LoginRequest {
  email: string;
  password: string; // OTP code
}

export interface BusinessLoginRequest {
  email: string;
  password: string; // OTP code
  organisation: string;
}

export interface BusinessSendVerificationCodeRequest {
  email: string;
  organisation: string;
}

export interface SendVerificationCodeRequest {
  email: string;
}

export interface UserResponse extends User {}

/** Response from GET /api/v1/client/auth/account/login-options/ */
export interface LoginOptionsResponse {
  auth_method: 'local' | 'google' | 'microsoft';
  auth_url: string | null;
  state: string;
}

/** Request body for POST /api/v1/client/auth/account/exchange-code/ */
export interface ExchangeCodeRequest {
  code: string;
  state: string;
  provider: 'google' | 'microsoft';
}

export interface SignupResponse {
  message: string;
  data: User;
}

// Roles & Permissions Types
export interface RoleList {
  id: number;
  name: string;
  description: string;
  permission_count: number;
  created: string;
  updated: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permission_ids?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export interface AddPermissionsRequest {
  permission_ids: number[];
}

export interface RemovePermissionsRequest {
  permission_ids: number[];
}

export interface PaginatedRolesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: RoleList[];
}

// Employee Management Types
export interface EmployeeProfileList {
  id: number;
  account_id?: number; // Account ID (may not be present in all list responses)
  account_email: string;
  account_phone: string;
  account_name: string;
  position: string;
  department?: string;
  role_name?: string;
  date_hired?: string;
  created: string;
  updated: string;
}

// Dashboard Summary Types - Role-based
export type DashboardRoleFocus = 'super_admin' | 'hr' | 'it_support' | 'manager' | 'employee' | 'general';

// Base dashboard interface with role_focus
export interface BaseDashboardSummary {
  role_focus: DashboardRoleFocus;
}

// Super Admin Dashboard
export interface SuperAdminDashboardSummary extends BaseDashboardSummary {
  role_focus: 'super_admin';
  metrics: {
    total_employees: number;
    total_tickets: number;
    tickets_closed_30_days: number;
    knowledge_base_articles?: number;
    total_categories?: number;
    total_roles?: number;
  };
  organization_overview: {
    ticket_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    employees_by_department: Record<string, number>;
  };
  super_admin_performance: {
    on_time_closure_rate: number;
    avg_response_time: number;
    first_response_rate: number;
    new_hires_30_days: number;
  };
}

// HR Dashboard
export interface HRDashboardSummary extends BaseDashboardSummary {
  role_focus: 'hr';
  metrics: {
    total_employees: number;
    new_hires_30_days: number;
    employees_with_manager: number;
    total_tickets?: number;
    reports_available?: boolean;
    total_roles?: number;
  };
  employee_breakdown: {
    by_department: Record<string, number>;
    by_role: Record<string, number>;
  };
  hr_performance: {
    onboarding_rate: number;
    manager_coverage: number;
    recent_hires_90_days: number;
  };
}

// IT Support Dashboard
export interface ITSupportDashboardSummary extends BaseDashboardSummary {
  role_focus: 'it_support';
  metrics: {
    assigned_to_me: number;
    total_tickets: number;
    on_time_closure_rate: number;
    knowledge_base_articles?: number;
    published_articles?: number;
    total_categories?: number;
  };
  ticket_breakdown: {
    by_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    by_priority: Record<string, number>;
  };
  it_performance: {
    avg_response_time: number;
    first_response_rate: number;
    resolution_rate: number;
  };
}

// Manager Dashboard
export interface ManagerDashboardSummary extends BaseDashboardSummary {
  role_focus: 'manager';
  metrics: {
    team_size: number;
    team_tickets: number;
    total_tickets: number;
    reports_available?: boolean;
    knowledge_base_articles?: number;
    total_categories?: number;
  };
  team_breakdown: {
    team_ticket_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    all_ticket_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
  };
  manager_performance: {
    team_on_time_closure_rate: number;
    team_response_rate: number;
  };
}

// Employee Dashboard
export interface EmployeeDashboardSummary extends BaseDashboardSummary {
  role_focus: 'employee';
  metrics: {
    my_tickets: number;
    my_open_tickets: number;
    my_in_progress: number;
    knowledge_base_articles?: number;
    total_categories?: number;
  };
  my_ticket_breakdown: {
    by_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    by_priority: Record<string, number>;
  };
  employee_performance: {
    resolution_rate: number;
    closed_tickets: number;
    resolved_tickets: number;
  };
}

// General Dashboard (for custom roles)
export interface GeneralDashboardSummary extends BaseDashboardSummary {
  role_focus: 'general';
  metrics: {
    my_tickets?: number;
    total_tickets?: number;
    total_employees?: number;
    knowledge_base_articles?: number;
    total_categories?: number;
    reports_available?: boolean;
  };
  ticket_status?: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  performance_metrics: {
    sla_compliance: number;
    customer_satisfaction: number;
    first_response_rate: number;
  };
}

// Union type for all dashboard summaries
export type DashboardSummary =
  | SuperAdminDashboardSummary
  | HRDashboardSummary
  | ITSupportDashboardSummary
  | ManagerDashboardSummary
  | EmployeeDashboardSummary
  | GeneralDashboardSummary;

export interface EmployeeProfileDetail {
  id: number;
  account_id: number;
  account_email: string;
  account_phone: string;
  account_name: string;
  position: string;
  base_salary: number;
  department?: string;
  date_hired?: string;
  manager_id?: number;
  manager_name?: string;
  emergency_contact?: string;
  national_id?: string;
  organisation: number;
  role_id?: number;
  role_name?: string;
  created: string;
  updated: string;
}

export interface AccountData {
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: Gender;
}

export interface CreateEmployeeRequest {
  account?: number; // Existing account ID
  account_data?: AccountData; // Create new account
  position: string;
  base_salary: number;
  department?: string;
  date_hired?: string;
  role?: number;
  manager?: number;
  emergency_contact?: string;
  national_id?: string;
}

export interface UpdateEmployeeRequest {
  position?: string;
  base_salary?: number;
  department?: string;
  date_hired?: string;
  role?: number;
  manager?: number;
  emergency_contact?: string;
  national_id?: string;
}

export interface AssignRoleRequest {
  role_id: number;
}

export interface AssignManagerRequest {
  manager_id: number;
}

export interface PaginatedEmployeesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: EmployeeProfileList[];
}

// Project and Client Types
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface ClientNested {
  id: number;
  name: string;
  email?: string;
  company_name?: string;
  is_active: boolean;
}

export interface Client {
  id: number;
  organisation: number;
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  projects_count: number;
  created: string;
  updated: string;
}

export interface ProjectNested {
  id: number;
  name: string;
  client?: ClientNested;
  status: ProjectStatus;
  status_display: string;
}

export interface Project {
  id: number;
  organisation: number;
  client: number | ClientNested;
  name: string;
  description?: string;
  status: ProjectStatus;
  status_display: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  manager?: number;
  manager_name?: string;
  tickets_count: number;
  created: string;
  updated: string;
}

export interface ProjectList {
  id: number;
  name: string;
  client: number | ClientNested;
  client_name?: string;
  client_company?: string;
  status: ProjectStatus;
  status_display: string;
  manager?: number;
  manager_name?: string;
  start_date?: string;
  end_date?: string;
  tickets_count: number;
  created: string;
}

export interface PaginatedProjectsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: ProjectList[];
}

export interface PaginatedClientsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: Client[];
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CreateProjectRequest {
  client: number;
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: string;
  manager?: number;
}

export interface UpdateProjectRequest {
  client?: number;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: string;
  manager?: number;
}

export interface Deliverable {
  id: number;
  project: number;
  name: string;
  description?: string;
  order: number;
  due_date?: string | null;
  created: string;
  updated?: string;
}

export interface PaginatedDeliverablesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: Deliverable[];
}

export interface CreateDeliverableRequest {
  project: number;
  name: string;
  description?: string;
  order?: number;
  due_date?: string;
}

export interface UpdateDeliverableRequest {
  project?: number;
  name?: string;
  description?: string;
  order?: number;
  due_date?: string | null;
}

// Ticket Types
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Category {
  id: number;
  organisation?: number;
  name: string;
  parent?: number | null;
  parent_name?: string | null;
  subcategories_count?: number;
  created?: string;
  updated?: string;
}

export interface CategoryNested {
  id: number;
  name: string;
  parent?: number;
  parent_name?: string;
  organisation: number;
}

export interface AccountNested {
  id: number;
  email?: string | null;
  phone_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  account_type: string;
}

// Ticket List (minimal data for list views)
export interface TicketList {
  id: number;
  ticket_number: string; // Auto-generated: ABBREV-0000001 format
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: number;
  created_by_name: string;
  created_by_email: string;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  category?: number | null;
  category_name?: string | null;
  project?: number | null;
  project_name?: string | null;
  recurring_template?: number | null; // ID of recurring template (if generated from template)
  occurrence_date?: string | null; // Date (YYYY-MM-DD) for recurring tickets
  comments_count: number;
  attachments_count: number;
  closed_at?: string | null;
  expected_completion_at?: string | null; // ISO datetime when ticket should be completed (null if closed)
  is_overdue?: boolean; // True if ticket is past expected completion time
  time_remaining_seconds?: number | null; // Seconds remaining until deadline (negative if overdue, null if closed)
  created: string;
  updated: string;
}

// Assigned User (nested object in ticket)
export interface AssignedUser {
  id: number;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  account_type: AccountType;
}

// Ticket Detail (full ticket data)
export interface Ticket {
  id: number;
  ticket_number: string; // Auto-generated: ABBREV-0000001 format
  organisation: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: number;
  created_by_name: string;
  created_by_email?: string | null;
  assigned_to?: AssignedUser | null;
  assigned_to_name?: string | null; // For backward compatibility
  assigned_to_email?: string | null; // For backward compatibility
  category?: Category | null;
  category_name?: string | null; // For backward compatibility
  project?: ProjectNested | null;
  comments_count: number;
  attachments_count: number;
  closed_at?: string | null;
  expected_completion_at?: string | null; // ISO datetime when ticket should be completed (null if closed)
  is_overdue?: boolean; // True if ticket is past expected completion time
  time_remaining_seconds?: number | null; // Seconds remaining until deadline (negative if overdue, null if closed)
  created: string;
  updated: string;
}

export interface TicketComment {
  id: number;
  ticket: number;
  user: number;
  user_name: string;
  user_email: string;
  message: string;
  parent?: number | null;
  parent_id?: number | null;
  attachments_count: number;
  replies_count: number;
  created: string;
  updated: string;
  replies?: TicketComment[]; // For nested replies in UI
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: number;
  category_id?: number;
  project_id?: number;
  assigned_to?: number;
  assigned_to_id?: number;
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category_id?: number | null; // API expects category_id, not category
  project_id?: number | null; // API expects project_id, not project
  assigned_to_id?: number | null; // API expects assigned_to_id, not assigned_to
  // Legacy fields for backward compatibility (will be ignored by API)
  category?: number;
  project?: number;
  assigned_to?: number;
}

export interface AssignTicketRequest {
  assigned_to: number;
}

export interface UnassignTicketRequest {
  // Empty body
}

export interface CreateTicketCommentRequest {
  ticket: number;
  message: string;
  parent?: number | null; // For replies
  user?: number;
}

export interface UpdateTicketCommentRequest {
  message: string;
}

export interface PaginatedTicketsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: TicketList[];
}

// Recurring Ticket Templates
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrenceConfig {
  // Daily: { interval: 1 } (every N days)
  // Weekly: { days_of_week: number[], interval: 1 } (0=Monday, 6=Sunday, every N weeks)
  // Monthly: { day_of_month: number, interval: 1 } (day 1-31, every N months)
  // Yearly: { month: number, day_of_month: number } (month 1-12, day 1-31)
  // Custom: { cron: string } (cron expression)
  interval?: number;
  days_of_week?: number[];
  day_of_month?: number;
  month?: number;
  cron?: string;
  [key: string]: any;
}

export interface RecurringTicketTemplate {
  id: number;
  organisation: number;
  created_by: AccountNested;
  subject: string; // Can use {date} variable
  description: string; // Can use {date} variable
  priority: TicketPriority;
  category?: CategoryNested | null;
  category_id?: number; // Write-only
  project?: ProjectNested | null;
  project_id?: number; // Write-only
  assigned_to?: AccountNested | null;
  assigned_to_id?: number; // Write-only
  recurrence_pattern: RecurrencePattern;
  recurrence_config: RecurrenceConfig;
  start_date: string; // Date (YYYY-MM-DD)
  end_date?: string | null; // Date (YYYY-MM-DD), null = no end
  next_occurrence_date?: string | null; // Date (YYYY-MM-DD), managed by system
  max_occurrences?: number | null; // null = unlimited
  occurrences_generated: number; // Read-only
  is_active: boolean;
  ticket_instances_count: number; // Read-only
  created: string;
  updated: string;
}

export interface CreateRecurringTicketTemplateRequest {
  subject: string;
  description: string;
  priority: TicketPriority;
  category_id?: number;
  project_id?: number;
  assigned_to_id?: number;
  recurrence_pattern: RecurrencePattern;
  recurrence_config: RecurrenceConfig;
  start_date: string; // Date (YYYY-MM-DD)
  end_date?: string | null;
  max_occurrences?: number | null;
}

export interface UpdateRecurringTicketTemplateRequest {
  subject?: string;
  description?: string;
  priority?: TicketPriority;
  category_id?: number | null;
  project_id?: number | null;
  assigned_to_id?: number | null;
  recurrence_pattern?: RecurrencePattern;
  recurrence_config?: RecurrenceConfig;
  start_date?: string;
  end_date?: string | null;
  max_occurrences?: number | null;
}

export interface PaginatedRecurringTemplatesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: RecurringTicketTemplate[];
}

export interface PaginatedCategoriesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: Category[];
}

// Staff Types
export interface StaffRoleDetails {
  id: number;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission names
  created?: string;
  updated?: string;
}

export interface StaffProfile {
  id: number;
  role: number;
  role_id: number;
  role_name: string;
  role_details: StaffRoleDetails;
  permissions: string[]; // Array of permission names for this staff member
  created?: string;
  updated?: string;
}

export interface StaffUser {
  id: number;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  full_name?: string;
  username?: string;
  email?: string;
  phone_number?: string;
  is_staff: boolean;
  staff_profile?: StaffProfile;
  // Legacy fields for backward compatibility
  role_name?: string;
  role_id?: number;
  permissions?: string[]; // Array of permission names
}

export interface StaffSendVerificationCodeRequest {
  email: string;
}

export interface StaffLoginRequest {
  email: string;
  code: string;
}

export interface StaffUserResponse extends StaffUser {}

// Staff Profile and Permissions Types
export interface StaffPermission {
  id: number;
  name: string;
  description?: string;
  created?: string;
  updated?: string;
}

export interface StaffRole {
  id: number;
  name: string;
  description?: string;
  permissions?: StaffPermission[];
  permission_ids?: number[];
  created?: string;
  updated?: string;
}

// StaffProfileMember is for staff management endpoints (different from StaffProfile used in login response)
export interface StaffProfileMember {
  id: number;
  staff_user: StaffUser;
  role?: StaffRole;
  created?: string;
  updated?: string;
}

// Staff Management Types (for when API endpoints are implemented)
export interface StaffMember {
  id: number;
  staff_user: StaffUser;
  role?: StaffRole;
  permissions?: StaffPermission[];
  created?: string;
  updated?: string;
}

export interface PaginatedStaffMembersResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: StaffMember[];
}

// Staff Organization Management Types
export interface OwnerDetails {
  id: number;
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  full_name?: string;
  account_type: string;
  verification_status?: 'pending' | 'review' | 'verified' | 'suspended';
  created?: string;
}

export interface StaffOrganisation {
  id: number;
  name: string;
  subdomain: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  email_domain?: string | null;
  /** Single auth method (API). Prefer this over allowed_auth_methods. */
  auth_method?: 'local' | 'google' | 'microsoft';
  /** @deprecated Use auth_method — kept for older API responses */
  allowed_auth_methods?: string[];
  /** Module keys enabled for this org, or null/omitted for “all modules”. Staff-only. */
  enabled_modules?: string[] | null;
  address?: any | null;
  logo?: string | null;
  owner?: number | null;
  owner_details?: OwnerDetails | null;
  employee_count?: number;
  portal_ready?: boolean;
  portal_ready_at?: string | null;
  portal_welcome_sent_at?: string | null;
  portal_url?: string;
  portal_email_recipient_count?: number;
  created: string;
  updated: string;
  deleted?: string | null;
}

export interface OwnerData {
  phone_number?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: 'male' | 'female';
  country?: string;
  address_line_1?: string;
}

export interface CreateStaffOrganisationRequest {
  name: string;
  subdomain: string;
  email?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  email_domain?: string | null;
  auth_method?: 'local' | 'google' | 'microsoft';
  owner?: number; // ID of existing Account with account_type="business_owner"
  owner_data?: OwnerData; // Data to create a new owner account
  country?: string; // For organization address
  address_line_1?: string; // For organization address
  /** Optional. Module keys to enable, or null/omit for all modules (same semantics as staff PATCH). */
  enabled_modules?: string[] | null;
}

export interface UpdateStaffOrganisationRequest {
  name?: string;
  email?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  email_domain?: string | null;
  auth_method?: 'local' | 'google' | 'microsoft';
  owner?: number; // ID of existing Account with account_type="business_owner" to assign as owner (can change owner)
  /** Pass null to allow all catalog modules; omit to leave unchanged on PATCH. */
  enabled_modules?: string[] | null;
}

export interface StaffOrganisationMember {
  id: number;
  account_id: number;
  account_email?: string | null;
  account_phone?: string | null;
  account_first_name?: string | null;
  account_last_name?: string | null;
  account_name?: string;
  position?: string;
  department?: string | null;
  role_id?: number | null;
  role_name?: string | null;
  date_hired?: string | null;
  created: string;
  updated: string;
  portal_email_sent?: boolean;
  portal_email_error?: string;
}

export interface CreateStaffOrganisationMemberRequest {
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  role_id?: number | null;
  position?: string;
  department?: string;
}

export interface UpdateStaffOrganisationMemberRequest {
  email?: string;
  phone_number?: string | null;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  role_id?: number | null;
  position?: string;
  department?: string | null;
}

export interface StaffOrganisationRole {
  id: number;
  name: string;
  description?: string;
}

export interface MarkPortalReadyResponse extends StaffOrganisation {
  email_result?: {
    sent: number;
    failed: { email: string; message: string }[];
    total: number;
    portal_url: string;
  };
  already_ready?: boolean;
}

/** Staff catalog row: GET/POST/PATCH /api/v1/staff/product-modules/ */
export interface ProductModule {
  id: number;
  key: string;
  label: string;
  description?: string | null;
  monthly_price: string;
  sort_order: number;
  is_active: boolean;
  created?: string;
  updated?: string;
}

export interface CreateProductModuleRequest {
  key: string;
  label?: string;
  description?: string | null;
  monthly_price?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateProductModuleRequest {
  label?: string;
  description?: string | null;
  monthly_price?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface PaginatedProductModulesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: ProductModule[];
}

export interface PaginatedStaffOrganisationsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: StaffOrganisation[];
}

// Staff Management API Types
export interface StaffPermissionList {
  id: number;
  name: string;
  description?: string | null;
  created: string;
  updated: string;
}

export interface PaginatedStaffPermissionsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: StaffPermissionList[];
}

export interface CreateStaffPermissionRequest {
  name: string;
  description?: string;
}

export interface UpdateStaffPermissionRequest {
  name?: string;
  description?: string;
}

export interface StaffRoleList {
  id: number;
  name: string;
  description?: string | null;
  glpi_profile_name?: string | null;
  permissions_count: number;
  staff_count: number;
  created: string;
  updated: string;
}

export interface StaffRoleDetail {
  id: number;
  name: string;
  description?: string | null;
  glpi_profile_name?: string | null;
  permissions: StaffPermissionList[];
  permission_ids: number[];
  staff_count: number;
  created: string;
  updated: string;
}

export interface PaginatedStaffRolesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: StaffRoleList[];
}

export interface CreateStaffRoleRequest {
  name: string;
  description?: string;
  glpi_profile_name?: string | null;
  permission_ids?: number[];
}

export interface UpdateStaffRoleRequest {
  name?: string;
  description?: string;
  glpi_profile_name?: string | null;
  permission_ids?: number[];
}

export interface AssignPermissionsRequest {
  permission_ids: number[];
}

export interface RemovePermissionsRequest {
  permission_ids: number[];
}

export interface StaffProfileList {
  id: number;
  staff_user: {
    id: number;
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string | null;
    full_name: string;
    account_type: string;
    is_staff: boolean;
    is_active: boolean;
    verification_status: string;
  };
  role_name?: string | null;
  role_id?: number | null;
  permissions_count: number;
  glpi_user_id?: number | null;
  glpi_username?: string | null;
  glpi_provisioned_at?: string | null;
  created: string;
  updated: string;
}

export interface StaffProfileDetail {
  id: number;
  staff_user: {
    id: number;
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string | null;
    full_name: string;
    account_type: string;
    is_staff: boolean;
    is_active: boolean;
    verification_status: string;
  };
  staff_user_id: number;
  role: StaffRoleDetail | null;
  role_id: number | null;
  permissions: string[];
  glpi_user_id?: number | null;
  glpi_username?: string | null;
  glpi_provisioned_at?: string | null;
  created: string;
  updated: string;
}

export interface CreateStaffWithGlpiRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role_id?: number | null;
  password?: string;
  provision_glpi?: boolean;
  glpi_profile_name?: string;
}

export interface GlpiProvisionResult {
  glpi_user_id: number;
  glpi_username: string;
  glpi_profile_name: string;
  created: boolean;
  password?: string | null;
  glpi_login_url?: string | null;
}

export interface CreateStaffWithGlpiResponse {
  account_id: number;
  staff_profile_id: number;
  email: string;
  snapdesk_password?: string | null;
  role?: string | null;
  glpi?: GlpiProvisionResult | null;
  profile: StaffProfileDetail;
}

export interface ProvisionGlpiRequest {
  password?: string;
  glpi_profile_name?: string;
}

export interface ProvisionGlpiResponse extends GlpiProvisionResult {
  profile: StaffProfileDetail;
}

export interface PaginatedStaffProfilesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: StaffProfileList[];
}

export interface CreateStaffProfileRequest {
  staff_user_id: number;
  role_id?: number;
}

export interface UpdateStaffProfileRequest {
  role_id?: number;
}

export interface AssignRoleRequest {
  role_id: number;
}

// Analytics API Types
export interface PlatformOverview {
  totals: {
    organisations: number;
    staff: number;
    users: number;
    tickets: number;
    employees: number;
  };
  recent_activity_30_days: {
    new_organisations: number;
    new_users: number;
    new_tickets: number;
    new_employees: number;
  };
  ticket_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  organisations_by_plan: Array<{
    plan: string;
    count: number;
  }>;
  portal_status?: {
    ready: number;
    not_ready: number;
  };
}

export interface OrganisationAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_plan: Array<{
    plan: string;
    count: number;
  }>;
  top_by_tickets: Array<{
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    ticket_count: number;
  }>;
}

export interface TicketAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  by_priority: Array<{
    priority: string;
    count: number;
  }>;
  by_organisation: Array<{
    organisation__name: string;
    organisation__id: number;
    count: number;
  }>;
  average_resolution_time_hours: number;
}

export interface UserAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_account_type: Array<{
    account_type: string;
    count: number;
  }>;
  by_verification_status: Array<{
    verification_status: string;
    count: number;
  }>;
}

export interface PlatformGrowth {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  daily_growth: Array<{
    date: string;
    organisations: number;
    users: number;
    tickets: number;
    employees: number;
  }>;
}

// Platform Settings API Types
export interface PlatformSettings {
  platform_name: string | null;
  platform_email: string | null;
  platform_phone: string | null;
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  max_organisations_per_user: number | null;
  max_users_per_organisation: number | null;
  max_tickets_per_organisation: number | null;
  email_from_address: string | null;
  email_from_name: string | null;
  sms_provider: string | null;
  sms_sender_id: string | null;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
  custom_settings: Record<string, any> | null;
}

export interface FeatureFlags {
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
}

export interface UpdatePlatformSettingsRequest {
  platform_name?: string;
  platform_email?: string;
  platform_phone?: string;
  enable_registration?: boolean;
  enable_email_verification?: boolean;
  enable_sms_verification?: boolean;
  max_organisations_per_user?: number | null;
  max_users_per_organisation?: number | null;
  max_tickets_per_organisation?: number | null;
  email_from_address?: string;
  email_from_name?: string;
  sms_provider?: string;
  sms_sender_id?: string;
  enable_email_notifications?: boolean;
  enable_sms_notifications?: boolean;
  enable_push_notifications?: boolean;
  custom_settings?: Record<string, any>;
}

export interface ToggleFeatureRequest {
  feature: 'enable_registration' | 'enable_email_verification' | 'enable_sms_verification' | 'enable_email_notifications' | 'enable_sms_notifications' | 'enable_push_notifications';
  enabled: boolean;
}

export interface ToggleFeatureResponse {
  message: string;
  feature: string;
  enabled: boolean;
}

export interface UpdateSettingsResponse {
  message: string;
  settings: Partial<PlatformSettings>;
}

// Knowledge Base Types
export type ArticleVisibility = 'internal' | 'public';

export interface KnowledgebaseArticle {
  id: number;
  organisation: number;
  title: string;
  content: string; // HTML or Markdown
  visibility: ArticleVisibility;
  author: AssignedUser;
  category?: Category | null;
  version: number;
  created: string;
  updated: string;
}

export interface KnowledgebaseArticleList {
  id: number;
  title: string;
  content?: string; // May include content for preview (optional, check API response)
  visibility: ArticleVisibility;
  author: AssignedUser;
  category?: Category | null;
  version: number;
  created: string;
  updated: string;
}

export interface PaginatedArticlesResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: KnowledgebaseArticleList[];
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  visibility?: ArticleVisibility;
  category_id?: number;
  author_id?: number;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  visibility?: ArticleVisibility;
  category_id?: number;
}

// -------------------------------------------------------------
// Ticket Attachments Types
// -------------------------------------------------------------

export interface Attachment {
  id: number;
  comment: number;                 // Comment ID this attachment belongs to
  file?: string | null;            // File URL (returned by API)
  uploaded_by?: number | null;     // Account ID of uploader (optional)
  uploaded_by_name?: string;       // Read-only name from API
  uploaded_by_email?: string;      // Read-only email from API
  created: string;                 // ISO datetime
  updated: string;                 // ISO datetime
}

export interface PaginatedAttachmentsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: Attachment[];
}

/**
 * Used for validating UI values before creating a FormData payload.
 * (The API itself uses multipart/form-data, not JSON.)
 */
export interface CreateAttachmentRequest {
  comment: number;         // Required comment ID
  file: File;              // The uploaded file
  uploaded_by?: number;    // Optional account ID
}

/**
 * Used for validating UI values before creating a FormData payload.
 */
export interface UpdateAttachmentRequest {
  comment?: number;
  file?: File;
  uploaded_by?: number;
}

// Attendance Types
export interface EmployeeProfileNested {
  id: number;
  account: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
  };
  position?: string;
  department?: string;
}

export interface AttendanceRecord {
  id: number;
  employee: EmployeeProfileNested;
  organisation: number;
  date: string; // Date (YYYY-MM-DD)
  clock_in_time?: string; // ISO datetime
  clock_out_time?: string; // ISO datetime
  clock_in_location?: string;
  clock_out_location?: string;
  clock_in_latitude?: number;
  clock_in_longitude?: number;
  clock_out_latitude?: number;
  clock_out_longitude?: number;
  notes?: string;
  clock_in_ip_address?: string;
  clock_out_ip_address?: string;
  clock_in_device_info?: string;
  clock_out_device_info?: string;
  hours_worked?: number; // Calculated from clock_in_time and clock_out_time
  is_clocked_in: boolean; // true if clocked in but not out
  is_present: boolean; // true if has clock_in_time
  created: string;
  updated: string;
}

export interface AttendanceRecordList {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  date: string; // Date (YYYY-MM-DD)
  clock_in_time?: string; // ISO datetime
  clock_out_time?: string; // ISO datetime
  clock_in_location?: string;
  clock_out_location?: string;
  hours_worked?: number;
  is_clocked_in: boolean;
  is_present: boolean;
  created: string;
}

// Attendance Summary Types
export interface AttendanceDateRange {
  from: string;
  to: string;
  days: number;
}

export interface PunctualEmployee {
  employee_id: number;
  name: string;
  email: string;
  punctuality_score: number;
  on_time_count?: number;
  total_count?: number;
}

// Organization-wide summary (for users with view_attendance permission)
export interface OrganizationAttendanceSummary {
  total_records: number;
  total_employees: number;
  date_range: AttendanceDateRange;
  average_hours_per_day: number;
  total_hours_worked: number;
  attendance_rate: number;
  on_time_percentage: number;
  most_punctual_employees: PunctualEmployee[];
  least_punctual_employees: PunctualEmployee[];
}

// Personal summary (for users without view_attendance permission)
export interface PersonalAttendanceSummary {
  total_records: number;
  date_range: AttendanceDateRange;
  personal_attendance_rate: number;
  personal_average_hours: number;
  personal_total_hours: number;
  personal_on_time_percentage: number;
  days_worked: number;
  days_missed: number;
  on_time_count: number;
  late_count: number;
}

export type AttendanceSummary = OrganizationAttendanceSummary | PersonalAttendanceSummary;

export interface PaginatedAttendanceResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: AttendanceRecordList[];
  summary: AttendanceSummary;
}

export interface ClockStatus {
  is_clocked_in: boolean;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  record_id?: number;
  hours_worked?: number;
}

export interface ClockInOutRequest {
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  clocked_at?: string; // Optional custom timestamp (defaults to now)
  date?: string; // Optional date for clock in (defaults to today, only used for clock_in)
}

// Leave Management Types
export type LeaveType = 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'unpaid' | 'annual' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type HolidayType = 'national' | 'company' | 'regional' | 'international';

export interface LeaveRequest {
  id: number;
  employee: EmployeeProfileNested;
  organisation: number;
  leave_type: LeaveType;
  leave_type_display: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  duration_days: number;
  status: LeaveStatus;
  status_display: string;
  reason?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string; // ISO datetime
  rejection_reason?: string;
  created: string;
  updated: string;
}

export interface LeaveRequestList {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  leave_type: string;
  leave_type_display: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  status_display: string;
  reason?: string;
  approved_at?: string;
  created: string;
}

// Leave Summary Types
export interface LeaveDateRange {
  from: string;
  to: string;
  days: number;
}

export interface StatusBreakdown {
  pending: { count: number; label: string };
  approved: { count: number; label: string };
  rejected: { count: number; label: string };
  cancelled: { count: number; label: string };
}

export interface LeaveTypeBreakdown {
  [key: string]: { count: number; label: string };
}

export interface LeaveTaker {
  employee_id: number;
  name: string;
  email: string;
  total_days: number;
}

// Organization-wide summary (for users with manage_leave_requests permission)
export interface OrganizationLeaveSummary {
  total_requests: number;
  total_employees: number;
  date_range: LeaveDateRange;
  status_breakdown: StatusBreakdown;
  leave_type_breakdown: LeaveTypeBreakdown;
  total_days_requested: number;
  total_days_approved: number;
  average_days_per_request: number;
  approval_rate: number;
  most_leave_takers: LeaveTaker[];
  least_leave_takers: LeaveTaker[];
}

// Personal summary (for users without view_leave_requests permission)
export interface PersonalLeaveSummary {
  total_requests: number;
  date_range: LeaveDateRange;
  status_breakdown: StatusBreakdown;
  leave_type_breakdown: LeaveTypeBreakdown;
  personal_total_days_requested: number;
  personal_total_days_approved: number;
  personal_average_days_per_request: number;
  personal_approval_rate: number;
  personal_pending_count: number;
  personal_approved_count: number;
  personal_rejected_count: number;
  personal_cancelled_count: number;
}

export type LeaveSummary = OrganizationLeaveSummary | PersonalLeaveSummary;

export interface PaginatedLeaveResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: LeaveRequestList[];
  summary: LeaveSummary;
}

export interface CreateLeaveRequestRequest {
  leave_type: LeaveType;
  start_date: string; // ISO date
  end_date: string; // ISO date
  reason?: string;
}

export interface UpdateLeaveRequestRequest {
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

export interface RejectLeaveRequestRequest {
  rejection_reason?: string;
}

export interface Holiday {
  id: number;
  organisation: number;
  name: string;
  date: string; // ISO date
  holiday_type: HolidayType;
  holiday_type_display: string;
  country_code?: string | null; // ISO 3166-1 alpha-2 for national holidays
  description?: string;
  is_recurring: boolean;
  created_by?: number;
  created_by_name?: string;
  created: string;
  updated: string;
}

/** Request for POST .../leave/holidays/generate/ */
export interface GenerateHolidaysRequest {
  year?: number;
  years_ahead?: number;
  delete_existing_national?: boolean;
}

/** Response from POST .../leave/holidays/generate/ */
export interface GenerateHolidaysResponse {
  success: boolean;
  message: string;
  created: number;
  deleted: number;
}

export interface CreateHolidayRequest {
  name: string;
  date: string; // ISO date
  holiday_type: HolidayType;
  description?: string;
  is_recurring?: boolean;
}

export interface UpdateHolidayRequest {
  name?: string;
  date?: string;
  holiday_type?: HolidayType;
  description?: string;
  is_recurring?: boolean;
}

export interface PaginatedHolidaysResponse {
  links: { next: string | null; previous: string | null };
  count: number;
  total_pages: number;
  data: Holiday[];
}

// Calendar Event for Leave Management (holidays + leaves)
export interface CalendarEvent {
  id: string; // 'holiday_{id}' or 'leave_{id}'
  title: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  type: 'holiday' | 'leave';
  color: string; // Color for calendar display
  employee_id?: number;
  employee_name?: string;
  leave_type?: string;
  description?: string; // For holidays
  holiday_type?: string; // For holidays
}

// Attendance Calendar Event (holidays + attendance + timesheets + leaves)
export interface AttendanceCalendarEvent {
  id: string; // '{type}_{id}' format: 'holiday_1', 'attendance_5', 'timesheet_10', 'leave_1'
  title: string;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string; // ISO date (YYYY-MM-DD)
  type: 'holiday' | 'attendance' | 'timesheet' | 'leave';
  color: string; // Hex color code for calendar display
  
  // Holiday fields (when type === 'holiday')
  description?: string;
  holiday_type?: string;
  
  // Attendance fields (when type === 'attendance')
  clock_in_time?: string | null; // ISO timestamp
  clock_out_time?: string | null; // ISO timestamp
  hours_worked?: number | null;
  is_complete?: boolean;
  
  // Timesheet fields (when type === 'timesheet')
  hours_spent?: number;
  task_description?: string;
  ticket_number?: string | null;
  project_name?: string | null;
  is_auto_created?: boolean;
  
  // Leave fields (when type === 'leave')
  employee_id?: number;
  employee_name?: string;
  leave_type?: string;
}

// Timesheet Types
export interface TicketNested {
  id: number;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
}

export interface Timesheet {
  id: number;
  employee: EmployeeProfileNested;
  organisation: number;
  ticket?: TicketNested | null;
  project?: ProjectNested | null;
  task_description: string;
  hours_spent: number;
  date_worked: string; // Date (YYYY-MM-DD)
  is_auto_created: boolean;
  notes?: string;
  created: string;
  updated: string;
}

export interface TimesheetList {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  ticket?: number | null;
  ticket_number?: string | null;
  ticket_subject?: string | null;
  project?: number | null;
  project_name?: string | null;
  task_description: string;
  hours_spent: number;
  date_worked: string;
  is_auto_created: boolean;
  created: string;
}

export interface CreateTimesheetRequest {
  ticket_id?: number;
  project_id?: number;
  deliverable_id?: number; // Required when project_id is set
  task_description: string;
  hours_spent: number;
  date_worked: string; // Date (YYYY-MM-DD)
  notes?: string;
}

export interface UpdateTimesheetRequest {
  task_description?: string;
  hours_spent?: number;
  date_worked?: string; // Date (YYYY-MM-DD)
  deliverable_id?: number | null; // Required when project is set
  notes?: string;
}

// Timesheet Summary Types
export interface TimesheetDateRange {
  from: string;
  to: string;
  days: number;
}

export interface ProjectBreakdownItem {
  project_id: number | null;
  project_name: string;
  count: number;
  total_hours: number;
}

export interface EmployeeBreakdownItem {
  employee_id: number;
  email: string;
  count: number;
  total_hours: number;
}

export interface TopContributor {
  employee_id: number;
  email: string;
  count: number;
  total_hours: number;
}

// Organization-wide summary (for Super Admin/HR)
export interface OrganizationTimesheetSummary {
  total_timesheets: number;
  total_employees: number;
  total_hours: number;
  average_hours_per_timesheet: number;
  date_range: TimesheetDateRange;
  project_breakdown: Record<string, ProjectBreakdownItem>;
  employee_breakdown: Record<string, EmployeeBreakdownItem>;
  top_contributors: TopContributor[];
}

// Manager summary (own + managed projects)
export interface ManagerTimesheetSummary {
  total_timesheets: number;
  own_timesheets: number;
  managed_project_timesheets: number;
  total_hours: number;
  own_total_hours: number;
  managed_project_total_hours: number;
  average_hours_per_timesheet: number;
  date_range: TimesheetDateRange;
  project_breakdown: Record<string, ProjectBreakdownItem>;
}

// Personal summary (for employees)
export interface PersonalTimesheetSummary {
  total_timesheets: number;
  total_hours: number;
  average_hours_per_timesheet: number;
  date_range: TimesheetDateRange;
  project_breakdown: Record<string, ProjectBreakdownItem>;
}

export type TimesheetSummary = OrganizationTimesheetSummary | ManagerTimesheetSummary | PersonalTimesheetSummary;

export interface PaginatedTimesheetsResponse {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  data: TimesheetList[];
  summary: TimesheetSummary;
}

/** Bulk upload result (members or clients/projects/deliverables/phases) */
export interface BulkUploadResult {
  created?: number;
  updated?: number;
  errors?: Array<{ row?: number; message: string }>;
}

/** Single member item for bulk create (matches API). Use role_name and manager_email (not role_id/manager_id). */
export interface BulkMemberItem {
  account_data: {
    phone_number: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    gender?: string;
  };
  position: string;
  base_salary?: string;
  department?: string;
  date_hired?: string;
  role_name?: string;
  manager_email?: string;
  emergency_contact?: string;
  national_id?: string;
  created?: string;
  updated?: string;
}

export interface BulkMembersRequest {
  members: BulkMemberItem[];
}

export interface BulkMembersResponse {
  created_count: number;
  failed_count: number;
  created: Array<{ index: number; id: number; account_id: number }>;
  errors: Array<{ index: number; error: string | Record<string, unknown> }>;
}

/** Nested types for bulk clients upload */
export interface BulkDeliverableItem {
  name: string;
  description?: string;
  order?: number;
  due_date?: string;
}

export interface BulkPhaseItem {
  name: string;
  description?: string;
  order?: number;
  start_date?: string;
  end_date?: string;
}

export interface BulkProjectItem {
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  manager_id?: number;
  deliverables?: BulkDeliverableItem[];
  phases?: BulkPhaseItem[];
}

export interface BulkClientItem {
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
  created?: string;
  updated?: string;
}

export interface BulkClientsRequest {
  clients: BulkClientItem[];
}

export interface BulkClientsResponse {
  clients_created: number;
  created_clients: Array<{ index: number; id: number; name: string }>;
  errors: Array<{ index?: number; error: string }>;
}

/** Single project item for bulk projects upload (requires client_name; must match an existing client) */
export interface BulkProjectUploadItem {
  client_name: string;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  manager_email?: string;
  deliverables?: BulkDeliverableItem[];
  phases?: BulkPhaseItem[];
  created?: string;
  updated?: string;
}

export interface BulkProjectsRequest {
  projects: BulkProjectUploadItem[];
}

export interface BulkProjectsResponse {
  projects_created: number;
  deliverables_created: number;
  phases_created: number;
  created_projects: Array<{ project_index: number; id: number; name: string; client_id: number; client_name?: string }>;
  created_deliverables: Array<{ project_id: number; id: number }>;
  created_phases: Array<{ project_id: number; id: number }>;
  errors: Array<{ project_index?: number; error: string }>;
}

/** Single deliverable item for bulk upload (client_name + project_name identify the project). */
export interface BulkDeliverableUploadItem {
  client_name: string;
  project_name: string;
  name: string;
  description?: string;
  order?: number;
  due_date?: string;
  created?: string;
  updated?: string;
}

export interface BulkDeliverablesRequest {
  deliverables: BulkDeliverableUploadItem[];
}

export interface BulkDeliverablesResponse {
  deliverables_created: number;
  created_deliverables: Array<{
    deliverable_index: number;
    id: number;
    project_id: number;
    name: string;
  }>;
  errors: Array<{ deliverable_index?: number; error: string }>;
}

/** CSV template for bulk uploads. Template types: members, clients, projects, deliverables. */
export interface CsvTemplate {
  id: number;
  organisation: number;
  name: string;
  template_type: 'members' | 'clients' | 'projects' | 'deliverables';
  template_type_display?: string;
  description?: string;
  column_mapping: Record<string, string>;
  delimiter: string;
  encoding: string;
  has_header_row: boolean;
  is_default: boolean;
  created: string;
  updated?: string;
}

export interface PaginatedCsvTemplatesResponse {
  links: { next: string | null; previous: string | null };
  count: number;
  total_pages: number;
  data: CsvTemplate[];
}

export interface CreateCsvTemplateRequest {
  name: string;
  template_type: 'members' | 'clients' | 'projects' | 'deliverables';
  description?: string;
  column_mapping?: Record<string, string>;
  delimiter?: string;
  encoding?: string;
  has_header_row?: boolean;
  is_default?: boolean;
}

export interface UpdateCsvTemplateRequest {
  name?: string;
  template_type?: 'members' | 'clients' | 'projects' | 'deliverables';
  description?: string;
  column_mapping?: Record<string, string>;
  delimiter?: string;
  encoding?: string;
  has_header_row?: boolean;
  is_default?: boolean;
}
