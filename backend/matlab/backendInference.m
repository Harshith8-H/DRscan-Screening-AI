function result = backendInference(inputImage)

% =========================================================
% APTOS DIABETIC RETINOPATHY BACKEND INFERENCE
%
% Pipeline:
%
% Input Image
%     |
%     v
% Image Quality Assessment
%     |
%     v
% Fundus Preprocessing
%     |
%     +---- Preprocessed Image
%     |
%     v
% EfficientNet-B0 Prediction
%     |
%     +---- Prediction
%     +---- Probabilities
%     |
%     v
% Grad-CAM
%     |
%     +---- Heatmap
%     +---- Overlay
%     |
%     v
% Lesson Analysis
%     |
%     v
% Recommendation
%     |
%     v
% Final Result
%
% =========================================================


%% =========================================================
% 1. ADD PROJECT TO MATLAB PATH
% =========================================================

projectPath = fileparts(mfilename('fullpath'));

addpath(genpath(projectPath));


%% =========================================================
% 2. START TIMER
% =========================================================

totalTimer = tic;


%% =========================================================
% 3. LOAD EFFICIENTNET MODEL
% =========================================================

persistent trainedNet

if isempty(trainedNet)

    fprintf('\n');
    fprintf('Loading EfficientNet-B0 model...\n');

    modelPath = fullfile( ...
        projectPath, ...
        'models', ...
        'APTOS_EfficientNetB0.mat');

    if ~isfile(modelPath)

        error( ...
            'Model file not found: %s', ...
            modelPath);

    end

    modelData = load( ...
        modelPath, ...
        'trainedNet');

    if ~isfield(modelData, 'trainedNet')

        error( ...
            'Variable "trainedNet" was not found inside the MAT file.');

    end

    trainedNet = modelData.trainedNet;

    fprintf( ...
        'EfficientNet-B0 loaded successfully.\n');

end


%% =========================================================
% 4. READ INPUT IMAGE
% =========================================================

if ischar(inputImage) || isstring(inputImage)

    inputImage = char(inputImage);

    if ~isfile(inputImage)

        error( ...
            'Input image not found: %s', ...
            inputImage);

    end

    originalImage = imread(inputImage);

else

    originalImage = inputImage;

end

fprintf( ...
    'Input image loaded successfully.\n');


%% =========================================================
% 5. IMAGE QUALITY ASSESSMENT
% =========================================================

fprintf( ...
    'Assessing image quality...\n');

quality = assessImageQuality( ...
    originalImage);

fprintf( ...
    'Image quality assessment completed.\n');


%% =========================================================
% 6. PREPROCESS FUNDUS IMAGE
% =========================================================

fprintf( ...
    'Preprocessing fundus image...\n');

processedImage = preprocessFundus( ...
    originalImage);

fprintf( ...
    'Fundus preprocessing completed.\n');


%% =========================================================
% 7. DETERMINE OUTPUT DIRECTORY
% =========================================================

if ischar(inputImage) || isstring(inputImage)

    [inputDir, baseName, ~] = ...
        fileparts(char(inputImage));

else

    inputDir = fullfile( ...
        projectPath, ...
        'results');

    if ~isfolder(inputDir)

        mkdir(inputDir);

    end

    baseName = 'screening';

end


%% =========================================================
% 8. SAVE PREPROCESSED IMAGE
% =========================================================

fprintf('\n');
fprintf('Saving preprocessed image...\n');

preprocessedPath = fullfile( ...
    inputDir, ...
    [baseName '_preprocessed.png']);


% Convert to RGB if required

preprocessedImage = processedImage;

if size(preprocessedImage, 3) == 1

    preprocessedImage = cat( ...
        3, ...
        preprocessedImage, ...
        preprocessedImage, ...
        preprocessedImage);

end


% Make sure floating-point image is within [0,1]

if isfloat(preprocessedImage)

    preprocessedImage = ...
        min(max(preprocessedImage, 0), 1);

end


imwrite( ...
    preprocessedImage, ...
    preprocessedPath);


fprintf( ...
    'Preprocessed image saved:\n%s\n', ...
    preprocessedPath);


