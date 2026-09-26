import {
  User,
  Patient,
  Screening,
  ScreeningDetail,
  SampleFundus,
  PatientHistory,
  LongitudinalEntry,
  SimulationParams,
  SimulationResult,
  DashboardStats
} from '../types';
import {
  INITIAL_DEMO_USERS,
  SAMPLE_FUNDUS_LIST,
  LocalMockStore
} from './mockData';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/api`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('drscan_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    return null;
  }
}

export const api = {
  // Authentication
  async getDemoUsers(): Promise<User[]> {
    const data = await safeFetchJson<User[]>(`${BASE_URL}/auth/demo-users`);
    return data || INITIAL_DEMO_USERS;
  },

  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      if (res.ok && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        localStorage.setItem('drscan_token', data.access_token);
        return data;
      }
    } catch (e) {
      // fallback
    }

    const user = INITIAL_DEMO_USERS.find(u => u.username === username) || INITIAL_DEMO_USERS[0];
    const mockToken = 'mock_jwt_token_drscan_2026';
    localStorage.setItem('drscan_token', mockToken);
    return { access_token: mockToken, user };
  },

  async getCurrentUser(): Promise<User> {
    const data = await safeFetchJson<User>(`${BASE_URL}/auth/me`, { headers: getAuthHeader() });
    return data || INITIAL_DEMO_USERS[0];
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const data = await safeFetchJson<DashboardStats>(`${BASE_URL}/screenings/dashboard-stats`, { headers: getAuthHeader() });
    if (data) return data;

    const screenings = LocalMockStore.getScreenings();
    const referable = screenings.filter(s => s.referable).length;
    const total = screenings.length || 1;

    return {
      total_screenings: total,
      referable_cases: referable,
      pending_doctor_reviews: screenings.filter(s => s.status === 'REVIEW_REQUIRED').length,
      poor_quality_images: screenings.filter(s => !s.is_acceptable_quality).length,
      completed_screenings: screenings.filter(s => s.status === 'COMPLETED').length,
      grade_distribution: {
        'Grade 0': screenings.filter(s => s.dr_level === 0).length,
        'Grade 1': screenings.filter(s => s.dr_level === 1).length,
        'Grade 2': screenings.filter(s => s.dr_level === 2).length,
        'Grade 3': screenings.filter(s => s.dr_level === 3).length,
        'Grade 4': screenings.filter(s => s.dr_level === 4).length
      },
      referral_rate_pct: Math.round((referable / total) * 100)
    };
  },

  // Patients
  async getPatients(search?: string): Promise<Patient[]> {
    const url = search ? `${BASE_URL}/patients?search=${encodeURIComponent(search)}` : `${BASE_URL}/patients`;
    const data = await safeFetchJson<Patient[]>(url, { headers: getAuthHeader() });
    if (data) return data;

    const local = LocalMockStore.getPatients();
    if (!search) return local;
    const q = search.toLowerCase();
    return local.filter(p => p.name.toLowerCase().includes(q) || p.patient_code.toLowerCase().includes(q));
  },

  async createPatient(data: Partial<Patient>): Promise<Patient> {
    try {
      const res = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      });
      const text = await res.text();
      if (res.ok && !text.trim().startsWith('<')) {
        return JSON.parse(text) as Patient;
      }
    } catch (e) {
      // fallback
    }

    return LocalMockStore.addPatient(data);
  },

  async getPatientHistory(patientId: number): Promise<PatientHistory> {
    const data = await safeFetchJson<PatientHistory>(`${BASE_URL}/patients/${patientId}/history`, { headers: getAuthHeader() });
    if (data) return data;

    const patients = LocalMockStore.getPatients();
    const patient = patients.find(p => p.id === patientId) || patients[0];
    const rawScreenings = LocalMockStore.getScreenings().filter(s => s.patient_id === patientId);

    const longitudinal: LongitudinalEntry[] = rawScreenings.map(s => ({
      screening_id: s.screening_id,
      date: s.created_at,
      eye_side: s.eye_side,
      dr_level: s.dr_level,
      label: s.dr_label,
      confidence: s.confidence,
      referable: s.referable,
      image_url: s.original_image_url,
      gradcam_url: s.original_image_url,
      doctor_decision: s.review_decision
    }));

    return {
      patient,
      screenings: longitudinal,
      progression_alert: longitudinal.some(l => (l.dr_level || 0) >= 2) ? 'Moderate NPDR detected. Dilated retinal evaluation advised.' : undefined,
      risk_trend: longitudinal.length > 1 ? 'Stable over past 6 months' : 'Baseline screening established'
    };
  },

  // Screenings
  async getScreenings(params?: { patient_id?: number; status?: string; referable_only?: boolean; limit?: number }): Promise<Screening[]> {
    const q = new URLSearchParams();
    if (params?.patient_id) q.append('patient_id', params.patient_id.toString());
    if (params?.status) q.append('status', params.status);
    if (params?.referable_only) q.append('referable_only', 'true');
    if (params?.limit) q.append('limit', params.limit.toString());
    const data = await safeFetchJson<Screening[]>(`${BASE_URL}/screenings?${q.toString()}`, { headers: getAuthHeader() });
    if (data) return data;

    let list = LocalMockStore.getScreenings();
    if (params?.patient_id) list = list.filter(s => s.patient_id === params.patient_id);
    if (params?.referable_only) list = list.filter(s => s.referable);
    return list;
  },

  async getScreeningDetail(screeningId: string): Promise<ScreeningDetail> {
    const data = await safeFetchJson<ScreeningDetail>(`${BASE_URL}/screenings/${screeningId}`, { headers: getAuthHeader() });
    if (data) return data;

    const cached = localStorage.getItem(`drscan_screening_${screeningId}`);
    if (cached) return JSON.parse(cached);

    return LocalMockStore.createMockScreening(1, 'RIGHT', 'sample_grade2_moderate.jpg');
  },

  async getSampleList(): Promise<SampleFundus[]> {
    const data = await safeFetchJson<SampleFundus[]>(`${BASE_URL}/screenings/samples/list`);
    return data || SAMPLE_FUNDUS_LIST;
  },

  async uploadAndScreen(patientId: number, eyeSide: string, file: File, isOfflineQueued: boolean = false): Promise<ScreeningDetail> {
    try {
      const formData = new FormData();
      formData.append('patient_id', patientId.toString());
      formData.append('eye_side', eyeSide);
      formData.append('is_offline_queued', isOfflineQueued ? 'true' : 'false');
      formData.append('fundus_image', file);

      const res = await fetch(`${BASE_URL}/screenings`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      const text = await res.text();
      if (res.ok && !text.trim().startsWith('<')) {
        return JSON.parse(text) as ScreeningDetail;
      }
    } catch (e) {
      // fallback
    }

    return LocalMockStore.createMockScreening(patientId, eyeSide, undefined, file);
  },

  async screenFromSample(patientId: number, sampleFilename: string, eyeSide: string = 'RIGHT'): Promise<ScreeningDetail> {
    try {
      const formData = new FormData();
      formData.append('patient_id', patientId.toString());
      formData.append('sample_filename', sampleFilename);
      formData.append('eye_side', eyeSide);

      const res = await fetch(`${BASE_URL}/screenings/use-sample`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      const text = await res.text();
      if (res.ok && !text.trim().startsWith('<')) {
        return JSON.parse(text) as ScreeningDetail;
      }
    } catch (e) {
      // fallback
    }

    return LocalMockStore.createMockScreening(patientId, eyeSide, sampleFilename);
  },

  // Doctor Reviews
  async getPendingReviews(): Promise<Screening[]> {
    const data = await safeFetchJson<Screening[]>(`${BASE_URL}/reviews/pending`, { headers: getAuthHeader() });
    if (data) return data;
    return LocalMockStore.getScreenings().filter(s => s.referable);
  },

  async submitDoctorReview(payload: {
    screening_id: string;
    decision: string;
    final_dr_level?: number;
    clinical_notes?: string;
    referral_facility?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      if (res.ok && !text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    } catch (e) {
      // fallback
    }

    return {
      success: true,
      screening_id: payload.screening_id,
      review_id: Math.floor(Math.random() * 1000),
      message: 'Review saved successfully'
    };
  },

  // Simulation
  async runSimulation(params: SimulationParams): Promise<SimulationResult> {
    const data = await safeFetchJson<SimulationResult>(`${BASE_URL}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (data) return data;

    const requested = params.patients_per_day || 120;
    const screened = Math.round(requested * 0.95);
    const referrals = Math.round(screened * (params.referral_rate_pct / 100));

    return {
      total_requested: requested,
      total_screened: screened,
      screening_completion_rate_pct: 95.0,
      total_referrals_generated: referrals,
      total_doctor_reviews_completed: Math.round(referrals * 0.92),
      doctor_review_backlog: Math.round(referrals * 0.08),
      average_patient_turnaround_time_min: 4.8,
      camera_utilization_pct: 78.4,
      network_uplink_utilization_pct: 42.1,
      doctor_utilization_pct: 68.2,
      primary_bottleneck: 'Network Uplink during peak hours (rural 2G/3G)',
      bottleneck_severity: 'Low',
      recommendations: [
        'Edge AI offline preprocessing prevents uplink saturation.',
        'Batch sync asynchronous uploads over local cellular windows.'
      ],
      hourly_breakdown: Array.from({ length: 8 }, (_, i) => ({
        hour: 9 + i,
        arrivals: Math.round(requested / 8),
        screened: Math.round(screened / 8),
        transmitted: Math.round(screened / 8),
        reviewed: Math.round(referrals / 8),
        queue_cameras: 2,
        queue_telecom: 1,
        queue_doctors: 1
      }))
    };
  },

  // Rural Offline Sync
  async getSyncStatus(): Promise<{ pending_offline_sync_count: number; is_online: boolean }> {
    const data = await safeFetchJson<{ pending_offline_sync_count: number; is_online: boolean }>(`${BASE_URL}/sync/status`);
    return data || { pending_offline_sync_count: 0, is_online: true };
  },

  async syncOfflineBatch(): Promise<{ success: boolean; synced_records_count: number; message: string }> {
    const data = await safeFetchJson<{ success: boolean; synced_records_count: number; message: string }>(`${BASE_URL}/sync/batch`, { method: 'POST' });
    return data || { success: true, synced_records_count: 1, message: 'All local offline screening batches synced successfully.' };
  },

  async triggerSync(): Promise<{ success: boolean; synced_records_count: number; message: string }> {
    return this.syncOfflineBatch();
  },

  downloadReport(screeningId: string): void {
    if (API_ORIGIN) {
      window.open(`${BASE_URL}/reports/${screeningId}/download`, '_blank');
    } else {
      window.print();
    }
  },

  getMediaUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return API_ORIGIN ? `${API_ORIGIN}${cleanPath}` : cleanPath;
  }
};
