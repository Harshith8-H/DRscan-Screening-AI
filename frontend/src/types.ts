export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'DOCTOR' | 'OPERATOR' | 'ADMIN';
  medical_council_id?: string;
  phc_center?: string;
}

export interface Patient {
  id: number;
  patient_code: string;
  name: string;
  age: number;
  sex: string;
  diabetes_duration_years?: number;
  phone?: string;
  village_or_phc?: string;
  blood_sugar_fasting?: number;
  hba1c?: number;
  notes?: string;
  created_at: string;
  screenings_count?: number;
}

export interface QualityMetrics {
  score: number;
  status: 'good' | 'adequate' | 'poor';
  sharpness: number;
  illumination: number;
  is_acceptable: boolean;
  issues: string[];
}

export interface LesionsInfo {
  microaneurysms: number;
  hemorrhages: number;
  exudates: number;
  cotton_wool_spots: number;
  foveal_involvement: boolean;
}

export interface SalientRegion {
  label: string;
  box: number[];
  confidence: number;
}

export interface ExplainabilityInfo {
  gradcam_available: boolean;
  heatmap_url?: string;
  preprocessed_url?: string;
  annotated_url?: string;
  salient_regions: SalientRegion[];
}

export interface PredictionInfo {
  dr_level: number; // 0 to 4
  label: string;
  confidence: number;
  referable: boolean;
  class_probabilities: Record<string, number>;
}

export interface RecommendationInfo {
  action: string;
  urgency: string;
  reason: string;
  clinical_guideline?: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  architecture: string;
  dataset: string;
  input_size: string;
}

export interface InferenceResponse {
  success: boolean;
  inference_time_ms: number;
  model: ModelInfo;
  prediction: PredictionInfo;
  quality: QualityMetrics;
  lesions: LesionsInfo;
  explainability: ExplainabilityInfo;
  recommendation: RecommendationInfo;
}

export interface Screening {
  id: number;
  screening_id: string;
  patient_id: number;
  patient_name?: string;
  patient_code?: string;
  eye_side: string;
  original_image_url: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVIEW_REQUIRED';
  image_quality_score?: number;
  image_quality_status?: string;
  is_acceptable_quality: boolean;
  model_name?: string;
  model_version?: string;
  dr_level?: number;
  dr_label?: string;
  confidence?: number;
  referable?: boolean;
  review_decision?: string;
  is_offline_queued: boolean;
  created_at: string;
}

export interface DoctorReviewDetail {
  id: number;
  doctor_name: string;
  decision: string;
  final_dr_level?: number;
  clinical_notes?: string;
  referral_facility?: string;
  reviewed_at: string;
}

export interface ScreeningDetail {
  screening: Screening;
  patient: Patient;
  inference?: InferenceResponse;
  doctor_review?: DoctorReviewDetail;
}

export interface SampleFundus {
  id: string;
  name: string;
  filename: string;
  description: string;
  expected_grade: number;
}

export interface LongitudinalEntry {
  screening_id: string;
  date: string;
  eye_side: string;
  dr_level?: number;
  label?: string;
  confidence?: number;
  referable?: boolean;
  image_url: string;
  gradcam_url?: string;
  doctor_decision?: string;
}

export interface PatientHistory {
  patient: Patient;
  screenings: LongitudinalEntry[];
  progression_alert?: string;
  risk_trend?: string;
}

export interface SimulationParams {
  patients_per_day: number;
  images_per_patient: number;
  camera_count: number;
  image_capture_time_min: number;
  bandwidth_mbps: number;
  network_latency_ms: number;
  ai_inference_time_sec: number;
  doctor_count: number;
  doctor_review_time_min: number;
  referral_rate_pct: number;
  work_shift_hours: number;
}

export interface HourlyQueuePoint {
  hour: number;
  arrivals: number;
  screened: number;
  transmitted: number;
  reviewed: number;
  queue_cameras: number;
  queue_telecom: number;
  queue_doctors: number;
}

export interface SimulationResult {
  total_requested: number;
  total_screened: number;
  screening_completion_rate_pct: number;
  total_referrals_generated: number;
  total_doctor_reviews_completed: number;
  doctor_review_backlog: number;
  average_patient_turnaround_time_min: number;
  camera_utilization_pct: number;
  network_uplink_utilization_pct: number;
  doctor_utilization_pct: number;
  primary_bottleneck: string;
  bottleneck_severity: string;
  recommendations: string[];
  hourly_breakdown: HourlyQueuePoint[];
}

export interface DashboardStats {
  total_screenings: number;
  referable_cases: number;
  pending_doctor_reviews: number;
  poor_quality_images: number;
  completed_screenings: number;
  grade_distribution: Record<string, number>;
  referral_rate_pct: number;
}