%% =========================================================
% 9. EFFICIENTNET PREDICTION
% =========================================================

fprintf( ...
    'Running EfficientNet-B0 prediction...\n');

[prediction, scores] = classify( ...
    trainedNet, ...
    processedImage);


%% =========================================================
% 10. CONVERT PREDICTION
% =========================================================

predictionString = string(prediction);


%% =========================================================
% 11. CONVERT SCORES
% =========================================================

scores = double(scores);


%% =========================================================
% 12. GET CLASS NAMES
% =========================================================

classNames = trainedNet.Layers(end).Classes;

classNames = string(classNames);


%% =========================================================
% 13. CREATE CLASS PROBABILITIES
% =========================================================

classProbabilities = struct();

for i = 1:numel(classNames)

    fieldName = char(classNames(i));

    fieldName = matlab.lang.makeValidName( ...
        fieldName);

    classProbabilities.(fieldName) = ...
        scores(i);

end


%% =========================================================
% 14. DETERMINE DR LEVEL
% =========================================================

switch char(predictionString)

    case 'No_DR'

        drLevel = 0;

        drLabel = ...
            'No DR (Grade 0)';

        referable = false;


    case 'Mild'

        drLevel = 1;

        drLabel = ...
            'Mild NPDR (Grade 1)';

        referable = false;


    case 'Moderate'

        drLevel = 2;

        drLabel = ...
            'Moderate NPDR (Grade 2)';

        referable = true;


    case 'Severe'

        drLevel = 3;

        drLabel = ...
            'Severe NPDR (Grade 3)';

        referable = true;


    case 'Proliferative_DR'

        drLevel = 4;

        drLabel = ...
            'Proliferative DR (Grade 4)';

        referable = true;


    otherwise

        drLevel = -1;

        drLabel = ...
            char(predictionString);

        referable = false;

end


%% =========================================================
% 15. MODEL CONFIDENCE
% =========================================================

confidence = max(scores);


%% =========================================================
% 16. GRAD-CAM INITIALIZATION
% =========================================================

gradcamAvailable = false;

heatmapPath = '';

annotatedPath = '';

lesionMaskPath = '';

gradcamFeatureLayer = '';


%% =========================================================
% 17. GENERATE GRAD-CAM
% =========================================================

fprintf('\n');
fprintf('Generating Grad-CAM...\n');

