import React, { useState, useEffect } from 'react';
import { SimulationParams, SimulationResult } from '../types';
import { api } from '../services/api';

export const DistrictRuralDeployment: React.FC = () => {
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
        bandwidth_mbps: 0.25,
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
        label: 'Camera Hardware Bottleneck',
        color: isCritical ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30' : 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
      },
      TELECOM_BANDWIDTH: {
        label: 'Rural Telecom Upload Choke',
        color: isCritical ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30' : 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
      },
      DOCTOR_SHORTAGE: {
        label: 'District Specialist Deficit',
        color: isCritical ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30' : 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
      },
      OPTIMAL_FLOW: {
        label: 'Balanced Operational Flow',
        color: 'bg-[#002114] text-[#85f8c4] border border-[#069669]/30'
      }
    };
    const cur = badges[b] || badges.OPTIMAL_FLOW;
    return (
      <span className={`px-2.5 py-1 rounded text-xs font-bold ${cur.color}`}>
        {cur.label} ({severity})
      </span>
    );
  };

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5]">hub</span>
            <span>District Rural Deployment &amp; Simulink Capacity Simulator</span>
          </h1>
          <p className="text-xs text-[#45464d] mt-0.5">
            Discrete-event modeling of rural screening capacity, queuing bottlenecks, 2G/3G/4G bandwidth constraints, and doctor availability.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => applyPreset('standard')}
            className="px-2.5 py-1 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] rounded border border-[#cbd5e1] font-semibold"
          >
            Standard PHC
          </button>
          <button
            onClick={() => applyPreset('low_bandwidth')}
            className="px-2.5 py-1 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#d97706] rounded border border-[#fde68a] font-semibold"
          >
            2G Network Choke
          </button>
          <button
            onClick={() => applyPreset('surge')}
            className="px-2.5 py-1 bg-[#ffdad6] hover:bg-[#fee2e2] text-[#93000a] rounded border border-[#fecaca] font-semibold"
          >
            Mega Camp Surge
          </button>
          <button
            onClick={() => applyPreset('chc')}
            className="px-2.5 py-1 bg-[#e5eeff] hover:bg-[#dbe1ff] text-[#0051d5] rounded border border-[#bfdbfe] font-semibold"
          >
            Block CHC Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sliders Input Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0051d5]">
              Simulation Parameters
            </span>
            <button
              onClick={() => runSim(params)}
              disabled={running}
              className="px-3 py-1 bg-[#000000] text-white font-bold rounded text-xs flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              <span>Compute</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Daily Patients */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Daily Clinic Turnout:</span>
                <span className="font-mono text-[#0051d5]">{params.patients_per_day} patients</span>
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
                className="w-full accent-[#0051d5]"
              />
            </div>

            {/* Fundus Cameras */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Fundus Cameras at PHC:</span>
                <span className="font-mono text-[#0051d5]">{params.camera_count} units</span>
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
                className="w-full accent-[#0051d5]"
              />
            </div>

            {/* Camera Imaging Time */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Imaging Time / Patient:</span>
                <span className="font-mono text-[#0051d5]">{params.image_capture_time_min} mins</span>
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
                className="w-full accent-[#0051d5]"
              />
            </div>

            {/* Network Bandwidth */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Rural Network Bandwidth:</span>
                <span className="font-mono text-[#069669] font-bold">{params.bandwidth_mbps} Mbps</span>
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
                className="w-full accent-[#069669]"
              />
            </div>

            {/* Roundtrip Latency */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Roundtrip Latency:</span>
                <span className="font-mono text-[#45464d]">{params.network_latency_ms} ms</span>
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
                className="w-full accent-[#76777d]"
              />
            </div>

            {/* District Doctors */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Reviewing Ophthalmologists:</span>
                <span className="font-mono text-[#0051d5]">{params.doctor_count} doctors</span>
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
                className="w-full accent-[#0051d5]"
              />
            </div>

            {/* Doctor Review Time */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Doctor Review Time / Case:</span>
                <span className="font-mono text-[#0051d5]">{params.doctor_review_time_min} mins</span>
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
                className="w-full accent-[#0051d5]"
              />
            </div>

            {/* Referral Rate */}
            <div>
              <div className="flex justify-between font-semibold text-[#0b1c30] mb-1">
                <span>Estimated DR Referral Rate:</span>
                <span className="font-mono text-[#ba1a1a] font-bold">{params.referral_rate_pct}%</span>
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
                className="w-full accent-[#ba1a1a]"
              />
            </div>
          </div>
        </div>

        {/* Results Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {result && (
            <>
              {/* Bottleneck Diagnostic Banner */}
              <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#45464d]">
                    Diagnostic Bottleneck Analysis
                  </span>
                  {getBottleneckBadge(result.primary_bottleneck, result.bottleneck_severity)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-[#eff4ff] rounded border border-[#e2e8f0]">
                    <div className="text-[10px] text-[#45464d]">Completion Rate</div>
                    <div className="text-xl font-bold text-[#0051d5] font-mono">
                      {result.screening_completion_rate_pct}%
                    </div>
                    <div className="text-[10px] text-[#45464d]">
                      {result.total_screened}/{result.total_requested} screened
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#eff4ff] rounded border border-[#e2e8f0]">
                    <div className="text-[10px] text-[#45464d]">Camera Load</div>
                    <div className="text-xl font-bold text-[#0b1c30] font-mono">
                      {result.camera_utilization_pct}%
                    </div>
                    <div className="text-[10px] text-[#45464d]">Hardware load</div>
                  </div>

                  <div className="p-2.5 bg-[#eff4ff] rounded border border-[#e2e8f0]">
                    <div className="text-[10px] text-[#45464d]">Network Load</div>
                    <div className="text-xl font-bold text-[#069669] font-mono">
                      {result.network_uplink_utilization_pct}%
                    </div>
                    <div className="text-[10px] text-[#45464d]">Uplink bandwidth</div>
                  </div>

                  <div className="p-2.5 bg-[#eff4ff] rounded border border-[#e2e8f0]">
                    <div className="text-[10px] text-[#45464d]">Doctor Pool Load</div>
                    <div className="text-xl font-bold text-[#0051d5] font-mono">
                      {result.doctor_utilization_pct}%
                    </div>
                    <div className="text-[10px] text-[#45464d]">Specialist capacity</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-3 bg-[#f8f9ff] rounded border border-[#cbd5e1] text-xs space-y-1">
                  <span className="font-bold text-[#0b1c30] block">Operational Recommendations:</span>
                  <ul className="list-disc list-inside text-[#45464d] text-[11px] space-y-0.5">
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                    <li>Average patient turnaround from imaging to AI result: <b className="text-[#0b1c30]">{result.average_patient_turnaround_time_min} mins</b></li>
                    <li>Unreviewed backlog at shift end: <b className="text-[#ba1a1a]">{result.doctor_review_backlog} cases</b></li>
                  </ul>
                </div>
              </div>

              {/* Hourly Throughput Progression */}
              <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
                <span className="text-xs font-bold text-[#0b1c30]">
                  Hourly Operational Queue Progression (8-Hour Screening Camp)
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#0b1c30]">
                    <thead className="bg-[#e5eeff] font-mono text-[10px] uppercase text-[#45464d]">
                      <tr>
                        <th className="py-2 px-2.5">Hour</th>
                        <th className="py-2 px-2">Arrivals</th>
                        <th className="py-2 px-2">Screened</th>
                        <th className="py-2 px-2">Transmitted</th>
                        <th className="py-2 px-2">Doctor Rev.</th>
                        <th className="py-2 px-2">Camera Queue</th>
                        <th className="py-2 px-2">Doctor Queue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] font-mono text-[11px]">
                      {result.hourly_breakdown.map((r) => (
                        <tr key={r.hour} className="hover:bg-[#f8f9ff]">
                          <td className="py-1.5 px-2.5 font-bold text-[#0051d5]">H{r.hour}</td>
                          <td className="py-1.5 px-2">{r.arrivals}</td>
                          <td className="py-1.5 px-2 font-semibold">{r.screened}</td>
                          <td className="py-1.5 px-2 text-[#069669]">{r.transmitted}</td>
                          <td className="py-1.5 px-2 text-[#0051d5]">{r.reviewed}</td>
                          <td className="py-1.5 px-2">
                            <span className={r.queue_cameras > 10 ? 'text-[#ba1a1a] font-bold' : ''}>
                              {r.queue_cameras}
                            </span>
                          </td>
                          <td className="py-1.5 px-2">
                            <span className={r.queue_doctors > 5 ? 'text-[#ba1a1a] font-bold' : ''}>
                              {r.queue_doctors}
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
