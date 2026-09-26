%% =========================================================
% APTOS DIABETIC RETINOPATHY
% EfficientNet-B0 Training Pipeline
% CPU VERSION
% ==========================================================

clear;
clc;
close all;

fprintf('\n');
fprintf('============================================\n');
fprintf(' APTOS DIABETIC RETINOPATHY TRAINING\n');
fprintf('============================================\n\n');


%% =========================================================
% 1. PROJECT PATH
% ==========================================================

classificationPath = ...
    fileparts(mfilename('fullpath'));

projectPath = ...
    fileparts(classificationPath);


%% =========================================================
% 2. ADD REQUIRED FOLDERS
% ==========================================================

addpath( ...
    fullfile(projectPath, 'preprocessing'));

addpath( ...
    fullfile(projectPath, 'classification'));


%% =========================================================
% 3. DEFINE PATHS
% ==========================================================

dataPath = ...
    fullfile(projectPath, 'data', 'APTOS');

csvFile = ...
    fullfile(dataPath, 'train.csv');

imageFolder = ...
    fullfile(dataPath, 'train_images');

modelsFolder = ...
    fullfile(projectPath, 'models');

evaluationFolder = ...
    fullfile(projectPath, 'evaluation');

resultsFolder = ...
    fullfile(projectPath, 'results');


%% =========================================================
% 4. CREATE OUTPUT FOLDERS
% ==========================================================

if ~exist(modelsFolder, 'dir')
    mkdir(modelsFolder);
end

if ~exist(evaluationFolder, 'dir')
    mkdir(evaluationFolder);
end

if ~exist(resultsFolder, 'dir')
    mkdir(resultsFolder);
end


%% =========================================================
% 5. CHECK DATASET
% ==========================================================

fprintf('Checking dataset...\n');

if ~exist(csvFile, 'file')

    error( ...
        'train.csv not found:\n%s', ...
        csvFile);

end

if ~exist(imageFolder, 'dir')

    error( ...
        'train_images folder not found:\n%s', ...
        imageFolder);

end

fprintf('CSV found.\n');
fprintf('Image folder found.\n');


%% =========================================================
% 6. READ CSV
% ==========================================================

fprintf('\nReading train.csv...\n');

data = readtable(csvFile);

fprintf( ...
    'Number of records: %d\n', ...
    height(data));

fprintf('\nCSV columns:\n');

disp(data.Properties.VariableNames);


%% =========================================================
% 7. CREATE IMAGE FILE LIST
% ==========================================================

fprintf('\nCreating image file list...\n');

numImages = height(data);

imageFiles = strings(numImages, 1);

valid = false(numImages, 1);


for i = 1:numImages

    imageID = string(data.id_code(i));

    fileName = imageID + ".png";

    filePath = ...
        fullfile(imageFolder, char(fileName));


    if exist(filePath, 'file')

        imageFiles(i) = ...
            string(filePath);

        valid(i) = true;

    end

end


%% =========================================================
% 8. REMOVE MISSING IMAGES
% ==========================================================

imageFiles = ...
    imageFiles(valid);

labels = ...
    data.diagnosis(valid);


fprintf( ...
    'Images found: %d\n', ...
    numel(imageFiles));


%% =========================================================
% 9. CONVERT LABELS
% ==========================================================

labels = categorical( ...
    labels, ...
    [0 1 2 3 4], ...
    { ...
    'No_DR', ...
    'Mild', ...
    'Moderate', ...
    'Severe', ...
    'Proliferative_DR' ...
    });


fprintf('\nClass distribution:\n');

disp(countcats(labels));

disp(categories(labels));


%% =========================================================
% 10. CREATE IMAGE DATASTORE
% ==========================================================

fprintf('\nCreating image datastore...\n');

imds = imageDatastore( ...
    cellstr(imageFiles), ...
    'Labels', labels);


%% IMPORTANT
% preprocessFundus reads the image filename,
% performs preprocessing,
% and returns 224 x 224 x 3 image.

imds.ReadFcn = @preprocessFundus;


fprintf('Datastore created.\n');


%% =========================================================
% 11. TRAIN / VALIDATION / TEST SPLIT
% ==========================================================