try

    % -----------------------------------------------------
    % Prepare network
    % -----------------------------------------------------

    if isa(trainedNet, 'dlnetwork')

        gradCamNet = trainedNet;

    else

        try

            gradCamNet = dag2dlnetwork( ...
                layerGraph(trainedNet));

        catch

            gradCamNet = dag2dlnetwork( ...
                trainedNet);

        end

    end


    % -----------------------------------------------------
    % Find predicted class index
    % -----------------------------------------------------

    classIdx = find( ...
        classNames == predictionString, ...
        1);


    if isempty(classIdx)

        error( ...
            'Predicted class was not found in network classes.');

    end


    % -----------------------------------------------------
    % Run Grad-CAM
    % -----------------------------------------------------

    scoreMap = gradCAM( ...
        gradCamNet, ...
        processedImage, ...
        classIdx);


    % -----------------------------------------------------
    % Convert score map
    % -----------------------------------------------------

    if isa(scoreMap, 'dlarray')

        scoreMap = extractdata(scoreMap);

    end

    scoreMap = gather(scoreMap);

    scoreMap = squeeze(scoreMap);


    % -----------------------------------------------------
    % Normalize score map
    % -----------------------------------------------------

    minValue = min(scoreMap(:));

    maxValue = max(scoreMap(:));


    if maxValue > minValue

        scoreMap = ...
            (scoreMap - minValue) ./ ...
            (maxValue - minValue);

    else

        scoreMap = ...
            zeros(size(scoreMap));

    end


    % -----------------------------------------------------
    % Resize heatmap
    % -----------------------------------------------------

    scoreMap = imresize( ...
        scoreMap, ...
        [size(processedImage, 1), ...
         size(processedImage, 2)]);


    % -----------------------------------------------------
    % Create output paths
    % -----------------------------------------------------

    heatmapPath = fullfile( ...
        inputDir, ...
        [baseName '_gradcam.png']);


    annotatedPath = fullfile( ...
        inputDir, ...
        [baseName '_gradcam_overlay.png']);


    % -----------------------------------------------------
    % Create heatmap
    % -----------------------------------------------------

    colorMap = jet(256);

    heatmapIndex = uint8( ...
        round(scoreMap * 255));

    heatmapIndex = ...
        min(max(heatmapIndex, 0), 255);

    heatmapIndex = ...
        heatmapIndex + 1;


    heatmapRGB = ind2rgb( ...
        heatmapIndex, ...
        colorMap);


    % -----------------------------------------------------
    % Save heatmap
    % -----------------------------------------------------

    imwrite( ...
        heatmapRGB, ...
        heatmapPath);


    % -----------------------------------------------------
    % Prepare base image
    % -----------------------------------------------------

    baseImage = im2double( ...
        processedImage);


    if size(baseImage, 3) == 1

        baseImage = cat( ...
            3, ...
            baseImage, ...
            baseImage, ...
            baseImage);

    end


    baseImage = imresize( ...
        baseImage, ...
        [size(heatmapRGB, 1), ...
         size(heatmapRGB, 2)]);


    % -----------------------------------------------------
    % Create overlay
    % -----------------------------------------------------

    overlayImage = ...
        0.55 * baseImage + ...
        0.45 * heatmapRGB;


    overlayImage = ...
        min(max(overlayImage, 0), 1);


    % -----------------------------------------------------
    % Save overlay
    % -----------------------------------------------------

    imwrite( ...
        overlayImage, ...
        annotatedPath);


    % -----------------------------------------------------
    % Grad-CAM successful
    % -----------------------------------------------------

    gradcamAvailable = true;


    fprintf( ...
        'Grad-CAM generated successfully.\n');


    fprintf( ...
        'Heatmap: %s\n', ...
        heatmapPath);


    fprintf( ...
        'Overlay: %s\n', ...
        annotatedPath);


catch gradcamError

    gradcamAvailable = false;

    heatmapPath = '';

    annotatedPath = '';


    fprintf('\n');

    fprintf( ...
        'WARNING: Grad-CAM could not be generated.\n');


    fprintf( ...
        'Reason: %s\n', ...
        gradcamError.message);

end


%% =========================================================
% 18. LESSON ANALYSIS
% =========================================================

fprintf('\n');

fprintf( ...
    'Running lesson analysis...\n');


lesson = lessonAnalysis( ...
    predictionString, ...
    scores, ...
    quality);


fprintf( ...
    'Lesson analysis completed.\n');


%% =========================================================
% 19. DETERMINE IMAGE QUALITY ACCEPTABILITY
% =========================================================

qualityAcceptable = true;


if isfield(quality, 'isAcceptable')

    qualityAcceptable = ...
        logical(quality.isAcceptable);


elseif isfield(quality, 'is_acceptable')

    qualityAcceptable = ...
        logical(quality.is_acceptable);


elseif isfield(quality, 'acceptable')

    qualityAcceptable = ...
        logical(quality.acceptable);


elseif isfield(quality, 'isGood')

    qualityAcceptable = ...
        logical(quality.isGood);


elseif isfield(quality, 'status')

    qualityStatus = lower( ...
        char(string(quality.status)));


    if strcmp(qualityStatus, 'poor')

        qualityAcceptable = false;

    else

        qualityAcceptable = true;

    end

end


%% =========================================================
% 20. INFERENCE TIME
% =========================================================

inferenceTime = toc(totalTimer);


%% =========================================================
% 21. CREATE FINAL RESULT
% =========================================================

result = struct();


%% ---------------------------------------------------------
% GENERAL
% ---------------------------------------------------------

result.success = true;

result.inference_time_ms = ...
    inferenceTime * 1000;


%% ---------------------------------------------------------
% MODEL INFORMATION
% ---------------------------------------------------------

result.model = struct();

result.model.name = ...
    'EfficientNet-B0';

result.model.version = ...
    'MATLAB';

result.model.architecture = ...
    'EfficientNet-B0';

