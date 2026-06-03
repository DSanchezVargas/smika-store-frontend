import { useEffect, useState } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function getBestImageSource(image, ignoreFinalPreview = false) {
  if (!image) return "";

  if (typeof image === "string") return image;

  if (!ignoreFinalPreview && image.finalPreview) {
    return image.finalPreview;
  }

  return (
    image.secure_url ||
    image.url ||
    image.preview ||
    image.src ||
    image.imagen ||
    image.finalPreview ||
    ""
  );
}

function CroppedImagePreview({
  image,
  alt = "Imagen",
  className = "",
  rounded = "rounded-2xl",
  ignoreFinalPreview = false
}) {
  const [croppedSrc, setCroppedSrc] = useState("");

  useEffect(() => {
    let isActive = true;

    const sourceSrc = getBestImageSource(image, ignoreFinalPreview);

    if (!sourceSrc) {
      setCroppedSrc("");
      return () => {
        isActive = false;
      };
    }

    // Cambio importante:
    // Apenas cambia la imagen, mostramos la nueva fuente de inmediato.
    // Así no se queda pegada la imagen anterior mientras se recalcula el recorte.
    setCroppedSrc(sourceSrc);

    if (image?.finalPreview && !ignoreFinalPreview) {
      setCroppedSrc(image.finalPreview);
      return () => {
        isActive = false;
      };
    }

    const sourceImage = new window.Image();

    if (!sourceSrc.startsWith("data:") && !sourceSrc.startsWith("blob:")) {
      sourceImage.crossOrigin = "anonymous";
    }

    sourceImage.onload = () => {
      if (!isActive) return;

      const naturalWidth = sourceImage.naturalWidth;
      const naturalHeight = sourceImage.naturalHeight;

      const { sourceX, sourceY, sourceWidth, sourceHeight } = getSourceRect({
        crop: image?.crop,
        zoom: image?.zoom,
        pan: image?.pan,
        naturalWidth,
        naturalHeight
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = Math.max(
        1,
        Math.round(1000 * (sourceHeight / sourceWidth))
      );

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
        canvas.width,
        canvas.height
      );

      try {
        if (isActive) {
          setCroppedSrc(canvas.toDataURL("image/jpeg", 0.92));
        }
      } catch {
        if (isActive) {
          setCroppedSrc(sourceSrc);
        }
      }
    };

    sourceImage.onerror = () => {
      if (isActive) {
        setCroppedSrc(sourceSrc);
      }
    };

    sourceImage.src = sourceSrc;

    return () => {
      isActive = false;
    };
  }, [
    image,
    image?.secure_url,
    image?.url,
    image?.preview,
    image?.finalPreview,
    image?.src,
    image?.imagen,
    image?.zoom,
    image?.pan?.x,
    image?.pan?.y,
    image?.crop?.x,
    image?.crop?.y,
    image?.crop?.width,
    image?.crop?.height,
    ignoreFinalPreview
  ]);

  const fallbackSrc = getBestImageSource(image, ignoreFinalPreview);

  if (!fallbackSrc) {
    return (
      <div
        className={`bg-[#87CCC8] text-white flex items-center justify-center ${rounded} ${className}`}
      >
        S
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-white ${rounded} ${className}`}
    >
      <img
        key={fallbackSrc}
        src={croppedSrc || fallbackSrc}
        alt={alt}
        className="h-full w-full object-contain p-3"
        draggable="false"
      />
    </div>
  );
}

export default CroppedImagePreview;