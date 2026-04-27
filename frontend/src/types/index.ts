/**
 * TypeScript interfaces for MediID entities.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin' | 'lab';
  unique_health_id: string | null;
  qr_code_url: string | null;
  qr_code_full_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  tokens: AuthTokens;
  user: User;
}

export interface FamilyProfile {
  id: string;
  member_name: string;
  date_of_birth: string | null;
  relation: string;
  unique_health_id: string;
  qr_code_url: string | null;
  qr_code_full_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DoctorProfile {
  id: string;
  user: string;
  user_details?: User;
  hospital_name: string;
  specialization: string;
  license_number: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  patient_type: 'user' | 'family';
  doctor: string | null;
  doctor_details?: DoctorProfile;
  diagnosis: string;
  prescription: string;
  notes: string;
  report_file_key: string | null;
  file_url: string | null;
  record_date: string;
  created_at: string;
}

export interface EmergencyData {
  id: string;
  patient_id: string;
  patient_type: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  is_emergency_mode_enabled: boolean;
  token_expires_at: string | null;
  updated_at: string;
}

export interface PublicEmergencyData {
  patient_id: string;
  patient_name: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
}

export interface AccessLog {
  id: number;
  actor: string | null;
  actor_name: string;
  actor_role: string | null;
  patient_id: string | null;
  patient_type: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface LabProfile {
  id: string;
  user: string;
  user_details?: User;
  lab_name: string;
  department: string;
  license_number: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface LabTest {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_type: 'user' | 'family';
  doctor: string | null;
  doctor_details?: DoctorProfile;
  lab_technician: string | null;
  lab_technician_details?: LabProfile;
  test_name: string;
  test_description: string;
  result: string | null;
  result_file_key: string | null;
  result_file_url: string | null;
  status: 'pending' | 'completed' | 'verified' | 'rejected';
  doctor_remarks: string | null;
  prescribed_at: string;
  completed_at: string | null;
  verified_at: string | null;
}

export interface LabSearchResponse {
  patient: User;
  doctor: DoctorProfile;
  tests: LabTest[];
}

