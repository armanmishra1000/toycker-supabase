"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { getFileUrl } from "@/lib/r2"
import { useToast } from "@modules/common/context/toast-context"

type Props = {
    folder: "banners" | "exclusive-videos"
    value?: string
    onChange: (url: string) => void
    acceptedFormats: string[]
    maxSizeMB: number
}

export default function ImageUploader({
    folder,
    value,
    onChange,
    acceptedFormats,
    maxSizeMB,
}: Props) {
    const { showToast } = useToast()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const handleUpload = async (file: File) => {
        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            showToast(`File must be smaller than ${maxSizeMB}MB`, "error")
            return
        }

        // Validate file type
        if (!acceptedFormats.includes(file.type)) {
            showToast(`Invalid file type. Allowed: ${acceptedFormats.join(", ")}`, "error")
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Step 1: Get presigned URL
            const { url, key, error } = await getPresignedUploadUrl({
                fileType: file.type,
                folder,
                maxSizeMB,
            })

            if (error || !url || !key) {
                throw new Error(error || "Failed to get upload URL")
            }

            // Step 2: Upload to R2 with progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100)
                        setUploadProgress(percent)
                    }
                })

                xhr.addEventListener("load", () => {
                    if (xhr.status === 200) {
                        const publicUrl = getFileUrl(key)
                        onChange(publicUrl)
                        showToast("Upload complete!", "success")
                        resolve()
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`))
                    }
                })

                xhr.addEventListener("error", () => {
                    reject(new Error("Network error during upload"))
                })

                xhr.open("PUT", url)
                xhr.setRequestHeader("Content-Type", file.type)
                xhr.send(file)
            })
        } catch (error) {
            console.error("Upload error:", error)
            showToast(
                error instanceof Error ? error.message : "Upload failed. Please try again.",
                "error"
            )
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleUpload(file)
        }
        // Reset input
        e.target.value = ""
    }

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)

            const file = e.dataTransfer.files[0]
            if (file) {
                handleUpload(file)
            }
        },
        [handleUpload]
    )

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleRemove = () => {
        onChange("")
    }

    const isImage = folder === "banners"
    const isVideo = folder === "exclusive-videos"

    return (
        <div className="space-y-4">
            {value && !isUploading ? (
                <div className="relative group">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-300">
                        {isImage ? (
                            <Image
                                src={value}
                                alt="Uploaded image"
                                fill
                                className="object-cover"
                            />
                        ) : isVideo ? (
                            <video
                                src={value}
                                className="w-full h-full object-cover"
                                controls
                            />
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-colors"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-300 hover:border-gray-400"
                        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                    <input
                        type="file"
                        accept={acceptedFormats.join(",")}
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        disabled={isUploading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        {isUploading ? (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto">
                                    <div
                                        className="h-full bg-gray-900 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="mt-2 text-sm text-gray-600">
                                    {isDragging
                                        ? "Drop the file here"
                                        : "Drag & drop a file here, or click to select"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Max {maxSizeMB}MB • {acceptedFormats.map((f) => f.split("/")[1]).join(", ")}
                                </p>
                            </>
                        )}
                    </label>
                </div>
            )}
        </div>
    )
}
