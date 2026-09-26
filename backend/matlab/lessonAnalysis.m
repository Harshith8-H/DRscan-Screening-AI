function lesson = lessonAnalysis(prediction, scores, quality)

% =========================================================
% APTOS - LESSON ANALYSIS
% Converts DR prediction into structured lesson information
% =========================================================

% Class name
className = string(prediction);

% Confidence
confidence = max(scores) * 100;


%% =========================================================
% GENERAL INFORMATION
% =========================================================

lesson = struct();

lesson.predictedClass = char(className);

lesson.confidence = confidence;

lesson.imageQuality = quality.overallScore;

lesson.qualityStatus = quality.status;


%% =========================================================
% CLASS-BASED LESSON
% =========================================================

switch char(className)

    case 'No_DR'

        lesson.severity = 'No DR';

        lesson.title = ...
            'No Diabetic Retinopathy Detected';

        lesson.description = ...
            'The model classified the retinal image as showing no diabetic retinopathy.';

        lesson.lesson = ...
            'Continue regular eye examinations and maintain good diabetes management.';

        lesson.action = ...
            'Routine monitoring';


    case 'Mild'

        lesson.severity = 'Mild';

        lesson.title = ...
            'Mild Diabetic Retinopathy';

        lesson.description = ...
            'The model classified the image as mild diabetic retinopathy.';

        lesson.lesson = ...
            'Early retinal changes should be monitored through appropriate eye care follow-up.';

        lesson.action = ...
            'Monitor and follow up';


    case 'Moderate'

        lesson.severity = 'Moderate';

        lesson.title = ...
            'Moderate Diabetic Retinopathy';

        lesson.description = ...
            'The model classified the image as moderate diabetic retinopathy.';

        lesson.lesson = ...
            'The image shows changes that require attention and appropriate clinical follow-up.';

        lesson.action = ...
            'Clinical follow-up recommended';


    case 'Severe'

        lesson.severity = 'Severe';

        lesson.title = ...
            'Severe Diabetic Retinopathy';

        lesson.description = ...
            'The model classified the image as severe diabetic retinopathy.';

        lesson.lesson = ...
            'The classification indicates advanced retinal changes and requires prompt professional evaluation.';

        lesson.action = ...
            'Prompt clinical evaluation';


    case 'Proliferative_DR'

        lesson.severity = ...
            'Proliferative';

        lesson.title = ...
            'Proliferative Diabetic Retinopathy';

        lesson.description = ...
            'The model classified the image as proliferative diabetic retinopathy.';

        lesson.lesson = ...
            'This classification indicates advanced disease and requires professional ophthalmic evaluation.';

        lesson.action = ...
            'Prompt ophthalmic evaluation';


    otherwise

        lesson.severity = 'Unknown';

        lesson.title = ...
            'Unable to classify';

        lesson.description = ...
            'The model output could not be mapped to a known DR class.';

        lesson.lesson = ...
            'Review the image and model output.';

        lesson.action = ...
            'Manual review';

end


%% =========================================================
% CONFIDENCE INTERPRETATION
% =========================================================

if confidence >= 80

    lesson.confidenceLevel = 'High';

elseif confidence >= 60

    lesson.confidenceLevel = 'Moderate';

else

    lesson.confidenceLevel = 'Low';

end


%% =========================================================
% FINAL MESSAGE
% =========================================================

lesson.summary = sprintf( ...
    '%s with %.2f%% model confidence.', ...
    lesson.title, ...
    confidence);

end