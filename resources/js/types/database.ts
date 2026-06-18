export type AppRole = 'admin' | 'intern' | 'staff';
export type InternshipStatus = 'pending' | 'active' | 'completed' | 'terminated';
export type CertificateStatus = 'pending' | 'issued' | 'revoked';
export type ApplicationStatus = 'submitted' | 'reviewing' | 'shortlisted' | 'approved' | 'rejected';
export type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'file' | 'range' | 'skills';



export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface StaffAssignment {
  id: string;
  user_id: string;
  department_id: string;
  created_at: string;
  // Joined data
  department?: Department;
  profile?: Profile;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentSkill {
  id: string;
  department_id: string;
  skill_name: string;
  skill_description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface InternSkillAssessment {
  id: string;
  intern_id: string;
  skill_id: string;
  rating: number;
  assessed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  skill?: DepartmentSkill;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Intern {
  id: string;
  user_id: string;
  department_id: string | null;
  batch_name?: string | null;
  role_title: string;
  supervisor_name: string | null;
  start_date: string;
  end_date: string | null;
  status: InternshipStatus;
  description: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  department?: Department;
  profile?: Profile;
}

export interface Certificate {
  id: string;
  intern_id: string;
  certificate_id: string;
  status: CertificateStatus;
  issued_date: string | null;
  issued_by: string | null;
  qr_code_data: string | null;
  template_type: string | null;
  delivery_status?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  intern?: Intern;
}

export interface ApplicationForm {
  id: string;
  title: string;
  form_type?: 'internship' | 'job';
  batch_name: string | null;
  description: string | null;
  slug: string;
  department_id: string | null;
  is_multi_department?: boolean;
  allowed_departments?: string[] | null;
  is_paid?: boolean;
  stipend_amount?: string | null;
  salary_range?: string | null;
  facilities?: string[] | null;
  is_active: boolean;
  deadline: string | null;
  start_date?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  department?: Department;
  fields?: FormField[];
}

export interface FormField {
  id: string;
  form_id: string;
  field_type: FormFieldType;
  label: string;
  placeholder: string | null;
  is_required: boolean;
  options: string[] | null;
  validation_rules: Record<string, unknown> | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  form_id: string;
  form_type?: 'internship' | 'job';
  department_id?: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  status: ApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  delivery_status?: string | null;
  skill_score?: number | null;
  interview_scheduled_at?: string | null;
  interview_meeting_link?: string | null;
  interview_type?: string | null;
  ai_screening?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  form?: ApplicationForm;
  department?: Department;
  responses?: ApplicationResponse[];
}

export interface ApplicationResponse {
  id: string;
  application_id: string;
  field_id: string;
  response_value: string | null;
  file_url: string | null;
  created_at: string;
  // Joined data
  field?: FormField;
}

export interface RoleTitle {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
