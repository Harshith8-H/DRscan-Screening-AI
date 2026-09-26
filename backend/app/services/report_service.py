from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    HRFlowable,
)
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.lib.units import inch

from app.core.config import settings
from app.schemas.screening import ScreeningDetailResponse
from app.core.logging import logger


class ReportService:

    @staticmethod
    def _safe_image(
        path: Path,
        width: float,
        height: float,
        fallback_style,
    ):
        if not path or not path.exists():
            return Paragraph(
                "Image missing",
                fallback_style,
            )

        try:
            return RLImage(
                str(path),
                width=width,
                height=height,
                preserveAspectRatio=True,
                anchor="c",
            )
        except Exception:
            return Paragraph(
                "Image unavailable",
                fallback_style,
            )

    @staticmethod
    def _upload_file_path(
        url: str | None,
    ) -> Path | None:

        if not url:
            return None

        filename = Path(url).name
        path = settings.UPLOAD_DIR / filename

        return path if path.exists() else None

    @staticmethod
    def generate_pdf_report(
        detail: ScreeningDetailResponse,
    ) -> str:

        screening = detail.screening
        patient = detail.patient
        inference = detail.inference
        review = detail.doctor_review

        screening_id = screening.screening_id

        screening_results_dir = (
            settings.RESULTS_DIR / screening_id
        )
        screening_results_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        pdf_filename = (
            f"{screening_id}_report.pdf"
        )

        pdf_filepath = (
            screening_results_dir
            / pdf_filename
        )

        doc = SimpleDocTemplate(
            str(pdf_filepath),
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f766e"),
            fontName="Helvetica-Bold",
            alignment=1,
        )

        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
            alignment=1,
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0f766e"),
            fontName="Helvetica-Bold",
            spaceBefore=8,
            spaceAfter=4,
        )

        cell_label = ParagraphStyle(
            "CellLabel",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#334155"),
        )

        cell_value = ParagraphStyle(
            "CellValue",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a"),
        )

        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Italic"],
            fontSize=7,
            leading=9,
            textColor=colors.HexColor("#64748b"),
            alignment=1,
        )

        elements = []

        # ---------------------------------------------------------
        # HEADER
        # ---------------------------------------------------------
        elements.append(
            Paragraph(
                "NATIONAL RURAL TELE-OPHTHALMOLOGY NETWORK",
                title_style,
            )
        )

        elements.append(
            Paragraph(
                "AI-Assisted Diabetic Retinopathy "
                "Screening & Triage Report (SIH26038)",
                subtitle_style,
            )
        )

        elements.append(Spacer(1, 8))

        elements.append(
            HRFlowable(
                width="100%",
                thickness=1.5,
                color=colors.HexColor("#0f766e"),
                spaceAfter=8,
            )
        )

        # ---------------------------------------------------------
        # PATIENT / SCREENING
        # ---------------------------------------------------------
        data_patient = [
            [
                Paragraph("<b>Patient Name:</b>", cell_label),
                Paragraph(
                    patient.name or "N/A",
                    cell_value,
                ),
                Paragraph("<b>Screening ID:</b>", cell_label),
                Paragraph(
                    screening_id,
                    cell_value,
                ),
            ],
            [
                Paragraph("<b>Patient Code:</b>", cell_label),
                Paragraph(
                    patient.patient_code or "N/A",
                    cell_value,
                ),
                Paragraph("<b>Date of Screening:</b>", cell_label),
                Paragraph(
                    screening.created_at.strftime(
                        "%d %b %Y, %H:%M"
                    ),
                    cell_value,
                ),
            ],
            [
                Paragraph("<b>Age / Sex:</b>", cell_label),
                Paragraph(
                    f"{patient.age} yrs / {patient.sex}",
                    cell_value,
                ),
                Paragraph("<b>Eye Evaluated:</b>", cell_label),
                Paragraph(
                    f"{screening.eye_side} RETINA",
                    cell_value,
                ),
            ],
            [
                Paragraph("<b>PHC / Village:</b>", cell_label),
                Paragraph(
                    patient.village_or_phc
                    or "Rural Primary Health Centre",
                    cell_value,
                ),
                Paragraph("<b>Diabetes Duration:</b>", cell_label),
                Paragraph(
                    f"{patient.diabetes_duration_years or 'N/A'} years",
                    cell_value,
                ),
            ],
        ]

        t_patient = Table(
            data_patient,
            colWidths=[
                1.3 * inch,
                2.2 * inch,
                1.4 * inch,
                2.3 * inch,
            ],
        )

        t_patient.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#f8fafc"),
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ])
        )

        elements.append(t_patient)
        elements.append(Spacer(1, 10))

        # ---------------------------------------------------------
        # AI SUMMARY
        # ---------------------------------------------------------
        if inference:

            dr_color = (
                colors.HexColor("#dc2626")
                if inference.prediction.referable
                else colors.HexColor("#16a34a")
            )

            referral_badge = (
                "REFERRAL RECOMMENDED"
                if inference.prediction.referable
                else "NON-REFERABLE (MONITOR)"
            )

            ai_summary_data = [
                [
                    Paragraph(
                        f"<b>AI Predicted DR Severity:</b> "
                        f"{inference.prediction.label.upper()}",
                        ParagraphStyle(
                            "DRLabel",
                            parent=cell_label,
                            fontSize=10,
                            textColor=dr_color,
                        ),
                    ),
                    Paragraph(
                        f"<b>Triage Decision:</b> "
                        f"{referral_badge}",
                        ParagraphStyle(
                            "Triage",
                            parent=cell_label,
                            fontSize=10,
                            textColor=dr_color,
                        ),
                    ),
                ],
                [
                    Paragraph(
                        f"<b>Model Confidence:</b> "
                        f"{int(inference.prediction.confidence * 100)}% "
                        f"| <b>Inference Time:</b> "
                        f"{inference.inference_time_ms:.1f} ms",
                        cell_value,
                    ),
                    Paragraph(
                        f"<b>Image Quality:</b> "
                        f"{inference.quality.status.upper()} "
                        f"(Score: "
                        f"{int(inference.quality.score * 100)}%)",
                        cell_value,
                    ),
                ],
            ]

            t_ai = Table(
                ai_summary_data,
                colWidths=[
                    3.6 * inch,
                    3.6 * inch,
                ],
            )

            t_ai.setStyle(
                TableStyle([
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor("#f1f5f9"),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        1.5,
                        dr_color,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ])
            )

            elements.append(t_ai)
            elements.append(Spacer(1, 10))

            # -----------------------------------------------------
            # VISUAL EVIDENCE
            #
            # 1. Original
            # 2. MATLAB preprocessed
            # 3. MATLAB Grad-CAM overlay
            # 4. MATLAB detections/annotated view
            #
            # The last two intentionally use the same real
            # MATLAB overlay because MATLAB currently generates
            # one overlay file, not a separate detection image.
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "EXPLAINABLE AI MULTI-MODAL VISUAL EVIDENCE",
                    section_heading,
                )
            )

            orig_path = (
                settings.BASE_DIR
                / screening.original_image_url.lstrip("/")
            )

            preprocessed_path = (
                ReportService._upload_file_path(
                    inference.explainability.preprocessed_url
                )
            )

            gradcam_path = (
                ReportService._upload_file_path(
                    inference.explainability.heatmap_url
                )
            )

            detection_path = (
                ReportService._upload_file_path(
                    inference.explainability.annotated_url
                )
            )

            if detection_path is None:
                detection_path = gradcam_path

            img_w = 1.65 * inch
            img_h = 1.65 * inch

            img_row = [
                ReportService._safe_image(
                    orig_path,
                    img_w,
                    img_h,
                    cell_value,
                ),
                ReportService._safe_image(
                    preprocessed_path,
                    img_w,
                    img_h,
                    cell_value,
                ),
                ReportService._safe_image(
                    gradcam_path,
                    img_w,
                    img_h,
                    cell_value,
                ),
                ReportService._safe_image(
                    detection_path,
                    img_w,
                    img_h,
                    cell_value,
                ),
            ]

            caption_row = [
                Paragraph(
                    "<b>1. Original Fundus</b>",
                    cell_label,
                ),
                Paragraph(
                    "<b>2. MATLAB Preprocessed</b>",
                    cell_label,
                ),
                Paragraph(
                    "<b>3. MATLAB Grad-CAM Overlay</b>",
                    cell_label,
                ),
                Paragraph(
                    "<b>4. Detection / Evidence View</b>",
                    cell_label,
                ),
            ]

            t_images = Table(
                [
                    img_row,
                    caption_row,
                ],
                colWidths=[
                    1.8 * inch,
                    1.8 * inch,
                    1.8 * inch,
                    1.8 * inch,
                ],
            )

            t_images.setStyle(
                TableStyle([
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),
                ])
            )

            elements.append(t_images)
            elements.append(Spacer(1, 8))

            # -----------------------------------------------------
            # LESIONS
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "QUANTIFIED RETINAL LESION COUNT & BIOMARKERS",
                    section_heading,
                )
            )

            lesions_data = [
                [
                    Paragraph(
                        "<b>Microaneurysms:</b>",
                        cell_label,
                    ),
                    Paragraph(
                        str(
                            inference.lesions.microaneurysms
                        ),
                        cell_value,
                    ),
                    Paragraph(
                        "<b>Hard Exudates:</b>",
                        cell_label,
                    ),
                    Paragraph(
                        str(
                            inference.lesions.exudates
                        ),
                        cell_value,
                    ),
                ],
                [
                    Paragraph(
                        "<b>Hemorrhages:</b>",
                        cell_label,
                    ),
                    Paragraph(
                        str(
                            inference.lesions.hemorrhages
                        ),
                        cell_value,
                    ),
                    Paragraph(
                        "<b>Cotton Wool Spots:</b>",
                        cell_label,
                    ),
                    Paragraph(
                        str(
                            inference.lesions.cotton_wool_spots
                        ),
                        cell_value,
                    ),
                ],
                [
                    Paragraph(
                        "<b>Foveal Threat:</b>",
                        cell_label,
                    ),
                    Paragraph(
                        (
                            "POSSIBLE EDEMA THREAT"
                            if inference.lesions.foveal_involvement
                            else "No Macular Involvement"
                        ),
                        cell_value,
                    ),
                    Paragraph(
                        "<b>Clinical Urgency:</b>",
                        cell_label,
                    ),
                    Paragraph(
                        inference.recommendation.urgency.upper(),
                        cell_value,
                    ),
                ],
            ]

            t_lesions = Table(
                lesions_data,
                colWidths=[
                    1.8 * inch,
                    1.8 * inch,
                    1.8 * inch,
                    1.8 * inch,
                ],
            )

            t_lesions.setStyle(
                TableStyle([
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.HexColor("#cbd5e1"),
                    ),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor("#f8fafc"),
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ])
            )

            elements.append(t_lesions)
            elements.append(Spacer(1, 8))

            # -----------------------------------------------------
            # RECOMMENDATION
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "CLINICAL RECOMMENDATION & CARE PROTOCOL",
                    section_heading,
                )
            )

            rec_data = [
                [
                    Paragraph(
                        f"<b>Action:</b> "
                        f"{inference.recommendation.action.replace('_', ' ')}",
                        cell_label,
                    )
                ],
                [
                    Paragraph(
                        f"<b>Rationale:</b> "
                        f"{inference.recommendation.reason}",
                        cell_value,
                    )
                ],
                [
                    Paragraph(
                        f"<b>Guideline Protocol:</b> "
                        f"{inference.recommendation.clinical_guideline or 'Refer to local clinical guidance.'}",
                        cell_value,
                    )
                ],
            ]

            t_rec = Table(
                rec_data,
                colWidths=[7.2 * inch],
            )

            t_rec.setStyle(
                TableStyle([
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor("#f0fdfa"),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        1,
                        colors.HexColor("#0f766e"),
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),
                ])
            )

            elements.append(t_rec)
            elements.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # DOCTOR REVIEW
        # ---------------------------------------------------------
        elements.append(
            Paragraph(
                "OPHTHALMOLOGIST TELE-CONSULT REVIEW & SIGN-OFF",
                section_heading,
            )
        )

        if review:
            review_data = [
                [
                    Paragraph(
                        f"<b>Reviewing Specialist:</b> "
                        f"{review.doctor_name}",
                        cell_label,
                    ),
                    Paragraph(
                        f"<b>Review Status:</b> "
                        f"{review.decision}",
                        cell_label,
                    ),
                ],
                [
                    Paragraph(
                        f"<b>Final Clinical Grade:</b> "
                        f"Grade {review.final_dr_level if review.final_dr_level is not None else (inference.prediction.dr_level if inference else 'N/A')}",
                        cell_value,
                    ),
                    Paragraph(
                        f"<b>Timestamp:</b> "
                        f"{review.reviewed_at.strftime('%d %b %Y, %H:%M')}",
                        cell_value,
                    ),
                ],
                [
                    Paragraph(
                        f"<b>Specialist Notes:</b> "
                        f"{review.clinical_notes or 'Diagnosis concurred with AI screening evidence.'}",
                        cell_value,
                    ),
                    Paragraph(
                        f"<b>Referral Center:</b> "
                        f"{review.referral_facility or 'District Hospital'}",
                        cell_value,
                    ),
                ],
            ]
        else:
            review_data = [
                [
                    Paragraph(
                        "<b>Status:</b> "
                        "PENDING SPECIALIST OPHTHALMOLOGIST REVIEW",
                        ParagraphStyle(
                            "Pend",
                            parent=cell_label,
                            textColor=colors.HexColor("#d97706"),
                        ),
                    ),
                    Paragraph(
                        "<b>Queue:</b> District Hospital Tele-Review Pool",
                        cell_value,
                    ),
                ],
                [
                    Paragraph(
                        "Specialist digital signature will appear upon formal tele-consult sign-off.",
                        cell_value,
                    ),
                    Paragraph(
                        "________________________________________<br/>"
                        "Doctor Signature & Stamp",
                        cell_label,
                    ),
                ],
            ]

        t_review = Table(
            review_data,
            colWidths=[
                3.6 * inch,
                3.6 * inch,
            ],
        )

        t_review.setStyle(
            TableStyle([
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#fafafa"),
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ])
        )

        elements.append(t_review)
        elements.append(Spacer(1, 10))

        elements.append(
            HRFlowable(
                width="100%",
                thickness=0.5,
                color=colors.HexColor("#94a3b8"),
                spaceAfter=4,
            )
        )

        elements.append(
            Paragraph(
                "DISCLAIMER: This document represents an AI-assisted "
                "screening assessment intended for triage in primary "
                "and rural healthcare settings. It does not constitute "
                "a standalone definitive medical diagnosis. Definitive "
                "clinical management must be verified by a licensed "
                "ophthalmologist.",
                disclaimer_style,
            )
        )

        doc.build(elements)

        logger.info(
            f"Generated PDF screening report: {pdf_filepath}"
        )

        return (
            f"/results/{screening_id}/{pdf_filename}"
        )
