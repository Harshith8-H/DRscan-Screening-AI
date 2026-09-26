function processedImg = preprocessFundus(img)

%% =========================================================
% PREPROCESS FUNDUS IMAGE
% =========================================================

%% 1. READ IMAGE
% imageDatastore sends the filename to ReadFcn

if ischar(img) || isstring(img)
    img = imread(img);
end


%% 2. MAKE SURE IMAGE IS RGB

if ndims(img) == 2
    img = cat(3, img, img, img);
end

img = im2uint8(img);


%% 3. REMOVE BLACK BACKGROUND

gray = rgb2gray(img);

mask = gray > 15;

mask = imfill(mask, "holes");

mask = bwareaopen(mask, 500);


%% 4. FIND LARGEST RETINAL REGION

CC = bwconncomp(mask);

if CC.NumObjects > 0

    numPixels = cellfun(@numel, CC.PixelIdxList);

    [~, idx] = max(numPixels);

    largestMask = false(size(mask));

    largestMask(CC.PixelIdxList{idx}) = true;

    stats = regionprops(largestMask, "BoundingBox");

    if ~isempty(stats)

        bbox = stats.BoundingBox;

        margin = 10;

        x = max(1, floor(bbox(1) - margin));
        y = max(1, floor(bbox(2) - margin));

        w = min( ...
            size(img,2) - x + 1, ...
            ceil(bbox(3) + 2*margin));

        h = min( ...
            size(img,1) - y + 1, ...
            ceil(bbox(4) + 2*margin));

        img = imcrop(img, [x y w h]);

    end
end


%% 5. RESIZE

img = imresize(img, [224 224]);


%% 6. LAB CONTRAST ENHANCEMENT

labImg = rgb2lab(img);

L = labImg(:,:,1);

L = mat2gray(L);

L = adapthisteq( ...
    L, ...
    "ClipLimit", 0.01, ...
    "NumTiles", [8 8]);

labImg(:,:,1) = L * 100;

processedImg = lab2rgb(labImg);


%% 7. CONVERT TO UINT8

processedImg = im2uint8(processedImg);


%% 8. MILD DENOISING

processedImg = imgaussfilt(processedImg, 0.3);


%% 9. FINAL SIZE CHECK

if size(processedImg,1) ~= 224 || ...
   size(processedImg,2) ~= 224

    processedImg = imresize(processedImg, [224 224]);

end


%% 10. FINAL RGB CHECK

if size(processedImg,3) ~= 3

    processedImg = repmat(processedImg, [1 1 3]);

end

end