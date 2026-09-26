---
name: Clinical Diagnostic Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002114'
  on-tertiary-container: '#069669'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.875rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.375rem
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.4rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: 1.125rem
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.025em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.5rem
  margin: 1.25rem
  margin-compact: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers a high-reliability clinical workstation and picture archiving/screening environment tailored for explainable artificial intelligence (XAI) diabetic retinopathy triage. Operating within rural Primary Healthcare Centres (PHCs), sub-district clinics, and tertiary referral hospitals, the interface addresses severe operational constraints: varied ambient lighting, low-tier display monitors, intermittent edge connectivity, and time-pressured paramedical operators.

The visual style is rooted in functional clinical rigor, deriving discipline from Picture Archiving and Communication Systems (PACS) and modern Hospital Information Systems (HIS). It avoids consumer-facing SaaS trends: there are no glassmorphic blurs, floating ambient drop shadows, decorative cards, or vibrant marketing gradients. Every pixel, line, and contrast ratio serves rapid perceptual triage, data legibility, and diagnostic transparency.

The emotional tone must inspire unyielding diagnostic trust, institutional authority, and cognitive calm under high-throughput patient loads. Paramedical screeners and ophthalmologists must instantly discern between ungradable fundus captures, benign findings, and urgent surgical escalations. High-contrast lineation, structural grid enclosures, clear state indicators, and dedicated diagnostic chrome govern the presentation.

## Colors

The system uses a high-contrast clinical light palette, paired with dark diagnostic viewport modes for fundus photo examination. Surfaces prioritize crisp edge delineation and low visual fatigue over prolonged shifts.

### Core Foundation
- **Canvas Base**: `#ffffff` (Pure White) for clinical data sheets and high-readability reports; `#f8fafc` (Slate 50) for workstation backgrounds and viewport margins.
- **Surface Elevation Containers**: `#f1f5f9` (Slate 100) for structural panels, toolbar ribbons, and data sheet section headers.
- **Borders & Dividers**: `#cbd5e1` (Slate 300) for interactive control borders, structural column dividers, and tab bars; `#e2e8f0` (Slate 200) for secondary interior cell borders.
- **Primary Text & Chrome**: `#0f172a` (Slate 900) provides definitive contrast for patient identifiers, clinical labels, and primary tabular metrics.
- **Secondary Body Text**: `#334155` (Slate 700) for clinical notes and explanatory metadata.
- **Tertiary & Muted Text**: `#64748b` (Slate 500) for units, timestamps, and camera hardware serial codes.

### Diagnostic Dark Viewport (PACS HUD Surface)
- **Viewport Canvas**: `#090d16` (Deep Black-Slate) providing optimal dynamic range without optic nerve bleaching during retinal evaluation.
- **Viewport Chrome Overlays**: `#0f172a` with an opaque, solid structural border (`#334155`).

### Semantic Clinical Severity & Status
Every clinical state follows a three-token structure: a saturated foreground anchor, a soft desaturated background tint, and an enclosing structural border.
- **Normal / Negative / Completed**:
  - Base: `#059669` (Emerald 600) / Active Hover: `#047857`
  - Background Tint: `#ecfdf5` (Emerald 50)
  - Stroke: `#a7f3d0` (Emerald 200)
- **Borderline / Moderate Non-Proliferative / Quality Warning**:
  - Base: `#d97706` (Amber 600) / Active Hover: `#b45309`
  - Background Tint: `#fffbeb` (Amber 50)
  - Stroke: `#fde68a` (Amber 200)
- **Referable / Severe / Proliferative / Critical Failure**:
  - Base: `#dc2626` (Red 600) / Active Hover: `#b91c1c`
  - Background Tint: `#fef2f2` (Red 50)
  - Stroke: `#fecaca` (Red 200)
- **Active Selection / Focus / Informational**:
  - Base: `#2563eb` (Blue 600) / Active Hover: `#1d4ed8`
  - Background Tint: `#eff6ff` (Blue 50)
  - Stroke: `#bfdbfe` (Blue 200)

## Typography

Typography enforces high legibility under varying viewing angles and sub-optimal screen resolutions. **Inter** serves as the primary system font for clinical prose, patient names, and workflow commands, paired with tabular figure alternates (`font-variant-numeric: tabular-nums`) enabled across all data presentations.