fprintf('\nSplitting dataset...\n');


% 70% Training
[imdsTrain, imdsTemp] = ...
    splitEachLabel( ...
        imds, ...
        0.70, ...
        'randomized');


% 15% Validation
% 15% Testing

[imdsValidation, imdsTest] = ...
    splitEachLabel( ...
        imdsTemp, ...
        0.50, ...
        'randomized');


fprintf('\nDataset split:\n');

fprintf( ...
    'Training images   : %d\n', ...
    numel(imdsTrain.Files));

fprintf( ...
    'Validation images : %d\n', ...
    numel(imdsValidation.Files));

fprintf( ...
    'Test images       : %d\n', ...
    numel(imdsTest.Files));


%% =========================================================
% 12. CLASS DISTRIBUTION
% ==========================================================

fprintf('\nTraining class distribution:\n');

disp(countEachLabel(imdsTrain));


fprintf('\nValidation class distribution:\n');

disp(countEachLabel(imdsValidation));


fprintf('\nTest class distribution:\n');

disp(countEachLabel(imdsTest));


%% =========================================================
% 13. DATA AUGMENTATION
% ==========================================================

fprintf('\nCreating data augmentation...\n');

augmenter = imageDataAugmenter( ...
    'RandRotation', [-10 10], ...
    'RandXReflection', true, ...
    'RandXTranslation', [-10 10], ...
    'RandYTranslation', [-10 10], ...
    'RandScale', [0.90 1.10]);


%% =========================================================
% 14. AUGMENTED DATASTORES
% ==========================================================

inputSize = [224 224 3];


augimdsTrain = ...
    augmentedImageDatastore( ...
        inputSize, ...
        imdsTrain, ...
        'DataAugmentation', augmenter);


augimdsValidation = ...
    augmentedImageDatastore( ...
        inputSize, ...
        imdsValidation);


augimdsTest = ...
    augmentedImageDatastore( ...
        inputSize, ...
        imdsTest);


%% =========================================================
% 15. LOAD EFFICIENTNET-B0
% ==========================================================

fprintf('\nLoading EfficientNet-B0...\n');

net = efficientnetb0;

fprintf('EfficientNet-B0 loaded.\n');


%% =========================================================
% 16. CREATE LAYER GRAPH
% ==========================================================

lgraph = layerGraph(net);

layers = lgraph.Layers;


%% =========================================================
% 17. FIND FINAL FULLY CONNECTED LAYER
% ==========================================================

fcIndex = [];


for i = numel(layers):-1:1

    if isa( ...
            layers(i), ...
            'nnet.cnn.layer.FullyConnectedLayer')

        fcIndex = i;

        break;

    end

end


if isempty(fcIndex)

    error( ...
        'Could not find final fully connected layer.');

end


oldFC = layers(fcIndex);


fprintf('\nReplacing final fully connected layer:\n');

fprintf( ...
    'Old layer: %s\n', ...
    oldFC.Name);


%% =========================================================
% 18. CREATE NEW 5-CLASS LAYER
% ==========================================================

numClasses = 5;


newFC = fullyConnectedLayer( ...
    numClasses, ...
    'Name', 'APTOS_fc', ...
    'WeightLearnRateFactor', 10, ...
    'BiasLearnRateFactor', 10);


lgraph = replaceLayer( ...
    lgraph, ...
    oldFC.Name, ...
    newFC);


%% =========================================================
% 19. FIND CLASSIFICATION OUTPUT LAYER
% ==========================================================

layers = lgraph.Layers;

classIndex = [];


for i = numel(layers):-1:1

    if isa( ...
            layers(i), ...
            'nnet.cnn.layer.ClassificationOutputLayer')

        classIndex = i;

        break;

    end

end


if isempty(classIndex)

    error( ...
        'Could not find classification output layer.');

end


oldClassLayer = ...
    layers(classIndex);


fprintf( ...
    'Old classification layer: %s\n', ...
    oldClassLayer.Name);


%% =========================================================
% 20. CLASS WEIGHTS
% ==========================================================

trainLabels = ...
    imdsTrain.Labels;


