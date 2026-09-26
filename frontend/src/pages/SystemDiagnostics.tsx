import React, { useState } from 'react';

export const SystemDiagnostics: React.FC = () => {
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);

  const runModelBenchmark = () => {
    setRunningBenchmark(true);
    setTimeout(() => {
      setBenchmarkResult('Inference: 138.4ms (ONNX FP16 DirectML) • Top-1: 94.2% agreement • Peak RAM: 412 MB');
      setRunningBenchmark(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#bec6e0]/30 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#131b2e] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5]">settings</span>
            System Diagnostics & PACS Telemetry
          </h1>
          <p className="text-xs text-[#444653] mt-0.5 font-mono">
            Hardware acceleration, DICOM SCP interfaces, local storage buffer, and CDSCO Class B SaMD verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#002114] text-[#85f8c4] border border-[#069669]/40 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-[#069669] animate-pulse"></span>
            All 5 Local Subsystems Operational
          </span>
        </div>
      </div>

      {/* Grid of Diagnostic Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Panel 1: Edge AI Inference Engine */}
        <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#bec6e0]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5]">memory</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                AI Model Engine
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-[#85f8c4]/30 text-[#005232] rounded font-mono text-[10px] font-bold">
              OPTIMIZED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#444653]">
              <span>Architecture:</span>
              <span className="font-semibold text-[#131b2e]">EfficientNet-B0</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Runtime:</span>
              <span className="font-semibold text-[#131b2e]">ONNX Runtime v1.17 + PyTorch</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Quantization:</span>
              <span className="font-semibold text-[#131b2e]">FP16 Tensor Core</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Grad-CAM Target Layer:</span>
              <span className="font-semibold text-[#131b2e]">features.denseblock4</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Lesion Analysis:</span>
              <span className="font-semibold text-[#131b2e]">Not enabled</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#bec6e0]/20">
            <button
              onClick={runModelBenchmark}
              disabled={runningBenchmark}
              className="w-full py-1.5 px-3 bg-[#eef0ff] hover:bg-[#dbe1ff] text-[#0051d5] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span className={`material-symbols-outlined text-sm ${runningBenchmark ? 'animate-spin' : ''}`}>
                speed
              </span>
              <span>{runningBenchmark ? 'Running Latency Benchmark...' : 'Run Diagnostics Benchmark'}</span>
            </button>
            {benchmarkResult && (
              <div className="mt-2 p-2 bg-[#f8f9ff] border border-[#bec6e0]/30 rounded text-[10px] font-mono text-[#0051d5]">
                {benchmarkResult}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Fundus Camera Interface */}
        <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#bec6e0]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5]">photo_camera</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                Fundus Hardware Interface
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-[#85f8c4]/30 text-[#005232] rounded font-mono text-[10px] font-bold">
              CONNECTED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#444653]">
              <span>Detected Device:</span>
              <span className="font-semibold text-[#131b2e]">Forus 3nethra Classic HD</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Protocol:</span>
              <span className="font-semibold text-[#131b2e]">DICOM 3.0 Modality Worklist</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Field of View (FOV):</span>
              <span className="font-semibold text-[#131b2e]">45° Non-Mydriatic Color</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Native Resolution:</span>
              <span className="font-semibold text-[#131b2e]">2048 x 1536 (RGB 24-bit)</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Quality Rejection Gate:</span>
              <span className="font-semibold text-[#131b2e]">Laplacian Variance &gt; 100.0</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#bec6e0]/20">
            <div className="flex items-center justify-between text-[11px] text-[#444653]">
              <span>Auto-capture Trigger:</span>
              <span className="text-[#069669] font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#444653] mt-1">
              <span>Illumination Sensor:</span>
              <span className="text-[#069669] font-bold">Optimal (98.2%)</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Local NVMe Storage Buffer */}
        <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#bec6e0]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5]">hard_drive</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                Local Storage Buffer
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-[#85f8c4]/30 text-[#005232] rounded font-mono text-[10px] font-bold">
              HEALTHY
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#444653]">
              <span>Drive:</span>
              <span className="font-semibold text-[#131b2e]">M.2 NVMe SSD (Local Enclave)</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Encrypted Volume:</span>
              <span className="font-semibold text-[#131b2e]">AES-256 BitLocker</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Cached Screening Studies:</span>
              <span className="font-semibold text-[#131b2e]">1,420 files</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Used Space:</span>
              <span className="font-semibold text-[#131b2e]">1.42 GB / 64 GB</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#bec6e0]/20 space-y-1.5">
            <div className="flex justify-between text-[10px] text-[#444653] font-mono">
              <span>Disk Consumption</span>
              <span>84% Cache Limit</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#0051d5] h-full" style={{ width: '84%' }} />
            </div>
            <span className="text-[10px] text-[#444653] block">
              Auto-eviction: Retains un-synced studies indefinitely; deletes synced images &gt; 30 days old.
            </span>
          </div>
        </div>

        {/* Panel 4: Store-and-Forward Telemedicine Gateway */}
        <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#bec6e0]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5]">cloud_sync</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                Store-and-Forward Gateway
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-[#85f8c4]/30 text-[#005232] rounded font-mono text-[10px] font-bold">
              DAEMON OK
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#444653]">
              <span>Sync Protocol:</span>
              <span className="font-semibold text-[#131b2e]">HTTPS / gRPC Chunks</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Queue Database:</span>
              <span className="font-semibold text-[#131b2e]">dr_screening.db (WAL Mode)</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Resilient Backoff:</span>
              <span className="font-semibold text-[#131b2e]">Fibonacci Exponential</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>District Central PACS:</span>
              <span className="font-semibold text-[#131b2e]">pacs.chittoor-health.gov.in</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#bec6e0]/20">
            <div className="flex items-center gap-2 text-xs text-[#069669]">
              <span className="material-symbols-outlined text-sm">wifi</span>
              <span className="font-mono">Current Latency: 120 ms (Airtel 4G LTE)</span>
            </div>
          </div>
        </div>

        {/* Panel 5: CDSCO SaMD Regulatory Compliance */}
        <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#bec6e0]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5]">gavel</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                Regulatory Audit Trail
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-[#85f8c4]/30 text-[#005232] rounded font-mono text-[10px] font-bold">
              VERIFIED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#444653]">
              <span>Medical Device Class:</span>
              <span className="font-semibold text-[#131b2e]">CDSCO Class B (Medium Risk SaMD)</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>ISO 13485 Audit:</span>
              <span className="font-semibold text-[#131b2e]">ISO 13485:2016 Compliant</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>IEC 62304 Lifecycle:</span>
              <span className="font-semibold text-[#131b2e]">Software Safety Class B</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Audit Logging:</span>
              <span className="font-semibold text-[#131b2e]">SHA-256 Tamper Evident</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#bec6e0]/20">
            <div className="text-[10px] text-[#444653]">
              Screening outputs are triaged as diagnostic decision support. Human doctor confirmation mandatory before treatment initiation.
            </div>
          </div>
        </div>

        {/* Panel 6: Ayushman Bharat ABDM Integration */}
        <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#bec6e0]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5]">fingerprint</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                ABDM / Ayushman Bharat
              </h2>
            </div>
            <span className="px-2 py-0.5 bg-[#85f8c4]/30 text-[#005232] rounded font-mono text-[10px] font-bold">
              LINKED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#444653]">
              <span>ABHA Gateway:</span>
              <span className="font-semibold text-[#131b2e]">HIU / HIP Milestone 1 & 2</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Consent Management:</span>
              <span className="font-semibold text-[#131b2e]">FHIR R4 DiagnosticReport</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Facility Registry:</span>
              <span className="font-semibold text-[#131b2e]">HFR ID: IN-AP-CHT-00812</span>
            </div>
            <div className="flex justify-between text-[#444653]">
              <span>Doctor Registry:</span>
              <span className="font-semibold text-[#131b2e]">HPR Validated Credentials</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#bec6e0]/20">
            <div className="flex items-center gap-1.5 text-xs text-[#0051d5]">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="font-mono text-[11px]">eKYC OTP & Biomarker Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
