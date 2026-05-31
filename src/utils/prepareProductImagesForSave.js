import { createCroppedCompressedImage } from "./cropAndCompressImage";

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  return (
    image.finalPreview ||
    image.url ||
    image.preview ||
    image.src ||
    image.imagen ||
    ""
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => {
      reject(new Error("No se pudo convertir la imagen para guardarla."));
    };

    reader.readAsDataURL(file);
  });
}

async function sourceToDataUrl(src) {
  if (!src) return "";

  if (src.startsWith("data:")) {
    return src;
  }

  const response = await fetch(src);
  const blob = await response.blob();

  return fileToDataUrl(blob);
}

function isExistingImageWithoutNewFile(image) {
  if (!image || typeof image === "string") return Boolean(image);

  const hasNewFile = Boolean(image.file || image.finalFile);
  const hasExistingSource = Boolean(getImageSource(image));

  return hasExistingSource && !hasNewFile;
}

function preserveExistingImage(image) {
  const source = getImageSource(image);

  if (typeof image === "string") {
    return {
      url: source,
      preview: source,
      finalPreview: source,
      storage: source.startsWith("data:") ? "local-data-url" : "existing"
    };
  }

  return {
    ...image,
    url: image.url || source,
    preview: image.preview || source,
    finalPreview: image.finalPreview || source,
    storage:
      image.storage ||
      (source.startsWith("data:") ? "local-data-url" : "existing")
  };
}

export async function prepareProductImagesForSave(images = []) {
  const preparedImages = [];

  for (const image of images) {
    if (isExistingImageWithoutNewFile(image)) {
      preparedImages.push(preserveExistingImage(image));
      continue;
    }

    let finalImage = null;

    if (image.finalCompressed && (image.finalFile || image.finalPreview)) {
      finalImage = {
        finalFile: image.finalFile,
        finalPreview: image.finalPreview,
        finalSize: image.finalSize,
        finalWidth: image.finalWidth,
        finalHeight: image.finalHeight,
        finalQuality: image.finalQuality,
        finalType: image.finalType || "image/jpeg"
      };
    } else {
      finalImage = await createCroppedCompressedImage(image);
    }

    let finalDataUrl = "";

    if (finalImage.finalFile) {
      finalDataUrl = await fileToDataUrl(finalImage.finalFile);
    } else {
      finalDataUrl = await sourceToDataUrl(
        finalImage.finalPreview || image.finalPreview || image.preview
      );
    }

    preparedImages.push({
      id: image.id,
      name: finalImage.finalFile?.name || image.name,
      originalName: image.originalName || image.name,

      preview: finalDataUrl,
      finalPreview: finalDataUrl,
      url: finalDataUrl,

      size: finalImage.finalSize || image.finalSize || image.size,
      originalSize: image.originalSize || image.size,
      compressedSize: image.compressedSize || image.size,
      finalSize: finalImage.finalSize || image.finalSize || image.size,

      width: image.width,
      height: image.height,
      finalWidth: finalImage.finalWidth || image.finalWidth,
      finalHeight: finalImage.finalHeight || image.finalHeight,

      crop: image.crop,
      zoom: image.zoom || 1,
      pan: image.pan || {
        x: 0,
        y: 0
      },

      finalQuality: finalImage.finalQuality || image.finalQuality,
      finalType: finalImage.finalType || "image/jpeg",
      finalCompressed: true,
      storage: "local-data-url"
    });
  }

  return preparedImages;
}