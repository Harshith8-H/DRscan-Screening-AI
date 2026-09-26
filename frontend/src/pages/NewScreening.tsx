import React, { useState, useEffect } from 'react';
import { Patient, SampleFundus } from '../types';
import { api } from '../services/api';
import { INITIAL_PATIENTS, SAMPLE_FUNDUS_LIST } from '../services/mockData';

interface NewScreeningProps {
  onScreeningCompleted: (screeningId: string) => void;
  isOfflineMode: boolean;
}

export const NewScreening: React.FC<NewScreeningProps> = ({
  onScreeningCompleted,
  isOfflineMode
}) => {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(INITIAL_PATIENTS[0]?.id || null);
  const [eyeSide, setEyeSide] = useState<'RIGHT' | 'LEFT'>('RIGHT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [samples, setSamples] = useState<SampleFundus[]>(SAMPLE_FUNDUS_LIST);
  const [selectedSample, setSelectedSample] = useState<SampleFundus | null>(null);

  // Quick Register Modal
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 52,
    sex: 'Male',
    diabetes_duration_years: 6.0,
    phone: '',
    village_or_phc: 'PHC Chandragiri',
    blood_sugar_fasting: 154.0,
    hba1c: 7.6
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plist, slist] = await Promise.all([
        api.getPatients(),
        api.getSampleList()
      ]);
      if (plist && plist.length > 0) {
        setPatients(plist);
        setSelectedPatientId((prev) => prev || plist[0].id);
      }
      if (slist && slist.length > 0) {
        setSamples(slist);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setSelectedSample(null);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleSelectSample = (s: SampleFundus) => {
    setSelectedSample(s);
    setSelectedFile(null);
    setFilePreview(`/uploads/${s.filename}`);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createPatient(newPatient);
      setPatients([created, ...patients]);
      setSelectedPatientId(created.id);
      setShowAddPatient(false);
    } catch (err: any) {
      alert(err.message || 'Failed to register patient');
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient identifier');
      return;
    }
    if (!selectedFile && !selectedSample) {
      alert('Please acquire a fundus photograph or select a clinical test study');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Validating image quality & retinal disc focus...');

    try {
      setTimeout(() => setProcessingStep('EfficientNet-B0 feature extraction (MATLAB)...'), 400);
      setTimeout(() => setProcessingStep('Computing Grad-CAM gradient activations...'), 900);
      setTimeout(() => setProcessingStep('Segmenting microaneurysms and exudates...'), 1400);

      let detail;
      if (selectedSample) {
        detail = await api.screenFromSample(selectedPatientId, selectedSample.filename, eyeSide);
      } else if (selectedFile) {
        detail = await api.uploadAndScreen(selectedPatientId, eyeSide, selectedFile, isOfflineMode);
      }

      if (detail && detail.screening) {
        setProcessingStep('Triage assessment complete!');
        setTimeout(() => {
          setIsProcessing(false);
          onScreeningCompleted(detail.screening.screening_id);
        }, 500);
      }
    } catch (err: any) {
      setIsProcessing(false);
      alert(err.message || 'Screening failed');
    }
  };

  return (
    <div className="p-5 max-w-5xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5]">photo_camera</span>
            <span>RetinaCare Acquisition &amp; Triage Station</span>
          </h1>
          <p className="text-xs text-[#45464d] mt-0.5">
            Step-by-step tele-screening pipeline: Select Patient Identifier → Acquire Fundus Image → Trigger Explainable AI.
          </p>
        </div>

        {isOfflineMode && (
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#fffbeb] text-[#d97706] border border-[#fde68a] font-semibold">
            ⚡ Rural Edge Offline Mode Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5-Span): Patient & Laterality */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Step 1: Patient Selection */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0051d5]">
                Step 1: Patient Identifier
              </span>
              <button
                type="button"
                onClick={() => setShowAddPatient(true)}
                className="text-xs text-[#0051d5] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>+ Register Patient</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Select Patient</label>
              <select
                value={selectedPatientId || ''}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-xs text-[#0b1c30] focus:border-[#0051d5]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_code} - {p.name} ({p.age}y, {p.sex}) • {p.village_or_phc || 'PHC'}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientId && (
              <div className="p-3 bg-[#eff4ff] rounded border border-[#e2e8f0] text-xs space-y-1">
                {(() => {
                  const p = patients.find((x) => x.id === selectedPatientId);
                  if (!p) return null;
                  return (
                    <>
                      <div className="font-bold text-[#0b1c30] flex justify-between">
                        <span>{p.name}</span>
                        <span className="font-mono text-[#0051d5]">{p.patient_code}</span>
                      </div>
                      <div className="text-[#45464d] text-[11px]">
                        Age: {p.age} | Sex: {p.sex} | Diabetes: {p.diabetes_duration_years || 'N/A'} yrs
                      </div>
                      <div className="text-[#45464d] text-[11px]">
                        Village / PHC: {p.village_or_phc}
                      </div>
                      {p.hba1c && (
                        <div className="text-[#d97706] text-[11px] font-semibold">
                          HbA1c: {p.hba1c}% • Fasting Glucose: {p.blood_sugar_fasting} mg/dL
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Step 2: Eye Laterality */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0051d5] border-b border-[#e2e8f0] pb-2">
              Step 2: Eye Laterality
            </span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEyeSide('RIGHT')}
                className={`p-3 rounded border text-center transition cursor-pointer ${
                  eyeSide === 'RIGHT'
                    ? 'bg-[#dbe1ff] border-[#0051d5] text-[#00174b] font-bold'
                    : 'bg-white border-[#cbd5e1] text-[#45464d] hover:bg-[#f8f9ff]'
                }`}
              >
                <div className="text-sm font-bold">OD (Right Eye)</div>
                <div className="text-[10px] text-[#45464d]">Oculus Dexter</div>
              </button>

              <button
                type="button"
                onClick={() => setEyeSide('LEFT')}
                className={`p-3 rounded border text-center transition cursor-pointer ${
                  eyeSide === 'LEFT'
                    ? 'bg-[#dbe1ff] border-[#0051d5] text-[#00174b] font-bold'
                    : 'bg-white border-[#cbd5e1] text-[#45464d] hover:bg-[#f8f9ff]'
                }`}
              >
                <div className="text-sm font-bold">OS (Left Eye)</div>
                <div className="text-[10px] text-[#45464d]">Oculus Sinister</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7-Span): Fundus Acquisition & Samples */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0051d5]">
                Step 3: Fundus Photograph Input
              </span>
              <span className="text-xs text-[#45464d]">Camera capture or sample study</span>
            </div>

            {/* 1-Click Clinical Test Samples */}
            <div>
              <div className="text-xs font-bold text-[#0b1c30] mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#0051d5]">science</span>
                <span>Clinical Test Samples (Immediate Testing)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`p-2 rounded border text-left text-xs transition cursor-pointer ${
                      selectedSample?.id === s.id
                        ? 'bg-[#dbe1ff] border-[#0051d5] text-[#00174b] font-semibold shadow-xs'
                        : 'bg-[#eff4ff] border-[#cbd5e1] text-[#0b1c30] hover:bg-[#e5eeff]'
                    }`}
                  >
                    <div className="font-bold text-[11px] truncate">{s.name}</div>
                    <div className="text-[10px] text-[#45464d] line-clamp-2 mt-0.5">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 my-1">
              <div className="h-px bg-[#e2e8f0] flex-1"></div>
              <span className="text-[10px] text-[#76777d] uppercase font-mono">OR UPLOAD RAW DICOM / IMAGE</span>
              <div className="h-px bg-[#e2e8f0] flex-1"></div>
            </div>

            {/* File Upload Dropzone */}
            <div className="border-2 border-dashed border-[#cbd5e1] hover:border-[#0051d5] rounded p-4 text-center transition bg-[#f8f9ff]">
              <input
                type="file"
                id="fundus-upload"
                accept=".jpg,.jpeg,.png,.webp,.tif"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="fundus-upload" className="cursor-pointer block">
                <span className="material-symbols-outlined text-3xl text-[#0051d5] mb-1">
                  cloud_upload
                </span>
                <div className="text-xs font-semibold text-[#0b1c30]">
                  {selectedFile ? selectedFile.name : 'Select or Drag Fundus Photograph'}
                </div>
                <div className="text-[10px] text-[#45464d] mt-0.5">
                  Supports JPEG, PNG, TIFF from portable cameras (up to 25MB)
                </div>
              </label>
            </div>

            {/* Preview Banner */}
            {filePreview && (
              <div className="bg-[#eff4ff] border border-[#cbd5e1] rounded p-2.5 flex items-center gap-3">
                <img
                  src={filePreview}
                  alt="Fundus preview"
                  className="w-14 h-14 rounded object-cover border border-[#cbd5e1] bg-black"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-[#0b1c30]">
                    {selectedSample ? selectedSample.name : selectedFile?.name}
                  </div>
                  <div className="text-[11px] text-[#45464d]">
                    Ready for Explainable AI inference pipeline
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#069669] text-xl">check_circle</span>
              </div>
            )}

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={isProcessing || (!selectedFile && !selectedSample)}
              className={`w-full py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                isProcessing
                  ? 'bg-[#eff4ff] text-[#0051d5] cursor-not-allowed'
                  : !selectedFile && !selectedSample
                  ? 'bg-[#e5eeff] text-[#76777d] cursor-not-allowed'
                  : 'bg-[#000000] hover:bg-[#213145] text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>{processingStep}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Trigger Explainable AI Inference &amp; Grad-CAM</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h2 className="text-base font-bold text-[#0b1c30]">Register Rural Patient</h2>
            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#0b1c30] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30]"
                  placeholder="e.g. Kamala Bai"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30]"
                  />
                </div>
                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">Sex *</label>
                  <select
                    value={newPatient.sex}
                    onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value })}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">Diabetes Duration (Yrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPatient.diabetes_duration_years}
                    onChange={(e) => setNewPatient({ ...newPatient, diabetes_duration_years: Number(e.target.value) })}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30]"
                  />
                </div>
                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">HbA1c (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPatient.hba1c}
                    onChange={(e) => setNewPatient({ ...newPatient, hba1c: Number(e.target.value) })}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0b1c30] font-semibold mb-1">Village / Sub-Centre</label>
                <input
                  type="text"
                  value={newPatient.village_or_phc}
                  onChange={(e) => setNewPatient({ ...newPatient, village_or_phc: e.target.value })}
                  className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30]"
                  placeholder="e.g. Chandragiri Sub-Centre"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddPatient(false)}
                  className="px-3 py-1.5 bg-[#eff4ff] text-[#0b1c30] rounded border border-[#cbd5e1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#000000] text-white font-bold rounded"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
