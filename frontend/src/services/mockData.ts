import {
  User,
  Patient,
  Screening,
  ScreeningDetail,
  SampleFundus,
  PatientHistory,
  LongitudinalEntry,
  InferenceResponse
} from '../types';

export const INITIAL_DEMO_USERS: User[] = [
  {
    id: 1,
    username: 'dr.sharma',
    email: 'sharma.opht@aiims.edu.in',
    full_name: 'Dr. Alok Sharma (MD, Retina Specialist)',
    role: 'DOCTOR',
    medical_council_id: 'MCI-88492-RETINA',
    phc_center: 'District Hospital Anantapur'
  },
  {
    id: 2,
    username: 'operator.anitha',
    email: 'anitha.asha@phc.gov.in',
    full_name: 'Anitha Reddy (ASHA / HW Officer)',
    role: 'OPERATOR',
    medical_council_id: 'HW-AP-2041',
    phc_center: 'PHC Chandragiri, Rural Chittoor'
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 1,
    patient_code: 'DR-AP-26038-001',
    name: 'Ramesh Kumar',
    age: 58,
    sex: 'Male',
    diabetes_duration_years: 12,
    phone: '+91 98480 23112',
    village_or_phc: 'PHC Chandragiri, Rural Chittoor',
    blood_sugar_fasting: 186,
    hba1c: 8.8,
    notes: 'Type 2 Diabetes for 12 years. Complaining of gradual blurred vision in right eye.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    screenings_count: 2
  },
  {
    id: 2,
    patient_code: 'DR-AP-26038-002',
    name: 'Lakshmi Devi',
    age: 62,
    sex: 'Female',
    diabetes_duration_years: 16,
    phone: '+91 94401 55678',
    village_or_phc: 'Sub-Centre Ramapuram',
    blood_sugar_fasting: 210,
    hba1c: 9.6,
    notes: 'Known hypertension and diabetic nephropathy. High risk referable candidate.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    screenings_count: 1
  },
  {
    id: 3,
    patient_code: 'DR-AP-26038-003',
    name: 'Venkat Rao',
    age: 49,
    sex: 'Male',
    diabetes_duration_years: 5,
    phone: '+91 99890 11234',
    village_or_phc: 'PHC Chandragiri',
    blood_sugar_fasting: 132,
    hba1c: 6.9,
    notes: 'Well controlled glycemic levels. Annual routine tele-screening.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    screenings_count: 1
  }
];

export const SAMPLE_FUNDUS_LIST: SampleFundus[] = [
  {
    id: 's1',
    name: 'Patient Sample #1 (No DR - Grade 0)',
    filename: 'sample_grade0_normal.jpg',
    description: 'Clean fundus, crisp optic disc, healthy foveal reflex, no microaneurysms.',
    expected_grade: 0
  },
  {
    id: 's2',
    name: 'Patient Sample #2 (Mild NPDR - Grade 1)',
    filename: 'sample_grade1_mild.jpg',
    description: 'Scattered microaneurysms in temporal arcade, good foveal clarity.',
    expected_grade: 1
  },
  {
    id: 's3',
    name: 'Patient Sample #3 (Moderate NPDR - Grade 2)',
    filename: 'sample_grade2_moderate.jpg',
    description: 'Multiple blot hemorrhages and hard exudates in macular region. Referable.',
    expected_grade: 2
  },
  {
    id: 's4',
    name: 'Patient Sample #4 (Severe NPDR - Grade 3)',
    filename: 'sample_grade3_severe.jpg',
    description: 'Extensive 4-quadrant hemorrhages, venous beading, IRMA. Urgent referral.',
    expected_grade: 3
  },
  {
    id: 's5',
    name: 'Patient Sample #5 (Proliferative DR - Grade 4)',
    filename: 'sample_grade4_pdr.jpg',
    description: 'Neovascularization of disc (NVD), vitreous hemorrhage risk. Emergency laser required.',
    expected_grade: 4
  },
  {
    id: 's6',
    name: 'Patient Sample #6 (Poor Quality / Defocus)',
    filename: 'sample_poor_quality.jpg',
    description: 'Severe camera motion blur and illumination artifact. Triage recommends recapture.',
    expected_grade: 0
  }
];

export class LocalMockStore {
  static getPatients(): Patient[] {
    const raw = localStorage.getItem('drscan_mock_patients');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem('drscan_mock_patients', JSON.stringify(INITIAL_PATIENTS));
    return INITIAL_PATIENTS;
  }

  static addPatient(data: Partial<Patient>): Patient {
    const patients = this.getPatients();
    const newId = patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1;
    const newPatient: Patient = {
      id: newId,
      patient_code: `DR-AP-26038-${String(newId).padStart(3, '0')}`,
      name: data.name || 'Anonymous Patient',
      age: Number(data.age) || 45,
      sex: data.sex || 'Male',
      diabetes_duration_years: Number(data.diabetes_duration_years) || 0,
      phone: data.phone || '',
      village_or_phc: data.village_or_phc || 'PHC Chandragiri',
      blood_sugar_fasting: Number(data.blood_sugar_fasting) || 140,
      hba1c: Number(data.hba1c) || 7.0,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
      screenings_count: 0
    };
    patients.unshift(newPatient);
    localStorage.setItem('drscan_mock_patients', JSON.stringify(patients));
    return newPatient;
  }

