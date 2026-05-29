const MAX_FINAL_SIZE_KB = 600;
const MAX_FINAL_WIDTH = 1200;
const MIN_FINAL_WIDTH = 500;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bytesToKB(bytes) {
  return bytes / 1024;
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error("No se pudo procesar el recorte de la imagen."));
    };

    image.src = src;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function getFinalFileName(name = "imagen-smika.jpg") {
  const cleanName = name.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  return `${cleanName}-recorte-final.jpg`;
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

export async function createCroppedCompressedImage(imageData) {
  if (!imageData?.preview) {
    throw new Error("No hay imagen para recortar.");
  }

  const sourceImage = await loadImageFromSrc(imageData.preview);

  const naturalWidth = sourceImage.naturalWidth;
  const naturalHeight = sourceImage.naturalHeight;

  const { sourceX, sourceY, sourceWidth, sourceHeight } = getSourceRect({
    crop: imageData.crop,
    zoom: imageData.zoom,
    pan: imageData.pan,
    naturalWidth,
    naturalHeight
  });

  const ratio = sourceHeight / sourceWidth;

  let finalWidth = Math.min(MAX_FINAL_WIDTH, Math.round(sourceWidth));

  if (finalWidth < MIN_FINAL_WIDTH && sourceWidth >= MIN_FINAL_WIDTH) {
    finalWidth = MIN_FINAL_WIDTH;
  }

  finalWidth = Math.max(1, finalWidth);

  let finalHeight = Math.max(1, Math.round(finalWidth * ratio));

  let quality = 0.92;
  let blob = null;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = finalWidth;
    canvas.height = finalHeight;

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
      finalWidth,
      finalHeight
    );

    blob = await canvasToBlob(canvas, quality);

    if (!blob) {
      throw new Error("No se pudo generar la imagen final.");
    }

    if (bytesToKB(blob.size) <= MAX_FINAL_SIZE_KB) {
      break;
    }

    if (quality > 0.72) {
      quality -= 0.05;
    } else {
      finalWidth = Math.max(1, Math.round(finalWidth * 0.9));
      finalHeight = Math.max(1, Math.round(finalWidth * ratio));
    }
  }

  const finalFile = new File([blob], getFinalFileName(imageData.name), {
    type: "image/jpeg",
    lastModified: Date.now()
  });

  return {
    finalFile,
    finalPreview: URL.createObjectURL(finalFile),
    finalSize: finalFile.size,
    finalWidth,
    finalHeight,
    finalQuality: Number(quality.toFixed(2)),
    finalType: "image/jpeg"
  };
}

export const cropCompressionRules = {
  maxFinalSizeKB: MAX_FINAL_SIZE_KB,
  maxFinalWidth: MAX_FINAL_WIDTH,
  minFinalWidth: MIN_FINAL_WIDTH
};