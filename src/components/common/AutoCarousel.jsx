import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  if (typeof image === "object") {
    return (
      image.finalPreview ||
      image.url ||
      image.preview ||
      image.src ||
      image.imagen ||
      ""
    );
  }

  return "";
}

function AutoCarousel({
  images = [],
  alt = "Imagen",
  className = "",
  imageClassName = "",
  heightClassName = "h-64",
  interval = 6000,
  autoPlay = true,
  showDots = true,
  fit = "contain",
  showEmpty = false
}) {
  const normalizedImages = useMemo(() => {
    return images.map(getImageSource).filter(Boolean);
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const totalImages = normalizedImages.length;
  const hasMultipleImages = totalImages > 1;

  const objectFitClass = fit === "cover" ? "object-cover" : "object-contain";

  const goToPrevious = () => {
    if (!hasMultipleImages) return;

    setCurrentIndex((current) =>
      current === 0 ? totalImages - 1 : current - 1
    );
  };

  const goToNext = () => {
    if (!hasMultipleImages) return;

    setCurrentIndex((current) =>
      current === totalImages - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
    if (!autoPlay || !hasMultipleImages) return undefined;

    const timer = window.setInterval(() => {
      setCurrentIndex((current) =>
        current === totalImages - 1 ? 0 : current + 1
      );
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, hasMultipleImages, interval, totalImages]);

  useEffect(() => {
    if (currentIndex > totalImages - 1) {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalImages]);

  if (totalImages === 0 && !showEmpty) {
    return null;
  }

  if (totalImages === 0 && showEmpty) {
    return (
      <div
        className={`relative flex ${heightClassName} items-center justify-center overflow-hidden rounded-[28px] bg-[#F8F6F7] ${className}`}
      >
        <div className="text-center text-gray-400">
          <ImageIcon size={38} className="mx-auto" />
          <p className="mt-2 text-sm font-black">Sin imágenes</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${heightClassName} overflow-hidden rounded-[28px] bg-[#F8F6F7] ${className}`}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{
          width: `${totalImages * 100}%`,
          transform: `translateX(-${currentIndex * (100 / totalImages)}%)`
        }}
      >
        {normalizedImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="h-full shrink-0 bg-[#F8F6F7]"
            style={{ width: `${100 / totalImages}%` }}
          >
            <img
              src={image}
              alt={`${alt} ${index + 1}`}
              className={`h-full w-full ${objectFitClass} ${imageClassName}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105"
            aria-label="Imagen siguiente"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {showDots && hasMultipleImages && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-white/70 px-3 py-2 backdrop-blur">
          {normalizedImages.map((image, index) => (
            <button
              key={`dot-${image}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-7 bg-[#87CCC8]"
                  : "w-2.5 bg-[#D1B0C7]"
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AutoCarousel;