result.model.dataset = ...
    'APTOS 2019';

result.model.input_size = ...
    '224x224x3';


%% ---------------------------------------------------------
% PREDICTION
% ---------------------------------------------------------

result.prediction = struct();

result.prediction.dr_level = ...
    drLevel;

result.prediction.label = ...
    drLabel;

result.prediction.confidence = ...
    confidence;

result.prediction.referable = ...
    referable;

result.prediction.class_probabilities = ...
    classProbabilities;


%% ---------------------------------------------------------
% QUALITY
% ---------------------------------------------------------

result.quality = ...
    quality;


%% ---------------------------------------------------------
% LESSON
% ---------------------------------------------------------

result.lesson = ...
    lesson;


%% ---------------------------------------------------------
% RAW PREDICTION
% ---------------------------------------------------------

result.raw_prediction = ...
    char(predictionString);


%% ---------------------------------------------------------
% EXPLAINABILITY
% ---------------------------------------------------------

result.explainability = struct();


result.explainability.gradcam_available = ...
    gradcamAvailable;


result.explainability.heatmap_path = ...
    heatmapPath;


result.explainability.annotated_path = ...
    annotatedPath;


result.explainability.preprocessed_path = ...
    preprocessedPath;


result.explainability.lesion_mask_path = ...
    lesionMaskPath;


result.explainability.feature_layer = ...
    gradcamFeatureLayer;


result.explainability.salient_regions = ...
    [];


%% =========================================================
% 22. RECOMMENDATION
% =========================================================

result.recommendation = struct();


if ~qualityAcceptable

    result.recommendation.action = ...
        'RECAPTURE_IMAGE';

    result.recommendation.urgency = ...
        'recapture';

    result.recommendation.reason = ...
        'Image quality is inadequate for reliable automated DR screening.';

    result.recommendation.clinical_guideline = ...
        'Reposition the patient, adjust fundus camera focus and illumination, and recapture the image.';


elseif referable

    result.recommendation.action = ...
        'REFER_TO_OPHTHALMOLOGIST';

    result.recommendation.urgency = ...
        'referral';

    result.recommendation.reason = ...
        'The model classified the image as referable diabetic retinopathy.';

    result.recommendation.clinical_guideline = ...
        'Refer the patient for professional ophthalmic evaluation.';


else

    result.recommendation.action = ...
        'ROUTINE_MONITORING';

    result.recommendation.urgency = ...
        'routine';

    result.recommendation.reason = ...
        'No referable diabetic retinopathy was detected by the model.';

    result.recommendation.clinical_guideline = ...
        'Continue appropriate eye screening and diabetes management.';

end


%% =========================================================
% 23. DISPLAY FINAL RESULT
% =========================================================

fprintf('\n');

fprintf( ...
    '============================================\n');

fprintf( ...
    '       APTOS DR INFERENCE RESULT\n');

fprintf( ...
    '============================================\n');


fprintf( ...
    'Prediction   : %s\n', ...
    drLabel);


fprintf( ...
    'Confidence   : %.2f%%\n', ...
    confidence * 100);


fprintf( ...
    'DR Level     : %d\n', ...
    drLevel);


fprintf( ...
    'Referable    : %d\n', ...
    referable);


if isfield(quality, 'overallScore')

    fprintf( ...
        'Image Quality: %.2f / 100\n', ...
        quality.overallScore);

elseif isfield(quality, 'score')

    fprintf( ...
        'Image Quality: %.2f / 100\n', ...
        quality.score);

else

    fprintf( ...
        'Image Quality: unavailable\n');

end


if isfield(quality, 'status')

    fprintf( ...
        'Quality      : %s\n', ...
        string(quality.status));

end


fprintf( ...
    'Grad-CAM     : %d\n', ...
    gradcamAvailable);


fprintf( ...
    'Preprocessed : %s\n', ...
    preprocessedPath);


fprintf( ...
    'Inference    : %.2f ms\n', ...
    inferenceTime * 1000);


fprintf( ...
    '--------------------------------------------\n');


fprintf( ...
    'Recommendation: %s\n', ...
    result.recommendation.action);


fprintf( ...
    '============================================\n');


end