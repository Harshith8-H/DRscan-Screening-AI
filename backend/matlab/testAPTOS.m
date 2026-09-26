%% =========================================================
%  APTOS - TEST SINGLE FUNDUS IMAGE
%  EfficientNet-B0 + Image Quality + Grad-CAM + Lesson Analysis
% ==========================================================

clear;
clc;
close all;

fprintf('\n============================================\n');
fprintf(' APTOS DIABETIC RETINOPATHY TEST\n');
fprintf('============================================\n\n');


%% =========================================================
% 1. PROJECT PATH
% ==========================================================

projectPath = ...
    fileparts(mfilename('fullpath'));


%% =========================================================
% 2. ADD REQUIRED PATHS
% ==========================================================

addpath( ...
    fullfile(projectPath,'preprocessing'));


%% =========================================================
% 3. DEFINE PATHS
% ==========================================================

modelFile = ...
    fullfile( ...
        projectPath,...
        'models',...
        'APTOS_EfficientNetB0.mat');


dataPath = ...
    fullfile( ...
        projectPath,...
        'data',...
        'APTOS');


csvFile = ...
    fullfile( ...
        dataPath,...
        'train.csv');


imageFolder = ...
    fullfile( ...
        dataPath,...
        'train_images');


% Results folder

resultsFolder = ...
    fullfile( ...
        projectPath,...
        'results');


% Create results folder if it does not exist

if ~exist(resultsFolder,'dir')

    mkdir(resultsFolder);

end


%% =========================================================
% 4. CHECK MODEL
% ==========================================================

if ~exist(modelFile,'file')

    error( ...
        ['Trained model not found.' newline ...
         'Run trainAPTOS.m first.']);

end


%% =========================================================
% 5. LOAD MODEL
% ==========================================================

fprintf('Loading trained model...\n');

load( ...
    modelFile,...
    'trainedNet');

fprintf('Model loaded successfully.\n');


%% =========================================================
% 6. READ CSV
% ==========================================================

data = readtable(csvFile);


%% =========================================================
% 7. SELECT IMAGE
% ==========================================================

% First APTOS image

imageID = ...
    string(data.id_code(1));


actualDiagnosis = ...
    data.diagnosis(1);


imageFile = ...
    fullfile( ...
        imageFolder,...
        char(imageID + ".png"));


if ~exist(imageFile,'file')

    error( ...
        'Image not found:\n%s',...
        imageFile);

end


fprintf('\nTesting image: %s\n',imageID);


%% =========================================================
% 8. READ ORIGINAL IMAGE
% ==========================================================

originalImage = ...
    imread(imageFile);


%% =========================================================
% 9. IMAGE QUALITY ASSESSMENT
% ==========================================================

fprintf('\nRunning image quality assessment...\n');

quality = ...
    assessImageQuality(originalImage);


%% =========================================================
% 10. PREPROCESS IMAGE
% ==========================================================

fprintf('Preprocessing fundus image...\n');

processedImage = ...
    preprocessFundus(originalImage);


%% =========================================================
% 11. PREDICTION
% ==========================================================

fprintf('\nRunning EfficientNet-B0 prediction...\n');


prediction = ...
    classify( ...
        trainedNet,...
        processedImage);


scores = ...
    predict( ...
        trainedNet,...
        processedImage);


% Convert scores into row vector

scores = squeeze(scores);


%% =========================================================
% 12. CLASS NAMES
% ==========================================================

classNames = ...
    categories(prediction);


fprintf('\nPrediction completed.\n');


%% =========================================================
% 13. FIND PREDICTED CLASS INDEX
% ==========================================================

networkClasses = ...
    trainedNet.Layers(end).Classes;


predictedClassIndex = ...
    find(networkClasses == prediction,1);


fprintf( ...
    'Predicted class index: %d\n',...
    predictedClassIndex);


%% =========================================================
% 14. DISPLAY PREDICTION RESULTS
% ==========================================================

