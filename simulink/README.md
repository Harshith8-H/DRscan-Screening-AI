# Simulink / System-Level Capacity Simulation

This directory contains the operational and tele-ophthalmology throughput simulation model for rural healthcare screening networks in India.

## Background & Problem Context
In rural Primary Health Centres (PHCs) and Community Health Centres (CHCs), deployment constraints include:
- Limited fundus cameras per PHC (often 1 or 2 portable cameras).
- Constrained tele-network uplink (2G/3G/4G cellular latency or satellite bandwidth).
- Shortage of specialist ophthalmologists at the District Hospital review center.
- Variable patient arrival rates during screening camps.

## Simulation Parameters
| Parameter | Default | Unit | Description |
|-----------|---------|------|-------------|
| `patients_per_day` | 120 | patients | Daily rural clinic patient turnout |
| `images_per_patient` | 2 | images | Left eye & Right eye fundus photos |
| `camera_count` | 2 | units | Available fundus cameras at the PHC |
| `image_capture_time_min` | 4.0 | minutes | Operator prep, pupil check, and imaging |
| `bandwidth_mbps` | 2.5 | Mbps | Rural tele-link uplink bandwidth |
| `network_latency_ms` | 250 | ms | Network roundtrip latency to district server |
| `ai_inference_time_sec` | 1.8 | seconds | Edge/cloud inference & Grad-CAM generation |
| `doctor_count` | 3 | doctors | District ophthalmologists reviewing flagged cases |
| `doctor_review_time_min` | 3.5 | minutes | Average specialist review and confirmation time |
| `referral_rate_pct` | 28.0 | % | Percentage of screened cases needing doctor review |

## Key Insights Provided
1. **Screening Capacity**: Maximum patients screened per 8-hour shift without queuing overflow.
2. **Bottleneck Analysis**: Identifies whether the bottleneck is Camera Capture, Network Uplink, or Specialist Review.
3. **Doctor Utilization**: Percentage workload per district ophthalmologist.
4. **Bandwidth Resilience**: Calculates tele-transmission backlog when network drops to 2G (0.2 Mbps).