classCounts = ...
    countcats(trainLabels);


classWeights = ...
    sum(classCounts) ./ ...
    (numClasses .* classCounts);


%% =========================================================
% 21. NEW CLASSIFICATION LAYER
% ==========================================================

newClassLayer = ...
    classificationLayer( ...
        'Name', 'APTOS_output', ...
        'Classes', categories(trainLabels), ...
        'ClassWeights', classWeights);


lgraph = replaceLayer( ...
    lgraph, ...
    oldClassLayer.Name, ...
    newClassLayer);


fprintf( ...
    '\nNetwork modified for APTOS classification.\n');


%% =========================================================
% 22. TRAINING OPTIONS
% ==========================================================

fprintf('\nSetting CPU training options...\n');


options = trainingOptions( ...
    'adam', ...
    'MiniBatchSize', 8, ...
    'MaxEpochs', 3, ...
    'InitialLearnRate', 1e-4, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', augimdsValidation, ...
    'ValidationFrequency', 50, ...
    'Verbose', true, ...
    'Plots', 'training-progress', ...
    'ExecutionEnvironment', 'cpu');


%% =========================================================
% 23. START TRAINING
% ==========================================================

fprintf('\n');
fprintf('============================================\n');
fprintf(' STARTING TRAINING\n');
fprintf('============================================\n');
fprintf('\n');

fprintf('Training on CPU.\n');
fprintf('Mini-batch size : 8\n');
fprintf('Epochs          : 3\n\n');


[trainedNet, trainInfo] = ...
    trainNetwork( ...
        augimdsTrain, ...
        lgraph, ...
        options);


fprintf('\nTraining completed successfully.\n');


%% =========================================================
% 24. TEST MODEL
% ==========================================================

fprintf('\n');
fprintf('============================================\n');
fprintf(' TESTING MODEL\n');
fprintf('============================================\n');


YPred = ...
    classify( ...
        trainedNet, ...
        augimdsTest);


YTest = ...
    imdsTest.Labels;


accuracy = ...
    mean(YPred == YTest);


fprintf( ...
    '\nTest Accuracy: %.2f%%\n', ...
    accuracy * 100);


%% =========================================================
% 25. CONFUSION MATRIX
% ==========================================================

figure( ...
    'Name', ...
    'APTOS Confusion Matrix');


confusionchart( ...
    YTest, ...
    YPred);


title( ...
    sprintf( ...
        'APTOS EfficientNet-B0 - Accuracy %.2f%%', ...
        accuracy * 100));


saveas( ...
    gcf, ...
    fullfile( ...
        evaluationFolder, ...
        'confusion_matrix.png'));


%% =========================================================
% 26. SAVE MODEL
% ==========================================================

modelFile = ...
    fullfile( ...
        modelsFolder, ...
        'APTOS_EfficientNetB0.mat');


save( ...
    modelFile, ...
    'trainedNet', ...
    'trainInfo', ...
    'accuracy');


fprintf('\nModel saved to:\n');

fprintf('%s\n', modelFile);


%% =========================================================
% 27. SAVE TEST DATA
% ==========================================================

testFiles = ...
    imdsTest.Files;


testLabels = ...
    imdsTest.Labels;


save( ...
    fullfile( ...
        evaluationFolder, ...
        'testData.mat'), ...
    'testFiles', ...
    'testLabels');


%% =========================================================
% 28. FINAL RESULTS
% ==========================================================

fprintf('\n');
fprintf('============================================\n');
fprintf(' TRAINING COMPLETE\n');
fprintf('============================================\n');


fprintf( ...
    'Total images       : %d\n', ...
    numImages);


fprintf( ...
    'Training images    : %d\n', ...
    numel(imdsTrain.Files));


fprintf( ...
    'Validation images  : %d\n', ...
    numel(imdsValidation.Files));


fprintf( ...
    'Test images        : %d\n', ...
    numel(imdsTest.Files));


fprintf( ...
    'Test Accuracy      : %.2f%%\n', ...
    accuracy * 100);


fprintf('\nModel:\n');

fprintf('%s\n', modelFile);


fprintf('\n');
fprintf('============================================\n');