fprintf('\n============================================\n');
fprintf(' APTOS PREDICTION RESULT\n');
fprintf('============================================\n');


fprintf( ...
    'Image ID         : %s\n',...
    imageID);


fprintf( ...
    'Actual Diagnosis : %d\n',...
    actualDiagnosis);


fprintf( ...
    'Predicted Class  : %s\n',...
    string(prediction));


fprintf('\nClass probabilities:\n');


for i = 1:numel(networkClasses)

    fprintf( ...
        '%-20s : %.2f%%\n',...
        string(networkClasses(i)),...
        scores(i) * 100);

end


%% =========================================================
% 15. QUALITY RESULTS
% ==========================================================

fprintf('\n============================================\n');
fprintf(' IMAGE QUALITY ASSESSMENT\n');
fprintf('============================================\n');


fprintf( ...
    'Focus Quality        : %.2f / 100\n',...
    quality.focusQuality);


fprintf( ...
    'Illumination Quality : %.2f / 100\n',...
    quality.illuminationQuality);


fprintf( ...
    'Field of View        : %.2f / 100\n',...
    quality.fieldQuality);


fprintf( ...
    'Overall Quality      : %.2f / 100\n',...
    quality.overallScore);


fprintf( ...
    'Quality Status       : %s\n',...
    quality.status);


%% =========================================================
% 16. GRAD-CAM NETWORK
% ==========================================================

fprintf('\n============================================\n');
fprintf(' GRAD-CAM ANALYSIS\n');
fprintf('============================================\n');


fprintf('Converting network for Grad-CAM...\n');


netGradCAM = ...
    dag2dlnetwork(trainedNet);


%% =========================================================
% 17. GRAD-CAM TARGET LAYER
% ==========================================================

% Final convolutional layer before the EfficientNet head

targetLayer = ...
    'efficientnet-b0|model|blocks_15|conv2d_1|Conv2D';


fprintf( ...
    'Grad-CAM target layer:\n%s\n',...
    targetLayer);


%% =========================================================
% 18. COMPUTE GRAD-CAM
% ==========================================================

fprintf('Computing Grad-CAM...\n');


try

    scoreMap = ...
        gradCAM( ...
            netGradCAM,...
            processedImage,...
            predictedClassIndex,...
            'FeatureLayer',targetLayer,...
            'ReductionLayer','Softmax');


catch ME

    fprintf('\nGrad-CAM failed with selected layer.\n');

    fprintf( ...
        'Error: %s\n',...
        ME.message);

    fprintf( ...
        '\nTrying automatic feature layer selection...\n');


    scoreMap = ...
        gradCAM( ...
            netGradCAM,...
            processedImage,...
            predictedClassIndex,...
            'ReductionLayer','Softmax');

end


%% =========================================================
% 19. CONVERT GRAD-CAM MAP
% ==========================================================

scoreMap = ...
    gather(scoreMap);


scoreMap = ...
    squeeze(scoreMap);


% Resize heatmap to original image size

scoreMap = ...
    imresize( ...
        scoreMap,...
        [size(originalImage,1),...
         size(originalImage,2)]);


% Normalize Grad-CAM

scoreMap = ...
    scoreMap - min(scoreMap(:));


if max(scoreMap(:)) > 0

    scoreMap = ...
        scoreMap ./ max(scoreMap(:));

end


fprintf('Grad-CAM completed successfully.\n');


%% =========================================================
% 20. GRAD-CAM DISPLAY
% ==========================================================

figure( ...
    'Name',...
    'Grad-CAM',...
    'Color','w');


imshow(originalImage);

hold on;


imagesc( ...
    scoreMap,...
    'AlphaData',0.45);


colormap jet;

colorbar;

caxis([0 1]);


title( ...
    sprintf( ...
        'Grad-CAM - %s',...
        string(prediction)),...
    'FontSize',16,...
    'FontWeight','bold');


