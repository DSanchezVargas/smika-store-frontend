const MAX_UPLOAD_SIZE_MB = 40;
const MAX_OUTPUT_SIZE_KB = 1024;
const MAX_IMAGE_WIDTH = 2200;
const MAX_IMAGE_HEIGHT = 2200;
const MIN_IMAGE_WIDTH = 1200;
const MIN_IMAGE_HEIGHT = 1200;
const INITIAL_QUALITY = 0.95;
const MIN_QUALITY = 0.82;

function bytesToKB(bytes) {
  return bytes / 1024;
}

function bytesToMB(bytes) {
  return bytes / 1024 / 1024;
}

function validateImageFile(file) {
  const fileName = file.name.toLowerCase();

  const isAllowedImage =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png");

  if (!isAllowedImage) {
    throw new Error("Solo se permiten imágenes JPG, JPEG o PNG.");
  }

  if (bytesToMB(file.size) > MAX_UPLOAD_SIZE_MB) {
    throw new Error(
      `La imagen supera el máximo permitido de ${MAX_UPLOAD_SIZE_MB} MB.`
    );
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };

    image.src = url;
  });
}

function getResizedDimensions(width, height, maxWidth, maxHeight) {
  let newWidth = width;
  let newHeight = height;

  if (newWidth > maxWidth) {
    newHeight = Math.round((newHeight * maxWidth) / newWidth);
    newWidth = maxWidth;
  }

  if (newHeight > maxHeight) {
    newWidth = Math.round((newWidth * maxHeight) / newHeight);
    newHeight = maxHeight;
  }

  return {
    width: Math.max(1, newWidth),
    height: Math.max(1, newHeight)
  };
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

function createFilePreview(file) {
  return URL.createObjectURL(file);
}

function getCleanName(fileName) {
  return fileName.replace(/\.(png|jpg|jpeg)$/i, "");
}

function buildOriginalImageResult(file, image) {
  return {
    file,
    preview: createFilePreview(file),
    originalSize: file.size,
    compressedSize: file.size,
    width: image.naturalWidth,
    height: image.naturalHeight,
    quality: null,
    originalType: file.type,
    finalType: file.type,
    wasCompressed: false,
    keptOriginal: true
  };
}

export async function compressImageFile(file) {
  validateImageFile(file);

  const image = await loadImageFromFile(file);

  const originalSizeKB = bytesToKB(file.size);
  const isOriginalSmallEnough = originalSizeKB <= MAX_OUTPUT_SIZE_KB;
  const isWithinDimensions =
    image.naturalWidth <= MAX_IMAGE_WIDTH &&
    image.naturalHeight <= MAX_IMAGE_HEIGHT;

  /*
    Si la imagen ya pesa menos de 1 MB y no supera dimensiones máximas,
    NO la recomprimimos. Esto evita perder calidad o que pese más.
  */
  if (isOriginalSmallEnough && isWithinDimensions) {
    return buildOriginalImageResult(file, image);
  }

  let dimensions = getResizedDimensions(
    image.naturalWidth,
    image.naturalHeight,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT
  );

  let quality = INITIAL_QUALITY;
  let blob = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

    blob = await canvasToBlob(canvas, quality);

    if (!blob) {
      throw new Error("No se pudo comprimir la imagen.");
    }

    if (bytesToKB(blob.size) <= MAX_OUTPUT_SIZE_KB) {
      break;
    }

    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.03);
    } else {
      dimensions = {
        width: Math.max(MIN_IMAGE_WIDTH, Math.round(dimensions.width * 0.92)),
        height: Math.max(MIN_IMAGE_HEIGHT, Math.round(dimensions.height * 0.92))
      };
    }
  }

  if (!blob) {
    throw new Error("No se pudo generar la imagen comprimida.");
  }

  /*
    Protección:
    Si el resultado termina pesando más que el original, se conserva la original.
  */
  if (blob.size >= file.size) {
    return buildOriginalImageResult(file, image);
  }

  const cleanName = getCleanName(file.name);

  const compressedFile = new File([blob], `${cleanName}-smika.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });

  return {
    file: compressedFile,
    preview: createFilePreview(compressedFile),
    originalSize: file.size,
    compressedSize: compressedFile.size,
    width: dimensions.width,
    height: dimensions.height,
    quality: Number(quality.toFixed(2)),
    originalType: file.type,
    finalType: "image/jpeg",
    wasCompressed: true,
    keptOriginal: false
  };
}

export const imageCompressionRules = {
  maxUploadSizeMB: MAX_UPLOAD_SIZE_MB,
  maxOutputSizeKB: MAX_OUTPUT_SIZE_KB,
  maxImageWidth: MAX_IMAGE_WIDTH,
  maxImageHeight: MAX_IMAGE_HEIGHT,
  allowedFormats: "JPG, JPEG o PNG"
};