**JetBrains Mono** is utilized strictly as a secondary clinical anchor for patient identifiers (e.g., `ABHA-ID: 91-8201-9923`), ICD-10 diagnostic codes, lesion coordinates, DICOM tags, hardware telemetry, confidence scores, and offline batch counters. Its monospaced alignment prevents perceptual jitter when values update in real time.

All typography maintains rigid line heights that align to a 4px vertical rhythm grid. Letter spacing is slightly tightened on larger display headers to preserve density, and expanded on sub-12px status tags (`label-sm`) to ensure legibility when rendered on lower-resolution PHC monitors.

## Layout & Spacing

The workstation uses a fluid, dense structural framework designed to display maximum clinical context on a single screen without vertical pagination. Diagnostic mistakes happen when critical evidence is buried below the scroll; therefore, clinical dashboards and viewer views default to a fixed-height, dual- or tri-pane viewport architecture.

### Grid & Layout Strategy
- **Diagnostic Triage Screen**: Fixed left sidebar (260px) for camera/hardware sync and queue navigation; fluid central staging canvas (minimum 640px) housing the retinal DICOM HUD viewer; fixed right-hand diagnostic panel (380px to 440px) displaying inference outputs, lesion heatmaps, and medical sign-off controls.
- **Paramedical Patient Registry**: 12-column fluid grid with `1rem` (16px) gutters and `1.25rem` (20px) outer margins, allowing dense tabular scanning of daily community screenings.
- **Breakpoint Rules**:
  - Desktop (>1280px): Full 3-pane parallel workstation mode.
  - Tablet Landscape (1024px - 1279px): Sidebar collapses into an icon-only dock; right-hand analysis panel transitions to a collapsible slide-over or side drawer.
  - Sub-1024px / Low-Resolution Field Stations: The interface reflows into a linear stacked workflow (Capture Quality -> Inference View -> Clinical Referral Action).

### Spatial Rhythm
Component padding follows an incremental scale anchored at 4px. Compact controls (`space-xs`, `space-sm`) are preferred for data grids, toolbars, and status badges, keeping screen density high without crowding interactive targets.

## Elevation & Depth

This design system avoids physical drop shadows. Depth and visual hierarchy are instead communicated through **structural panel boundaries, contrast gating, and tonal layering**.

### Surface-Level Hierarchy
1. **Canvas Level (L0)**: `#f8fafc` — Base workstation canvas visible only around structural margins and divider boundaries.
2. **Panel Level (L1)**: `#ffffff` — Workstation panels, screening queues, and diagnostic record panes. Separated exclusively with `#cbd5e1` 1px borders.
3. **Sub-Panel / Section Inset Level (L2)**: `#f1f5f9` — Quality assurance telemetry strips, patient header badges, and table header rows.
4. **Interactive Raised Overlays (L3 - Menus, Context Popovers, Viewport HUD Controls)**: `#ffffff` in data mode, `#0f172a` in diagnostic viewport mode. Elevated using a single, sharp 1px structural border (`#94a3b8` in light mode, `#334155` in dark mode) paired with an ultra-subtle, clean ambient edge: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.

### Viewport Superimposition
Overlays floating on top of the fundus canvas (zoom bars, scale reticles, DICOM orientation markers) use full opacity `#0f172a` or dark tints with `#334155` high-contrast outlines. Translucent blurs and glass effects are prohibited to preserve diagnostic clarity across all displays.

## Shapes

The geometric architecture is crisp, architectural, and compact. A roundedness factor of `1` dictates `0.25rem` (4px) corner radii across interactive components, input surfaces, and data containers. Larger modular panels and diagnostic viewer viewports use a maximum radius of `0.375rem` (6px).

Fully rounded pill buttons and hyper-curved aesthetic treatments are disallowed, with one exception: **Clinical Status Pills** use rounded ends only when conveying distinct categorizations (e.g., ICD classification tags, offline queue status) to distinguish metadata badges from actionable buttons.

## Components