hold off;


%% =========================================================
% 21. SAVE GRAD-CAM IMAGE
% ==========================================================

gradCAMFile = ...
    fullfile( ...
        resultsFolder,...
        char(imageID + "_GradCAM.png"));


exportgraphics( ...
    gcf,...
    gradCAMFile,...
    'Resolution',150);


fprintf( ...
    'Grad-CAM saved:\n%s\n',...
    gradCAMFile);


%% =========================================================
% 22. LESSON ANALYSIS
% ==========================================================

fprintf('\n============================================\n');
fprintf(' LESSON ANALYSIS\n');
fprintf('============================================\n');


fprintf('Running lesson analysis...\n');


% IMPORTANT:
% lessonAnalysis is a FUNCTION.
% Do NOT use run(lessonScript).

lesson = ...
    lessonAnalysis( ...
        prediction,...
        scores,...
        quality);


%% =========================================================
% 23. DISPLAY LESSON INFORMATION
% ==========================================================

fprintf('\n--------------------------------------------\n');
fprintf(' LESSON INFORMATION\n');
fprintf('--------------------------------------------\n');


fprintf( ...
    'Severity           : %s\n',...
    lesson.severity);


fprintf( ...
    'Title              : %s\n',...
    lesson.title);


fprintf( ...
    'Confidence         : %.2f%%\n',...
    lesson.confidence);


fprintf( ...
    'Confidence Level   : %s\n',...
    lesson.confidenceLevel);


fprintf( ...
    'Image Quality      : %.2f / 100\n',...
    lesson.imageQuality);


fprintf( ...
    'Quality Status     : %s\n',...
    lesson.qualityStatus);


fprintf( ...
    'Description        : %s\n',...
    lesson.description);


fprintf( ...
    'Lesson             : %s\n',...
    lesson.lesson);


fprintf( ...
    'Recommended Action : %s\n',...
    lesson.action);


fprintf( ...
    'Summary            : %s\n',...
    lesson.summary);


%% =========================================================
% 24. ORIGINAL IMAGE
% ==========================================================

figure( ...
    'Name',...
    'APTOS Fundus Image',...
    'Color','w');


imshow(originalImage);


title( ...
    sprintf( ...
        'APTOS Fundus Image - Predicted: %s',...
        string(prediction)),...
    'FontSize',16);


%% =========================================================
% 25. PREPROCESSED IMAGE
% ==========================================================

figure( ...
    'Name',...
    'Preprocessed Fundus Image',...
    'Color','w');


imshow(processedImage);


title( ...
    'Preprocessed Fundus Image',...
    'FontSize',16);


%% =========================================================
% 26. PROBABILITY BAR CHART
% ==========================================================

figure( ...
    'Name',...
    'DR Classification Probabilities',...
    'Color','w');


bar(scores);


xticks(1:numel(networkClasses));


xticklabels( ...
    string(networkClasses));


xtickangle(30);


ylabel('Probability');


ylim([0 1]);


title( ...
    'EfficientNet-B0 DR Classification');


grid on;


%% =========================================================
% 27. QUALITY BAR CHART
% ==========================================================

figure( ...
    'Name',...
    'Fundus Image Quality',...
    'Color','w');


qualityScores = [ ...
    quality.focusQuality,...
    quality.illuminationQuality,...
    quality.fieldQuality];


bar(qualityScores);


xticks(1:3);


xticklabels({ ...
    'Focus',...
    'Illumination',...
    'Field of View'});


ylabel('Quality Score');


ylim([0 100]);


title( ...
    sprintf( ...
        'Fundus Image Quality - Overall %.2f',...
        quality.overallScore));


grid on;


%% =========================================================
% 28. COMBINED APTOS ANALYSIS
% ==========================================================

figure( ...
    'Name',...
    'APTOS DR Analysis',...
    'Color','w',...
    'Position',[100 100 1400 600]);


