const MAX_FINAL_SIZE_KB = 1024;
const MAX_FINAL_DIMENSION = 2200;
const MIN_FINAL_DIMENSION = 1200;
const INITIAL_QUALITY = 0.95;
const MIN_QUALITY = 0.82;

function bytesToKB(bytes) {
  return bytes / 1024;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCleanName(fileName = "imagen") {
  return fileName.replace(/\.(png|jpg|jpeg)$/i, "");
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

function getBestSource(image) {
  if (!image) return "";

  /*
    Importante:
    Para recortar usamos primero la imagen base, no el finalPreview,
    porque finalPreview puede ser una versión ya recortada.
  */
  return image.url || image.preview || image.finalPreview || "";
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error("No se pudo leer la imagen para recortar."));
    };

    if (!source.startsWith("data:") && !source.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }

    image.src = source;
  });
}

function getSourceRect({ crop, zoom, pan, naturalWidth, naturalHeight }) {
  const safeCrop = crop || {
    x: 0,
    y: 0,
    width: 100,
    height: 100
  };

  const safeZoom = Math.max(Number(zoom || 1), 1);

  const safePan = pan || {
    x: 0,
    y: 0
  };

  const sourceXPercent =
    (safeCrop.x / 100 - 0.5 - safePan.x / 100) / safeZoom + 0.5;

  const sourceYPercent =
    (safeCrop.y / 100 - 0.5 - safePan.y / 100) / safeZoom + 0.5;

  const sourceWidthPercent = safeCrop.width / 100 / safeZoom;
  const sourceHeightPercent = safeCrop.height / 100 / safeZoom;

  const sourceX = clamp(naturalWidth * sourceXPercent, 0, naturalWidth - 1);
  const sourceY = clamp(naturalHeight * sourceYPercent, 0, naturalHeight - 1);

  const sourceWidth = clamp(
    naturalWidth * sourceWidthPercent,
    1,
    naturalWidth - sourceX
  );

  const sourceHeight = clamp(
    naturalHeight * sourceHeightPercent,
    1,
    naturalHeight - sourceY
  );

  return {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight
  };
}

function getOutputDimensions(sourceWidth, sourceHeight) {
  let outputWidth = Math.round(sourceWidth);
  let outputHeight = Math.round(sourceHeight);

  const largestSide = Math.max(outputWidth, outputHeight);

  if (largestSide > MAX_FINAL_DIMENSION) {
    const ratio = MAX_FINAL_DIMENSION / largestSide;

    outputWidth = Math.round(outputWidth * ratio);
    outputHeight = Math.round(outputHeight * ratio);
  }

  /*
    No forzamos ampliación si el recorte original es pequeño.
    Aumentar artificialmente una imagen pequeña solo la vuelve borrosa.
  */
  return {
    width: Math.max(1, outputWidth),
    height: Math.max(1, outputHeight)
  };
}

function drawCroppedImage({
  sourceImage,
  sourceX,
  sourceY,
  sourceWidth,
  sourceHeight,
  outputWidth,
  outputHeight
}) {
  const canvas = document.createElement("canvas");

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas;
}

export async function createCroppedCompressedImage(image) {
  const source = getBestSource(image);

  if (!source) {
    throw new Error("No hay imagen base para guardar el recorte.");
  }

  const sourceImage = await loadImage(source);

  const naturalWidth = sourceImage.naturalWidth;
  const naturalHeight = sourceImage.naturalHeight;

  const { sourceX, sourceY, sourceWidth, sourceHeight } = getSourceRect({
    crop: image.crop,
    zoom: image.zoom,
    pan: image.pan,
    naturalWidth,
    naturalHeight
  });

  let dimensions = getOutputDimensions(sourceWidth, sourceHeight);
  let quality = INITIAL_QUALITY;
  let blob = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const canvas = drawCroppedImage({
      sourceImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      outputWidth: dimensions.width,
      outputHeight: dimensions.height
    });

    blob = await canvasToBlob(canvas, quality);

    if (!blob) {
      throw new Error("No se pudo generar el recorte final.");
    }

    if (bytesToKB(blob.size) <= MAX_FINAL_SIZE_KB) {
      break;
    }

    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.03);
    } else {
      const largestSide = Math.max(dimensions.width, dimensions.height);

      if (largestSide <= MIN_FINAL_DIMENSION) {
        break;
      }

      dimensions = {
        width: Math.max(MIN_FINAL_DIMENSION, Math.round(dimensions.width * 0.92)),
        height: Math.max(
          MIN_FINAL_DIMENSION,
          Math.round(dimensions.height * 0.92)
        )
      };
    }
  }

  if (!blob) {
    throw new Error("No se pudo guardar el recorte.");
  }

  const cleanName = getCleanName(image.name || image.originalName || "imagen");

  const finalFile = new File([blob], `${cleanName}-recorte-smika.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });

  const finalPreview = URL.createObjectURL(finalFile);

  return {
    finalFile,
    finalPreview,
    finalSize: finalFile.size,
    finalWidth: dimensions.width,
    finalHeight: dimensions.height,
    finalQuality: Number(quality.toFixed(2)),
    finalType: "image/jpeg",
    finalCompressed: true,
    storage: "local-data-url"
  };
}

export const cropCompressionRules = {
  maxFinalSizeKB: MAX_FINAL_SIZE_KB,
  maxFinalDimension: MAX_FINAL_DIMENSION,
  minFinalDimension: MIN_FINAL_DIMENSION,
  initialQuality: INITIAL_QUALITY,
  minQuality: MIN_QUALITY
};