### 1. Diagnostic Buttons
- **Primary Clinical Action (Sign-off, Submit Referral)**: Solid background `#0f172a`, text `#ffffff`, border 1px solid `#0f172a`. Hover: `#1e293b`. Focus: 2px offset ring in `#2563eb`.
- **Secondary Action (Recapture Image, Secondary Review)**: Background `#ffffff`, text `#0f172a`, border 1px solid `#cbd5e1`. Hover: `#f8fafc` with border `#94a3b8`.
- **Critical Action (Reject Scan, Mark Severe Urgent Triage)**: Background `#dc2626`, text `#ffffff`, border 1px solid `#dc2626`. Hover: `#b91c1c`. Focus: 2px offset ring in `#ef4444`.
- **Height & Sizing**: Standard input and button height is compact at `32px` (`2rem`) for toolbars and `38px` for primary submission buttons.

### 2. Clinical Data Tables
- **Header**: Background `#f1f5f9`, border-bottom 2px solid `#cbd5e1`, typography `label-sm` in `#475569`, text uppercase with `0.05em` tracking.
- **Row Architecture**: Alternating row backgrounds prohibited. Rows sit on `#ffffff` with a 1px solid bottom border (`#e2e8f0`). Row height locked to `40px` for high-density scanning. Hover state: `#f8fafc`.
- **Numerical Alignment**: All biometric, visual acuity, and AI confidence scores must be right-aligned with monospaced tabular numerals (`code-sm`).

### 3. Explainability Lesion Toggles & Evidence Badges
Diagnostic tools feature distinct bounding toggles for detected retinal features:
- **Microaneurysms**: Indigo border `#6366f1`, tint `#eef2ff`.
- **Hemorrhages**: Rose border `#f43f5e`, tint `#fff1f2`.
- **Hard Exudates**: Amber border `#f59e0b`, tint `#fffbeb`.
- **Cotton Wool Spots**: Cyan border `#06b6d4`, tint `#ecfeff`.
- **Component Anatomy**: A segmented strip where each lesion category can be toggled on/off. When active, displays the lesion count badge, detection confidence percentage, and outlines the corresponding heatmap vector mask on the fundus viewport.

### 4. Step-Based Clinical Workflow Ribbon
A high-visibility sequential header tracking image progression:
`Quality Gate (Focus/Illumination)` → `AI Inference Processing` → `Lesion Detection Review` → `Doctor Validation / Tele-Referral`.
- **States**: Complete (solid green check `#059669`), In-Progress (active blue bar `#2563eb`), Locked/Pending (slate gray `#94a3b8`), Failed/Rejected (solid red cross `#dc2626`).
- Must clearly indicate if an image is classified as **Ungradable** due to cataracts, pupil dilation issues, or motion blur before any inference can be approved.

### 5. Retinal Viewport & HUD Overlays
- **Frame**: Deep black canvas with high-contrast slate borders (`#334155`).
- **HUD Telemetry**: Placed in the four corners using monospaced labels (`code-sm`):
  - Top-Left: Patient Age/Sex, Eye Laterality (`OD` right eye / `OS` left eye in bold amber or green).
  - Top-Right: Camera Sensor Model, Field of View (e.g., `45° Macula-Centered`).
  - Bottom-Left: Pan / Zoom factor (e.g., `2.4x`), Scale Reference bar.
  - Bottom-Right: Image Quality Metric (`SNR 18.4dB — Acceptable`).
- **Floating HUD Palette**: Fixed floating ribbon pinned to the top-center of the viewport containing pan, zoom-reset, invert color, red-free filter, and AI heatmap toggle.

### 6. Edge & Rural Connectivity Pill
A persistent status component displaying local edge inference status and sync connectivity:
- **Online & Edge Ready**: Dot `#10b981`, label "EDGE ONLINE", background `#ecfdf5`, border `#a7f3d0`.
- **Offline / Queued**: Dot `#d97706`, label "OFFLINE (14 CASES QUEUED)", background `#fffbeb`, border `#fde68a`.
- **Camera Disconnected**: Dot `#dc2626`, label "FUNDUS CAM DISCONNECTED", background `#fef2f2`, border `#fecaca`.

### 7. Form Controls & Diagnostic Checkboxes
- **Inputs**: Solid white background `#ffffff`, border 1px solid `#cbd5e1`, text `#0f172a`, height `36px`. On focus: border 1px solid `#2563eb`, box-shadow `0 0 0 1px #2563eb`.
- **Checkboxes & Radios**: 16px square/circle with 1px border `#94a3b8`. Checked state fills with `#0f172a` (or `#dc2626` for urgent referral flags) with an inset white glyph.