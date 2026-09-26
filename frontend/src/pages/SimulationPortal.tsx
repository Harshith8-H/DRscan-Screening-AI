import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Wifi,
  Users,
  Camera,
  Clock,
  Play,
  RotateCcw
} from 'lucide-react';
import { SimulationParams, SimulationResult } from '../types';
import { api } from '../services/api';

export const SimulationPortal: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    patients_per_day: 120,
    images_per_patient: 2,
    camera_count: 2,
    image_capture_time_min: 4.0,
    bandwidth_mbps: 2.5,
    network_latency_ms: 250,
    ai_inference_time_sec: 1.8,
    doctor_count: 3,
    doctor_review_time_min: 3.5,
    referral_rate_pct: 28.0,
    work_shift_hours: 8.0
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    runSim(params);
  }, []);

  const runSim = async (currentParams: SimulationParams) => {
    setRunning(true);
    try {
      const res = await api.runSimulation(currentParams);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const applyPreset = (preset: 'standard' | 'chc' | 'surge' | 'low_bandwidth') => {
    let p = { ...params };
    if (preset === 'standard') {
      p = {
        ...p,
        patients_per_day: 120,
        camera_count: 2,
        bandwidth_mbps: 2.5,
        network_latency_ms: 250,
        doctor_count: 3
      };
    } else if (preset === 'chc') {
      p = {
        ...p,
        patients_per_day: 250,
        camera_count: 4,
        bandwidth_mbps: 10.0,
        network_latency_ms: 80,
        doctor_count: 6
      };
    } else if (preset === 'surge') {
      p = {
        ...p,
        patients_per_day: 400,
        camera_count: 3,
        bandwidth_mbps: 4.0,
        network_latency_ms: 300,
        doctor_count: 4
      };
    } else if (preset === 'low_bandwidth') {
      p = {
        ...p,
        patients_per_day: 100,
        camera_count: 2,
        bandwidth_mbps: 0.25, // 2G connection choke
        network_latency_ms: 800,
        doctor_count: 3
      };
    }
    setParams(p);
    runSim(p);
  };

  const getBottleneckBadge = (b: string, severity: string) => {
    const isCritical = severity === 'CRITICAL';
    const badges: Record<string, { label: string; color: string }> = {
      CAMERA_CAPACITY: {
        label: 'Camera Imaging Bottleneck',
        color: isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      },
      TELECOM_BANDWIDTH: {
        label: 'Rural Telecom / Network Choke',
        color: isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      },
      DOCTOR_SHORTAGE: {
        label: 'District Specialist Deficit',
        color: isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      },
      OPTIMAL_FLOW: {
        label: 'Balanced Operational Flow',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      }
    };
    const cur = badges[b] || badges.OPTIMAL_FLOW;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cur.color}`}>
        {cur.label} ({severity})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span>Simulink Operational Capacity & Rural Network Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discrete-event modeling of rural tele-ophthalmology screening pipelines under camera constraints, 2G/3G bandwidth, and specialist pools.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition"
          >
            Standard PHC
          </button>
          <button
            onClick={() => applyPreset('low_bandwidth')}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-amber-400 transition"
          >
            2G Network Choke
          </button>
          <button
            onClick={() => applyPreset('surge')}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-rose-400 transition"
          >
            Mega Camp Surge
          </button>
          <button
            onClick={() => applyPreset('chc')}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-teal-400 transition"
          >
            Block CHC Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Input Panel (5-Span) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Simulation Parameters
            </h2>
            <button
              onClick={() => runSim(params)}
              disabled={running}
              className="px-3 py-1 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md shadow-teal-500/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Simulate</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Daily Patients */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Daily Patients:</span>
                <span className="font-mono text-teal-400">{params.patients_per_day} patients</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={params.patients_per_day}
                onChange={(e) => {
                  const val = { ...params, patients_per_day: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-teal-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* Fundus Cameras */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Fundus Cameras at PHC:</span>
                <span className="font-mono text-teal-400">{params.camera_count} unit(s)</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={params.camera_count}
                onChange={(e) => {
                  const val = { ...params, camera_count: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-teal-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* Image Capture Time */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Camera Imaging Time / Patient:</span>
                <span className="font-mono text-teal-400">{params.image_capture_time_min} mins</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="10.0"
                step="0.5"
                value={params.image_capture_time_min}
                onChange={(e) => {
                  const val = { ...params, image_capture_time_min: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-teal-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* Network Bandwidth */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Rural Network Bandwidth:</span>
                <span className="font-mono text-cyan-400">{params.bandwidth_mbps} Mbps</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="25.0"
                step="0.2"
                value={params.bandwidth_mbps}
                onChange={(e) => {
                  const val = { ...params, bandwidth_mbps: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* Network Latency */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Roundtrip Latency:</span>
                <span className="font-mono text-slate-400">{params.network_latency_ms} ms</span>
              </div>
              <input
                type="range"
                min="20"
                max="1500"
                step="20"
                value={params.network_latency_ms}
                onChange={(e) => {
                  const val = { ...params, network_latency_ms: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-slate-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* District Reviewing Doctors */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>District Tele-Ophthalmologists:</span>
                <span className="font-mono text-emerald-400">{params.doctor_count} doctors</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={params.doctor_count}
                onChange={(e) => {
                  const val = { ...params, doctor_count: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-emerald-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* Doctor Review Time */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Doctor Review Time / Case:</span>
                <span className="font-mono text-emerald-400">{params.doctor_review_time_min} mins</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="8.0"
                step="0.5"
                value={params.doctor_review_time_min}
                onChange={(e) => {
                  const val = { ...params, doctor_review_time_min: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-emerald-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>

            {/* Referral Rate */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Estimated DR Referral Rate:</span>
                <span className="font-mono text-rose-400">{params.referral_rate_pct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={params.referral_rate_pct}
                onChange={(e) => {
                  const val = { ...params, referral_rate_pct: Number(e.target.value) };
                  setParams(val);
                  runSim(val);
                }}
                className="w-full accent-rose-400 bg-slate-950 h-1.5 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Results & Visual Analytics Panel (7-Span) */}
        <div className="lg:col-span-7 space-y-4">
          {result && (
            <>
              {/* Bottleneck Diagnosis Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase font-mono font-bold text-slate-400">
                    System Bottleneck Diagnostic
                  </span>
                  {getBottleneckBadge(result.primary_bottleneck, result.bottleneck_severity)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Completion Rate</div>
                    <div className="text-xl font-bold text-teal-400 font-mono">
                      {result.screening_completion_rate_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {result.total_screened}/{result.total_requested} patients
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Camera Load</div>
                    <div className="text-xl font-bold text-slate-200 font-mono">
                      {result.camera_utilization_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500">Utilization</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Network Load</div>
                    <div className="text-xl font-bold text-cyan-400 font-mono">
                      {result.network_uplink_utilization_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500">Uplink pipe</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Doctor Load</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">
                      {result.doctor_utilization_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500">Specialist pool</div>
                  </div>
                </div>

                {/* Practical Recommendations */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-semibold text-slate-300">Operational Engineering Recommendations:</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                    <li>Average patient turnaround from imaging to AI result: <b className="text-slate-200">{result.average_patient_turnaround_time_min} mins</b></li>
                    <li>Unreviewed backlog at shift end: <b className="text-amber-400">{result.doctor_review_backlog} cases</b></li>
                  </ul>
                </div>
              </div>

              {/* Hourly Progression Simulation Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Hourly Queue & Throughput Progression
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Hour</th>
                        <th className="px-3 py-2">Arrivals</th>
                        <th className="px-3 py-2">Screened</th>
                        <th className="px-3 py-2">Transmitted</th>
                        <th className="px-3 py-2">Doctor Rev.</th>
                        <th className="px-3 py-2">Cam Queue</th>
                        <th className="px-3 py-2">Doc Queue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-[11px] font-mono">
                      {result.hourly_breakdown.map((row) => (
                        <tr key={row.hour} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-bold text-teal-400">H{row.hour}</td>
                          <td className="px-3 py-2">{row.arrivals}</td>
                          <td className="px-3 py-2 text-slate-200">{row.screened}</td>
                          <td className="px-3 py-2 text-cyan-400">{row.transmitted}</td>
                          <td className="px-3 py-2 text-emerald-400">{row.reviewed}</td>
                          <td className="px-3 py-2">
                            <span className={row.queue_cameras > 10 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                              {row.queue_cameras}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={row.queue_doctors > 5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                              {row.queue_doctors}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
