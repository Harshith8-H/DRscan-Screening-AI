import math
from typing import List
from app.schemas.simulation import SimulationParams, SimulationResult, HourlyQueuePoint

class SimulinkService:
    @staticmethod
    def simulate_rural_screening_flow(params: SimulationParams) -> SimulationResult:
        # Time calculations (in minutes)
        total_shift_minutes = params.work_shift_hours * 60.0
        
        # Camera capacity:
        # 1 camera takes `image_capture_time_min` per patient
        patients_per_camera_hour = 60.0 / params.image_capture_time_min
        max_hourly_camera_capacity = int(patients_per_camera_hour * params.camera_count)
        max_shift_camera_capacity = int(max_hourly_camera_capacity * params.work_shift_hours)

        # Network transmission capacity:
        # Average fundus image size = ~1.2 MB = 9.6 Megabits
        mb_per_patient = params.images_per_patient * 1.2
        bits_per_patient = mb_per_patient * 8.0
        # Transmission time per patient over bandwidth (Mbps)
        transfer_sec_per_patient = (bits_per_patient / params.bandwidth_mbps) + (params.network_latency_ms / 1000.0)
        transfer_min_per_patient = transfer_sec_per_patient / 60.0
        max_hourly_network_capacity = int(60.0 / transfer_min_per_patient) if transfer_min_per_patient > 0 else 9999
        max_shift_network_capacity = int(max_hourly_network_capacity * params.work_shift_hours)

        # Doctor review capacity:
        # Each doctor takes `doctor_review_time_min` per referred patient
        reviews_per_doctor_hour = 60.0 / params.doctor_review_time_min
        max_hourly_doctor_capacity = int(reviews_per_doctor_hour * params.doctor_count)
        max_shift_doctor_capacity = int(max_hourly_doctor_capacity * params.work_shift_hours)

        # Simulate hour-by-hour queue progression
        hours = int(params.work_shift_hours)
        hourly_points: List[HourlyQueuePoint] = []
        
        # Patient arrival distribution: Bell-curve peaking in late morning
        arrival_weights = [0.08, 0.18, 0.24, 0.20, 0.12, 0.08, 0.06, 0.04]
        if hours != 8:
            arrival_weights = [1.0 / hours] * hours

        cum_queue_camera = 0
        cum_queue_telecom = 0
        cum_queue_doctors = 0

        total_screened = 0
        total_transmitted = 0
        total_reviewed = 0
        total_referrals_generated = 0

        for h in range(1, hours + 1):
            w = arrival_weights[(h - 1) % len(arrival_weights)]
            hourly_arrivals = int(round(params.patients_per_day * w))
            
            # Step 1: Camera Station
            cum_queue_camera += hourly_arrivals
            screened_this_hour = min(cum_queue_camera, max_hourly_camera_capacity)
            cum_queue_camera -= screened_this_hour
            total_screened += screened_this_hour

            # Step 2: Telecom Uplink
            cum_queue_telecom += screened_this_hour
            trans_this_hour = min(cum_queue_telecom, max_hourly_network_capacity)
            cum_queue_telecom -= trans_this_hour
            total_transmitted += trans_this_hour

            # Referrals generated
            hourly_referrals = int(round(trans_this_hour * (params.referral_rate_pct / 100.0)))
            total_referrals_generated += hourly_referrals

            # Step 3: Doctor Review Station
            cum_queue_doctors += hourly_referrals
            rev_this_hour = min(cum_queue_doctors, max_hourly_doctor_capacity)
            cum_queue_doctors -= rev_this_hour
            total_reviewed += rev_this_hour

            hourly_points.append(HourlyQueuePoint(
                hour=h,
                arrivals=hourly_arrivals,
                screened=screened_this_hour,
                transmitted=trans_this_hour,
                reviewed=rev_this_hour,
                queue_cameras=cum_queue_camera,
                queue_telecom=cum_queue_telecom,
                queue_doctors=cum_queue_doctors
            ))

        # Overall completion rates and bottlenecks
        completion_rate = round((total_screened / max(1, params.patients_per_day)) * 100.0, 1)
        
        # Calculate utilizations
        cam_util = min(100.0, round((total_screened / max(1, max_shift_camera_capacity)) * 100.0, 1))
        net_util = min(100.0, round((total_screened / max(1, max_shift_network_capacity)) * 100.0, 1))
        expected_referrals = max(1, int(round(total_screened * (params.referral_rate_pct / 100.0))))
        doc_util = min(100.0, round((expected_referrals / max(1, max_shift_doctor_capacity)) * 100.0, 1))

        # Identify bottleneck
        recommendations = []
        if cam_util >= 90.0 and cum_queue_camera > 15:
            bottleneck = "CAMERA_CAPACITY"
            severity = "CRITICAL" if cum_queue_camera > 35 else "MODERATE"
            recommendations.append(f"Deploy {math.ceil((params.patients_per_day - max_shift_camera_capacity) / (patients_per_camera_hour * hours))} additional fundus camera(s) to clear patient queue.")
        elif net_util >= 90.0 and cum_queue_telecom > 15:
            bottleneck = "TELECOM_BANDWIDTH"
            severity = "CRITICAL" if params.bandwidth_mbps < 0.5 else "MODERATE"
            recommendations.append("Network bandwidth is causing image upload choke. Enable Offline Rural Queue mode with edge compression or off-peak sync.")
        elif doc_util >= 90.0 and cum_queue_doctors > 10:
            bottleneck = "DOCTOR_SHORTAGE"
            severity = "CRITICAL" if cum_queue_doctors > 25 else "MODERATE"
            needed_docs = math.ceil(expected_referrals / (reviews_per_doctor_hour * hours))
            recommendations.append(f"Specialist review pool overwhelmed. Assign {max(1, needed_docs - params.doctor_count)} more tele-ophthalmologist(s).")
        else:
            bottleneck = "OPTIMAL_FLOW"
            severity = "LOW"
            recommendations.append("System flow is well-balanced. Screening throughput meets daily clinic target.")

        avg_turnaround = round(
            params.image_capture_time_min +
            (transfer_min_per_patient) +
            (params.ai_inference_time_sec / 60.0) +
            (params.doctor_review_time_min if params.referral_rate_pct > 0 else 0) +
            (cum_queue_camera * 0.8),
            1
        )

        return SimulationResult(
            total_requested=params.patients_per_day,
            total_screened=total_screened,
            screening_completion_rate_pct=min(100.0, completion_rate),
            total_referrals_generated=total_referrals_generated,
            total_doctor_reviews_completed=total_reviewed,
            doctor_review_backlog=cum_queue_doctors,
            average_patient_turnaround_time_min=avg_turnaround,
            camera_utilization_pct=cam_util,
            network_uplink_utilization_pct=net_util,
            doctor_utilization_pct=doc_util,
            primary_bottleneck=bottleneck,
            bottleneck_severity=severity,
            recommendations=recommendations,
            hourly_breakdown=hourly_points
        )