% ---------------------------------------------------------
% Original image
% ---------------------------------------------------------

subplot(1,3,1);


imshow(originalImage);


title( ...
    'Original Fundus',...
    'FontSize',14,...
    'FontWeight','bold');


% ---------------------------------------------------------
% Preprocessed image
% ---------------------------------------------------------

subplot(1,3,2);


imshow(processedImage);


title( ...
    'Preprocessed Image',...
    'FontSize',14,...
    'FontWeight','bold');


% ---------------------------------------------------------
% Grad-CAM
% ---------------------------------------------------------

subplot(1,3,3);


imshow(originalImage);

hold on;


imagesc( ...
    scoreMap,...
    'AlphaData',0.45);


colormap jet;

caxis([0 1]);


title( ...
    sprintf( ...
        'Grad-CAM - %s',...
        string(prediction)),...
    'FontSize',14,...
    'FontWeight','bold');


hold off;


sgtitle( ...
    sprintf( ...
        'APTOS Diabetic Retinopathy Analysis - %s',...
        string(prediction)),...
    'FontSize',18,...
    'FontWeight','bold');


%% =========================================================
% 29. SAVE COMBINED ANALYSIS
% ==========================================================

combinedFile = ...
    fullfile( ...
        resultsFolder,...
        char(imageID + "_APTOS_Analysis.png"));


exportgraphics( ...
    gcf,...
    combinedFile,...
    'Resolution',150);


fprintf( ...
    '\nCombined analysis saved:\n%s\n',...
    combinedFile);


%% =========================================================
% 30. SAVE PREPROCESSED IMAGE
% ==========================================================

preprocessedFile = ...
    fullfile( ...
        resultsFolder,...
        char(imageID + "_Preprocessed.png"));


imwrite( ...
    processedImage,...
    preprocessedFile);


%% =========================================================
% 31. SAVE ALL RESULTS
% ==========================================================

resultsFile = ...
    fullfile( ...
        resultsFolder,...
        char(imageID + "_results.mat"));


% Store everything required for later integration

results = struct();


results.imageID = ...
    char(imageID);


results.imageFile = ...
    imageFile;


results.actualDiagnosis = ...
    actualDiagnosis;


results.prediction = ...
    prediction;


results.scores = ...
    scores;


results.classNames = ...
    networkClasses;


results.predictedClassIndex = ...
    predictedClassIndex;


results.quality = ...
    quality;


results.lesson = ...
    lesson;


results.gradCAM = ...
    scoreMap;


results.gradCAMTargetLayer = ...
    targetLayer;


results.originalImage = ...
    originalImage;


results.processedImage = ...
    processedImage;


results.gradCAMFile = ...
    gradCAMFile;


results.combinedFile = ...
    combinedFile;


save( ...
    resultsFile,...
    'results',...
    '-v7.3');


fprintf( ...
    'Results saved:\n%s\n',...
    resultsFile);


%% =========================================================
% 32. FINAL SUMMARY
% ==========================================================

fprintf('\n============================================\n');
fprintf(' FINAL APTOS ANALYSIS\n');
fprintf('============================================\n');


fprintf( ...
    'Image              : %s\n',...
    imageID);


fprintf( ...
    'Prediction         : %s\n',...
    string(prediction));


fprintf( ...
    'Confidence         : %.2f%%\n',...
    lesson.confidence);


fprintf( ...
    'Confidence Level   : %s\n',...
    lesson.confidenceLevel);


fprintf( ...
    'Image Quality      : %.2f / 100\n',...
    quality.overallScore);


fprintf( ...
    'Quality Status     : %s\n',...
    quality.status);


fprintf( ...
    'Severity           : %s\n',...
    lesson.severity);


fprintf( ...
    'Action             : %s\n',...
    lesson.action);


fprintf('\n============================================\n');
fprintf(' TEST COMPLETED SUCCESSFULLY\n');
fprintf('============================================\n\n');