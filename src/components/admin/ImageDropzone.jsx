import { useEffect, useMemo, useRef, useState } from "react";
import {
    ImagePlus,
    Move,
    RotateCcw,
    Scissors,
    Trash2,
    UploadCloud,
    X,
    ZoomIn
} from "lucide-react";

import {
    compressImageFile,
    imageCompressionRules
} from "../../utils/imageCompression";

import {
    createCroppedCompressedImage,
    cropCompressionRules
} from "../../utils/cropAndCompressImage";

import CroppedImagePreview from "./CroppedImagePreview";

const MIN_CROP_SIZE = 8;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function formatFileSize(bytes = 0) {
    if (!bytes) return "Tamaño no disponible";

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) return `${mb.toFixed(2)} MB`;

    return `${kb.toFixed(1)} KB`;
}

function ImageDropzone({
    label = "Subir imágenes",
    description = "Arrastra imágenes aquí o haz clic para seleccionar.",
    images = [],
    setImages,
    multiple = true
}) {
    const cropAreaRef = useRef(null);

    const [editingImageId, setEditingImageId] = useState(null);
    const [cropAction, setCropAction] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionError, setCompressionError] = useState("");
    const [isSavingCrop, setIsSavingCrop] = useState(false);
    const [cropSaveError, setCropSaveError] = useState("");

    const editingImage = useMemo(() => {
        return images.find((image) => image.id === editingImageId);
    }, [images, editingImageId]);

    const editingWidth = editingImage?.width || 1;
    const editingHeight = editingImage?.height || 1;
    const editingIsWide = editingWidth >= editingHeight;
    const editingAspectRatio = `${editingWidth} / ${editingHeight}`;

    const updateImage = (imageId, payloadOrUpdater) => {
        setImages((currentImages) =>
            currentImages.map((image) => {
                if (image.id !== imageId) return image;

                const payload =
                    typeof payloadOrUpdater === "function"
                        ? payloadOrUpdater(image)
                        : payloadOrUpdater;

                return {
                    ...image,
                    ...payload
                };
            })
        );
    };

    const clearFinalCrop = (imageId, extraPayload = {}) => {
        updateImage(imageId, {
            ...extraPayload,
            finalFile: null,
            finalPreview: "",
            finalSize: null,
            finalCompressed: false
        });
    };

    const getPointerPercent = (clientX, clientY) => {
        if (!cropAreaRef.current) {
            return {
                x: 0,
                y: 0
            };
        }

        const rect = cropAreaRef.current.getBoundingClientRect();

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        return {
            x: clamp(x, 0, 100),
            y: clamp(y, 0, 100)
        };
    };

    useEffect(() => {
        if (!cropAction) return;

        const handlePointerMove = (event) => {
            if (!cropAreaRef.current) return;

            const pointer = getPointerPercent(event.clientX, event.clientY);

            const deltaX = pointer.x - cropAction.startX;
            const deltaY = pointer.y - cropAction.startY;

            const startCrop = cropAction.startCrop;

            let newCrop = { ...startCrop };
            if (cropAction.type === "pan") {
                const startPan = cropAction.startPan || {
                    x: 0,
                    y: 0
                };

                const nextPan = {
                    x: startPan.x + deltaX,
                    y: startPan.y + deltaY
                };

                const limit = getPanLimit(editingImage?.zoom || 1);

                clearFinalCrop(cropAction.imageId, {
                    pan: {
                        x: clamp(nextPan.x, -limit, limit),
                        y: clamp(nextPan.y, -limit, limit)
                    }
                });

                return;
            }
            if (cropAction.type === "move") {
                newCrop.x = clamp(startCrop.x + deltaX, 0, 100 - startCrop.width);
                newCrop.y = clamp(startCrop.y + deltaY, 0, 100 - startCrop.height);
            }

            if (cropAction.type === "nw") {
                const right = startCrop.x + startCrop.width;
                const bottom = startCrop.y + startCrop.height;

                const newX = clamp(startCrop.x + deltaX, 0, right - MIN_CROP_SIZE);
                const newY = clamp(startCrop.y + deltaY, 0, bottom - MIN_CROP_SIZE);

                newCrop.x = newX;
                newCrop.y = newY;
                newCrop.width = right - newX;
                newCrop.height = bottom - newY;
            }

            if (cropAction.type === "ne") {
                const left = startCrop.x;
                const bottom = startCrop.y + startCrop.height;

                const newRight = clamp(
                    startCrop.x + startCrop.width + deltaX,
                    left + MIN_CROP_SIZE,
                    100
                );

                const newY = clamp(startCrop.y + deltaY, 0, bottom - MIN_CROP_SIZE);

                newCrop.y = newY;
                newCrop.width = newRight - left;
                newCrop.height = bottom - newY;
            }

            if (cropAction.type === "sw") {
                const right = startCrop.x + startCrop.width;
                const top = startCrop.y;

                const newX = clamp(startCrop.x + deltaX, 0, right - MIN_CROP_SIZE);

                const newBottom = clamp(
                    startCrop.y + startCrop.height + deltaY,
                    top + MIN_CROP_SIZE,
                    100
                );

                newCrop.x = newX;
                newCrop.width = right - newX;
                newCrop.height = newBottom - top;
            }

            if (cropAction.type === "se") {
                const left = startCrop.x;
                const top = startCrop.y;

                const newRight = clamp(
                    startCrop.x + startCrop.width + deltaX,
                    left + MIN_CROP_SIZE,
                    100
                );

                const newBottom = clamp(
                    startCrop.y + startCrop.height + deltaY,
                    top + MIN_CROP_SIZE,
                    100
                );

                newCrop.width = newRight - left;
                newCrop.height = newBottom - top;
            }

            if (cropAction.type === "n") {
                const bottom = startCrop.y + startCrop.height;
                const newY = clamp(startCrop.y + deltaY, 0, bottom - MIN_CROP_SIZE);

                newCrop.y = newY;
                newCrop.height = bottom - newY;
            }

            if (cropAction.type === "s") {
                const top = startCrop.y;

                const newBottom = clamp(
                    startCrop.y + startCrop.height + deltaY,
                    top + MIN_CROP_SIZE,
                    100
                );

                newCrop.height = newBottom - top;
            }

            if (cropAction.type === "w") {
                const right = startCrop.x + startCrop.width;
                const newX = clamp(startCrop.x + deltaX, 0, right - MIN_CROP_SIZE);

                newCrop.x = newX;
                newCrop.width = right - newX;
            }

            if (cropAction.type === "e") {
                const left = startCrop.x;

                const newRight = clamp(
                    startCrop.x + startCrop.width + deltaX,
                    left + MIN_CROP_SIZE,
                    100
                );

                newCrop.width = newRight - left;
            }

            clearFinalCrop(cropAction.imageId, {
                crop: newCrop
            });
        };

        const handlePointerUp = () => {
            setCropAction(null);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [cropAction]);

    const handleFiles = async (files) => {
        const selectedFiles = Array.from(files || []);

        if (selectedFiles.length === 0) return;

        setCompressionError("");
        setIsCompressing(true);

        try {
            const mappedFiles = [];

            for (const file of selectedFiles) {
                const compressed = await compressImageFile(file);

                mappedFiles.push({
                    id: `${compressed.file.name}-${Date.now()}-${Math.random()}`,
                    name: compressed.file.name,
                    originalName: file.name,
                    size: compressed.compressedSize,
                    originalSize: compressed.originalSize,
                    compressedSize: compressed.compressedSize,
                    file: compressed.file,
                    preview: compressed.preview,
                    compressionQuality: compressed.quality,
                    width: compressed.width,
                    height: compressed.height,
                    originalType: compressed.originalType,
                    finalType: compressed.finalType,
                    wasCompressed: compressed.wasCompressed,
                    keptOriginal: compressed.keptOriginal,
                    crop: {
                        x: 15,
                        y: 15,
                        width: 70,
                        height: 70
                    },
                    zoom: 1,
                    pan: {
                        x: 0,
                        y: 0
                    },
                    finalFile: null,
                    finalPreview: "",
                    finalSize: null,
                    finalCompressed: false
                });
            }

            setImages((currentImages) => {
                if (multiple) {
                    return [...currentImages, ...mappedFiles];
                }

                return mappedFiles.slice(0, 1);
            });
        } catch (error) {
            setCompressionError(
                error.message || "No se pudo procesar la imagen seleccionada."
            );
        } finally {
            setIsCompressing(false);
        }
    };

    const handleInputChange = (event) => {
        handleFiles(event.target.files);
        event.target.value = "";
    };

    const handleDrop = (event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
    };

    const handleRemove = (imageId) => {
        setImages(images.filter((image) => image.id !== imageId));

        if (editingImageId === imageId) {
            setEditingImageId(null);
        }
    };

    const openCropModal = (imageId) => {
        setEditingImageId(imageId);
        setCropSaveError("");
    };

    const closeCropModal = () => {
        setEditingImageId(null);
        setCropAction(null);
        setCropSaveError("");
    };

    const resetCrop = () => {
        if (!editingImage) return;

        clearFinalCrop(editingImage.id, {
            crop: {
                x: 15,
                y: 15,
                width: 70,
                height: 70
            },
            zoom: 1,
            pan: {
                x: 0,
                y: 0
            }
        });
    };

    const updateZoom = (value) => {
        if (!editingImage) return;

        const nextZoom = clamp(Number(value), MIN_ZOOM, MAX_ZOOM);
        const limit = getPanLimit(nextZoom);

        const currentPan = editingImage.pan || {
            x: 0,
            y: 0
        };

        clearFinalCrop(editingImage.id, {
            zoom: nextZoom,
            pan: {
                x: clamp(currentPan.x, -limit, limit),
                y: clamp(currentPan.y, -limit, limit)
            }
        });
    };
    const getPanLimit = (zoomValue) => {
        const safeZoom = Math.max(Number(zoomValue || 1), 1);
        return ((safeZoom - 1) * 100) / 2;
    };

    const updatePan = (nextPan) => {
        if (!editingImage) return;

        const limit = getPanLimit(editingImage.zoom || 1);

        clearFinalCrop(editingImage.id, {
            pan: {
                x: clamp(nextPan.x, -limit, limit),
                y: clamp(nextPan.y, -limit, limit)
            }
        });
    };

    const centerImage = () => {
        if (!editingImage) return;

        clearFinalCrop(editingImage.id, {
            pan: {
                x: 0,
                y: 0
            }
        });
    };

    const startPanAction = (event) => {
        event.preventDefault();

        if (!editingImage || !cropAreaRef.current) return;

        const pointer = getPointerPercent(event.clientX, event.clientY);

        setCropAction({
            type: "pan",
            imageId: editingImage.id,
            startX: pointer.x,
            startY: pointer.y,
            startPan: editingImage.pan || {
                x: 0,
                y: 0
            }
        });
    };

    const saveCropAdjustment = async () => {
        if (!editingImage) return;

        setIsSavingCrop(true);
        setCropSaveError("");

        try {
            const finalImage = await createCroppedCompressedImage(editingImage);

            updateImage(editingImage.id, {
                ...finalImage,
                finalCompressed: true
            });

            closeCropModal();
        } catch (error) {
            setCropSaveError(
                error.message || "No se pudo guardar el recorte final."
            );
        } finally {
            setIsSavingCrop(false);
        }
    };

    const startCropAction = (event, type) => {
        event.preventDefault();
        event.stopPropagation();

        if (!editingImage || !cropAreaRef.current) return;

        const pointer = getPointerPercent(event.clientX, event.clientY);

        setCropAction({
            type,
            imageId: editingImage.id,
            startX: pointer.x,
            startY: pointer.y,
            startCrop: { ...editingImage.crop }
        });
    };

    return (
        <div>
            <div>
                <p className="font-black">{label}</p>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>

            <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="mt-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#87CCC8]/50 bg-[#F8F6F7] p-6 text-center transition hover:bg-[#F7D9D8]/40"
            >
                <div className="h-14 w-14 rounded-full bg-[#87CCC8] text-white flex items-center justify-center smika-shadow">
                    <UploadCloud size={26} />
                </div>

                <p className="mt-4 text-lg font-black">
                    {isCompressing ? "Comprimiendo imagen..." : "Arrastra tus imágenes aquí"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                    o haz clic para seleccionar desde tu computadora
                </p>

                <p className="mt-2 text-xs text-gray-500">
                    {imageCompressionRules.allowedFormats} hasta{" "}
                    {imageCompressionRules.maxUploadSizeMB} MB. El sistema solo comprime
                    cuando conviene y nunca aumenta el peso de la imagen.
                </p>

                <span className="mt-4 inline-flex rounded-full bg-[#F7D9D8] px-5 py-2 text-sm font-black">
                    Seleccionar archivo
                </span>

                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    multiple={multiple}
                    onChange={handleInputChange}
                    className="hidden"
                />
            </label>

            {compressionError && (
                <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {compressionError}
                </div>
            )}

            {images.length > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="rounded-[24px] border border-[#87CCC8]/20 bg-white p-4"
                        >
                            <div className="relative h-44 overflow-hidden rounded-3xl bg-[#F8F6F7]">
                                <CroppedImagePreview
                                    image={image}
                                    alt={image.name}
                                    className="h-full w-full"
                                    rounded="rounded-3xl"
                                />

                                <button
                                    type="button"
                                    onClick={() => handleRemove(image.id)}
                                    className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/95 flex items-center justify-center smika-shadow text-red-500"
                                    title="Quitar imagen"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>

                            <div className="mt-4 flex items-start gap-2">
                                <ImagePlus size={17} className="text-[#87CCC8] mt-1" />

                                <div className="min-w-0">
                                    <p className="text-sm font-black truncate">{image.name}</p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Original: {formatFileSize(image.originalSize || image.size)}
                                    </p>

                                    <p className="mt-1 text-xs font-bold text-[#87CCC8]">
                                        {image.wasCompressed ? "Final comprimida:" : "Archivo conservado:"}{" "}
                                        {formatFileSize(image.compressedSize || image.size)}
                                    </p>

                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {image.wasCompressed
                                            ? "Formato final: JPG optimizado"
                                            : "La imagen ya estaba optimizada, no se aumentó su peso"}
                                    </p>

                                    {image.finalSize && (
                                        <p className="mt-1 text-[11px] font-bold text-[#D1B0C7]">
                                            Recorte guardado: {formatFileSize(image.finalSize)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => openCropModal(image.id)}
                                className="mt-4 w-full rounded-2xl bg-[#F7D9D8] px-4 py-3 text-sm font-black flex items-center justify-center gap-2"
                            >
                                <Scissors size={17} />
                                Ajustar recorte
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {editingImage && (
                <div className="fixed inset-0 z-[9999] bg-black/45 p-4 flex items-center justify-center">
                    <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[32px] bg-white smika-shadow">
                        <div className="sticky top-0 z-20 bg-white border-b border-[#87CCC8]/20 p-5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[#87CCC8] font-black">Ajustar imagen</p>

                                <h3 className="text-2xl font-black truncate">
                                    {editingImage.name}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    {formatFileSize(editingImage.size)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCropModal}
                                className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center shrink-0"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-5 grid gap-6 lg:grid-cols-[1fr_320px]">
                            <div className="relative h-[520px] overflow-hidden rounded-[28px] bg-[#F8F6F7] border border-[#87CCC8]/20 flex items-center justify-center p-4">
                                <div
                                    ref={cropAreaRef}
                                    onPointerDown={startPanAction}
                                    className="relative overflow-hidden rounded-[24px] bg-white touch-none smika-shadow cursor-grab active:cursor-grabbing"
                                    style={{
                                        aspectRatio: editingAspectRatio,
                                        width: editingIsWide ? "100%" : "auto",
                                        height: editingIsWide ? "auto" : "100%",
                                        maxWidth: "100%",
                                        maxHeight: "100%"
                                    }}
                                >
                                    <img
                                        src={editingImage.preview}
                                        alt={editingImage.name}
                                        className="absolute inset-0 h-full w-full select-none pointer-events-none"
                                        style={{
                                            objectFit: "fill",
                                            transform: `translate(${editingImage.pan?.x || 0}%, ${editingImage.pan?.y || 0
                                                }%) scale(${editingImage.zoom || 1})`,
                                            transformOrigin: "center"
                                        }}
                                        draggable="false"
                                    />

                                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                                    <div
                                        onPointerDown={(event) => startCropAction(event, "move")}
                                        className="absolute border-2 border-white cursor-move"
                                        style={{
                                            left: `${editingImage.crop.x}%`,
                                            top: `${editingImage.crop.y}%`,
                                            width: `${editingImage.crop.width}%`,
                                            height: `${editingImage.crop.height}%`,
                                            boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)"
                                        }}
                                    >
                                        <div className="absolute inset-0 border border-[#87CCC8] pointer-events-none" />

                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 px-3 py-2 text-xs font-black flex items-center gap-2 pointer-events-none">
                                            <Move size={14} />
                                            Mover recorte
                                        </div>

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "nw")}
                                            className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-[#87CCC8] border-2 border-white cursor-nwse-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "ne")}
                                            className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-[#87CCC8] border-2 border-white cursor-nesw-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "sw")}
                                            className="absolute -left-4 -bottom-4 h-8 w-8 rounded-full bg-[#87CCC8] border-2 border-white cursor-nesw-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "se")}
                                            className="absolute -right-4 -bottom-4 h-8 w-8 rounded-full bg-[#87CCC8] border-2 border-white cursor-nwse-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "n")}
                                            className="absolute left-1/2 -top-3 h-6 w-14 -translate-x-1/2 rounded-full bg-white border-2 border-[#87CCC8] cursor-ns-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "s")}
                                            className="absolute left-1/2 -bottom-3 h-6 w-14 -translate-x-1/2 rounded-full bg-white border-2 border-[#87CCC8] cursor-ns-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "w")}
                                            className="absolute -left-3 top-1/2 h-14 w-6 -translate-y-1/2 rounded-full bg-white border-2 border-[#87CCC8] cursor-ew-resize"
                                        />

                                        <button
                                            type="button"
                                            onPointerDown={(event) => startCropAction(event, "e")}
                                            className="absolute -right-3 top-1/2 h-14 w-6 -translate-y-1/2 rounded-full bg-white border-2 border-[#87CCC8] cursor-ew-resize"
                                        />
                                    </div>
                                </div>
                            </div>

                            <aside className="rounded-[28px] bg-[#F8F6F7] p-5 h-fit">
                                <div className="flex items-center gap-2">
                                    <ZoomIn size={20} className="text-[#87CCC8]" />
                                    <h4 className="font-black text-lg">Ajustes manuales</h4>
                                </div>

                                <p className="mt-2 text-sm text-gray-600 leading-6">
                                    Arrastra dentro del cuadro para moverlo. Arrastra las esquinas
                                    o los bordes para cambiar el tamaño del recorte.
                                </p>

                                <div className="mt-5 rounded-3xl bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-black text-[#2F2F2F]">Zoom</p>
                                        <span className="rounded-full bg-[#87CCC8]/15 px-3 py-1 text-xs font-black text-[#87CCC8]">
                                            {(editingImage.zoom || 1).toFixed(1)}x
                                        </span>
                                    </div>

                                    <input
                                        type="range"
                                        min={MIN_ZOOM}
                                        max={MAX_ZOOM}
                                        step="0.1"
                                        value={editingImage.zoom || 1}
                                        onChange={(event) => updateZoom(event.target.value)}
                                        className="mt-4 w-full accent-[#87CCC8]"
                                    />
                                    <button
                                        type="button"
                                        onClick={centerImage}
                                        className="mt-4 w-full rounded-2xl bg-[#F8F6F7] px-4 py-3 text-xs font-black"
                                    >
                                        Centrar imagen
                                    </button>
                                    <div className="mt-2 flex justify-between text-[11px] text-gray-400">
                                        <span>1x</span>
                                        <span>3x</span>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-3xl bg-white p-4">
                                    <p className="font-black text-[#2F2F2F]">
                                        Vista previa final
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Así se verá la imagen en el listado y para el cliente.
                                    </p>

                                    <CroppedImagePreview
                                        image={editingImage}
                                        alt={editingImage.name}
                                        className="mt-4 h-44 w-full"
                                        rounded="rounded-3xl"
                                        ignoreFinalPreview
                                    />
                                </div>

                                <div className="mt-6 rounded-3xl bg-white p-4 text-sm text-gray-600">
                                    <p className="font-black text-[#2F2F2F]">
                                        Información de imagen
                                    </p>

                                    <p className="mt-2">
                                        <strong>Archivo:</strong> {editingImage.name}
                                    </p>

                                    <p className="mt-1">
                                        <strong>Peso base:</strong>{" "}
                                        {formatFileSize(editingImage.size)}
                                    </p>

                                    <p className="mt-1">
                                        <strong>Recorte:</strong>{" "}
                                        {Math.round(editingImage.crop.width)}% x{" "}
                                        {Math.round(editingImage.crop.height)}%
                                    </p>

                                    <p className="mt-1">
                                        <strong>Zoom:</strong> {(editingImage.zoom || 1).toFixed(1)}x
                                    </p>

                                    <p className="mt-1">
                                        <strong>Peso final objetivo:</strong> máximo{" "}
                                        {cropCompressionRules.maxFinalSizeKB} KB
                                    </p>

                                    {editingImage.finalSize && (
                                        <p className="mt-1 text-[#87CCC8] font-bold">
                                            <strong>Último recorte guardado:</strong>{" "}
                                            {formatFileSize(editingImage.finalSize)}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={resetCrop}
                                    className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={17} />
                                    Restaurar recorte y zoom
                                </button>

                                {cropSaveError && (
                                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                                        {cropSaveError}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={saveCropAdjustment}
                                    disabled={isSavingCrop}
                                    className="mt-3 w-full smika-button-primary disabled:opacity-60"
                                >
                                    {isSavingCrop ? "Procesando recorte..." : "Guardar ajuste"}
                                </button>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageDropzone;