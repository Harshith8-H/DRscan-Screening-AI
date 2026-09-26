try:
    import matlab
except ImportError:
    matlab = None

from app.services.efficientnet_service import EfficientNetService


class DRScreeningService:

    # =========================================================
    # IMAGE QUALITY ASSESSMENT
    # =========================================================

    @classmethod
    def assess_quality(cls, image_path):

        eng = EfficientNetService.get_engine()

        matlab_image_path = image_path.replace(
            "\\",
            "/"
        )

        print("Running image quality assessment...")
        print(image_path)

        quality = eng.feval(
            "assessImageQuality",
            matlab_image_path,
            nargout=1
        )

        print("Image quality assessment completed.")

        # -----------------------------------------------------
        # Convert MATLAB struct → Python dictionary
        # -----------------------------------------------------

        quality_result = {
            "focus_score": float(
                quality["focusScore"]
            ),

            "focus_quality": float(
                quality["focusQuality"]
            ),

            "mean_brightness": float(
                quality["meanBrightness"]
            ),

            "brightness_std": float(
                quality["brightnessStd"]
            ),

            "illumination_quality": float(
                quality["illuminationQuality"]
            ),

            "retinal_coverage": float(
                quality["retinalCoverage"]
            ),

            "field_quality": float(
                quality["fieldQuality"]
            ),

            "overall_score": float(
                quality["overallScore"]
            ),

            "status": str(
                quality["status"]
            ).replace(
                '"',
                ""
            )
        }

        return quality, quality_result

    # =========================================================
    # COMPLETE DR ANALYSIS
    # =========================================================

    @classmethod
    def analyze(cls, image_path):

        print("")
        print("=" * 60)
        print("STARTING DR SCREENING ANALYSIS")
        print("=" * 60)

        # =====================================================
        # 1. IMAGE QUALITY
        # =====================================================

        quality, quality_result = cls.assess_quality(
            image_path
        )

        print("")
        print("IMAGE QUALITY")
        print(
            "Overall Score:",
            quality_result["overall_score"]
        )

        print(
            "Status:",
            quality_result["status"]
        )

        # =====================================================
        # 2. EFFICIENTNET PREDICTION
        # =====================================================

        print("")
        print("Running EfficientNet prediction...")

        prediction_result = EfficientNetService.predict(
            image_path
        )

        print("EfficientNet prediction completed.")

        prediction = prediction_result[
            "prediction"
        ]

        probabilities = prediction_result[
            "probabilities"
        ]

        # =====================================================
        # 3. CONVERT PROBABILITIES TO MATLAB ARRAY
        # =====================================================

        scores = matlab.double([
            probabilities["No_DR"],
            probabilities["Mild"],
            probabilities["Moderate"],
            probabilities["Severe"],
            probabilities["Proliferative_DR"]
        ])

        # =====================================================
        # 4. LESSON ANALYSIS
        # =====================================================

        eng = EfficientNetService.get_engine()

        print("")
        print("Running lesson analysis...")

        lesson = eng.feval(
            "lessonAnalysis",
            prediction,
            scores,
            quality,
            nargout=1
        )

        print("Lesson analysis completed.")

        # =====================================================
        # 5. CONVERT LESSON STRUCT → PYTHON
        # =====================================================

        lesson_result = {
            "predicted_class": str(
                lesson["predictedClass"]
            ),

            "confidence": float(
                lesson["confidence"]
            ),

            "image_quality": float(
                lesson["imageQuality"]
            ),

            "quality_status": str(
                lesson["qualityStatus"]
            ).replace(
                '"',
                ""
            ),

            "severity": str(
                lesson["severity"]
            ),

            "title": str(
                lesson["title"]
            ),

            "description": str(
                lesson["description"]
            ),

            "lesson": str(
                lesson["lesson"]
            ),

            "action": str(
                lesson["action"]
            ),

            "confidence_level": str(
                lesson["confidenceLevel"]
            ),

            "summary": str(
                lesson["summary"]
            )
        }

        # =====================================================
        # 6. FINAL RESULT
        # =====================================================

        result = {

            "status": "success",

            "image_quality": quality_result,

            "prediction": {

                "class": prediction_result[
                    "prediction"
                ],

                "confidence": prediction_result[
                    "confidence"
                ],

                "probabilities": prediction_result[
                    "probabilities"
                ],

                "model": prediction_result[
                    "model"
                ],

                "input_size": prediction_result[
                    "input_size"
                ]
            },

            "lesson": lesson_result
        }

        print("")
        print("=" * 60)
        print("DR SCREENING ANALYSIS COMPLETE")
        print("=" * 60)

        return result