  static getScreenings(): Screening[] {
    const raw = localStorage.getItem('drscan_mock_screenings');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
    const defaults: Screening[] = [
      {
        id: 1,
        screening_id: 'SCR-2026-00101',
        patient_id: 1,
        patient_name: 'Ramesh Kumar',
        patient_code: 'DR-AP-26038-001',
        eye_side: 'RIGHT',
        original_image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
        status: 'COMPLETED',
        dr_level: 2,
        dr_label: 'Moderate NPDR (Grade 2)',
        confidence: 0.892,
        referable: true,
        image_quality_score: 0.88,
        image_quality_status: 'good',
        is_acceptable_quality: true,
        model_name: 'EfficientNet-B0 (MATLAB / APTOS 2019)',
        is_offline_queued: false,
        created_at: new Date(Date.now() - 3600000 * 20).toISOString()
      },
      {
        id: 2,
        screening_id: 'SCR-2026-00102',
        patient_id: 2,
        patient_name: 'Lakshmi Devi',
        patient_code: 'DR-AP-26038-002',
        eye_side: 'LEFT',
        original_image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
        status: 'REVIEW_REQUIRED',
        dr_level: 3,
        dr_label: 'Severe NPDR (Grade 3)',
        confidence: 0.941,
        referable: true,
        image_quality_score: 0.91,
        image_quality_status: 'good',
        is_acceptable_quality: true,
        model_name: 'EfficientNet-B0 (MATLAB / APTOS 2019)',
        is_offline_queued: false,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ];
    localStorage.setItem('drscan_mock_screenings', JSON.stringify(defaults));
    return defaults;
  }

  static createMockScreening(patientId: number, eyeSide: string, sampleFilename?: string, file?: File): ScreeningDetail {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId) || patients[0];
    const sId = `SCR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let drLevel = 2;
    let drLabel = 'Moderate NPDR (Grade 2)';
    let confidence = 0.89;
    let referable = true;

    if (sampleFilename) {
      if (sampleFilename.includes('grade0')) {
        drLevel = 0; drLabel = 'No DR (Grade 0)'; confidence = 0.96; referable = false;
      } else if (sampleFilename.includes('grade1')) {
        drLevel = 1; drLabel = 'Mild NPDR (Grade 1)'; confidence = 0.86; referable = false;
      } else if (sampleFilename.includes('grade2')) {
        drLevel = 2; drLabel = 'Moderate NPDR (Grade 2)'; confidence = 0.91; referable = true;
      } else if (sampleFilename.includes('grade3')) {
        drLevel = 3; drLabel = 'Severe NPDR (Grade 3)'; confidence = 0.94; referable = true;
      } else if (sampleFilename.includes('grade4')) {
        drLevel = 4; drLabel = 'Proliferative DR (Grade 4)'; confidence = 0.97; referable = true;
      }
    }

    const defaultImg = file
      ? URL.createObjectURL(file)
      : 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80';

    const inference: InferenceResponse = {
      success: true,
      inference_time_ms: 128.4,
      model: {
        name: 'EfficientNet-B0',
        version: 'MATLAB-2026',
        architecture: 'EfficientNet-B0',
        dataset: 'APTOS 2019',
        input_size: '224x224x3'
      },
      prediction: {
        dr_level: drLevel,
        label: drLabel,
        confidence: confidence,
        referable: referable,
        class_probabilities: {
          grade_0: drLevel === 0 ? 0.96 : 0.02,
          grade_1: drLevel === 1 ? 0.86 : 0.04,
          grade_2: drLevel === 2 ? 0.91 : 0.05,
          grade_3: drLevel === 3 ? 0.94 : 0.03,
          grade_4: drLevel === 4 ? 0.97 : 0.01
        }
      },
      quality: {
        score: 0.92,
        status: 'good',
        sharpness: 91.0,
        illumination: 94.0,
        is_acceptable: true,
        issues: []
      },
      lesions: {
        microaneurysms: drLevel >= 1 ? 12 : 0,
        hemorrhages: drLevel >= 2 ? 8 : 0,
        exudates: drLevel >= 2 ? 6 : 0,
        cotton_wool_spots: drLevel >= 3 ? 3 : 0,
        foveal_involvement: drLevel >= 2
      },
      explainability: {
        gradcam_available: true,
        heatmap_url: defaultImg,
        preprocessed_url: defaultImg,
        annotated_url: defaultImg,
        salient_regions: []
      },
      recommendation: {
        action: referable ? 'REFER_TO_OPHTHALMOLOGIST' : 'ROUTINE_ANNUAL_FOLLOWUP',
        urgency: referable ? (drLevel >= 3 ? 'urgent' : 'referral') : 'routine',
        reason: referable ? 'Referable diabetic retinopathy detected.' : 'No referable retinopathy detected.',
        clinical_guideline: referable ? 'Schedule ophthalmic dilated fundus examination within 2-4 weeks.' : 'Annual routine tele-retina screening.'
      }
    };

    const screening: Screening = {
      id: Math.floor(Date.now() / 1000),
      screening_id: sId,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_code: patient.patient_code,
      eye_side: eyeSide,
      original_image_url: defaultImg,
      status: 'COMPLETED',
      dr_level: drLevel,
      dr_label: drLabel,
      confidence: confidence,
      referable: referable,
      image_quality_score: 0.92,
      image_quality_status: 'good',
      is_acceptable_quality: true,
      model_name: 'EfficientNet-B0 (MATLAB / APTOS 2019)',
      model_version: 'MATLAB-2026.1',
      is_offline_queued: false,
      created_at: new Date().toISOString()
    };

    const detail: ScreeningDetail = {
      screening,
      patient,
      inference
    };

    const list = this.getScreenings();
    list.unshift(screening);
    localStorage.setItem('drscan_mock_screenings', JSON.stringify(list));
    localStorage.setItem(`drscan_screening_${sId}`, JSON.stringify(detail));

    return detail;
  }
}
