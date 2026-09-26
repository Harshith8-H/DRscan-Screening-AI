function quality = assessImageQuality(inputImage)

%% =========================================================
%  APTOS FUNDUS IMAGE QUALITY ASSESSMENT
%
%  Checks:
%  1. Focus / Sharpness
%  2. Illumination
%  3. Retinal Field of View
%  4. Overall Quality
% ==========================================================


%% 1. READ IMAGE

if ischar(inputImage) || isstring(inputImage)

    img = imread(inputImage);

else

    img = inputImage;

end


%% 2. GRAYSCALE

if size(img,3) == 3

    grayImg = rgb2gray(img);

else

    grayImg = img;

end

grayImg = im2double(grayImg);


%% =========================================================
% 3. FOCUS / SHARPNESS
% ==========================================================

laplacianImg = imfilter( ...
    grayImg,...
    fspecial('laplacian'));

focusScore = var(laplacianImg(:));

focusQuality = min(100,...
    (focusScore / 0.02) * 100);

focusQuality = max(0,focusQuality);


%% =========================================================
% 4. ILLUMINATION
% ==========================================================

meanBrightness = mean(grayImg(:));

brightnessStd = std(grayImg(:));


brightnessScore = ...
    100 - abs(meanBrightness - 0.5) * 200;

brightnessScore = ...
    max(0,min(100,brightnessScore));


uniformityScore = ...
    100 - min(100,brightnessStd * 200);

uniformityScore = ...
    max(0,min(100,uniformityScore));


illuminationQuality = ...
    0.6 * brightnessScore + ...
    0.4 * uniformityScore;

illuminationQuality = ...
    max(0,min(100,illuminationQuality));


%% =========================================================
% 5. RETINAL FIELD OF VIEW
% ==========================================================

retinalMask = grayImg > 0.05;

retinalMask = bwareaopen( ...
    retinalMask,...
    500);


retinalCoverage = ...
    nnz(retinalMask) / numel(retinalMask);


if retinalCoverage >= 0.40 && ...
   retinalCoverage <= 0.80

    fieldQuality = 100;


elseif retinalCoverage < 0.40

    fieldQuality = ...
        (retinalCoverage / 0.40) * 100;


else

    fieldQuality = ...
        100 - ...
        ((retinalCoverage - 0.80) * 200);

end


fieldQuality = ...
    max(0,min(100,fieldQuality));


%% =========================================================
% 6. OVERALL QUALITY
% ==========================================================

overallScore = ...
    0.40 * focusQuality + ...
    0.30 * illuminationQuality + ...
    0.30 * fieldQuality;


overallScore = ...
    max(0,min(100,overallScore));


%% =========================================================
% 7. GRADEABILITY
% ==========================================================

if overallScore >= 70 && ...
   focusQuality >= 40 && ...
   illuminationQuality >= 50 && ...
   fieldQuality >= 50

    status = "GRADEABLE";

else

    status = "RECAPTURE";

end


%% =========================================================
% 8. STORE RESULTS
% ==========================================================

quality.focusScore = focusScore;

quality.focusQuality = focusQuality;

quality.meanBrightness = meanBrightness;

quality.brightnessStd = brightnessStd;

quality.illuminationQuality = ...
    illuminationQuality;

quality.retinalCoverage = ...
    retinalCoverage;

quality.fieldQuality = ...
    fieldQuality;

quality.overallScore = ...
    overallScore;

quality.status = status;


end