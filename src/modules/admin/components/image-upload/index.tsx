"use client"

import { useState, useRef } from "react"
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { getFileUrl } from "@/lib/r2"

interface ImageUploadProps {
  name: string
  initialUrl?: string
  label?: string
}

export default function ImageUpload({ name, initialUrl, label = "Image URL" }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(initialUrl || "")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get presigned URL for upload
      const { url, key, error } = await getPresignedUploadUrl({
        fileType: file.type,
        folder: "products",
      })

      if (error || !url || !key) {
        throw new Error(error || "Failed to initialize upload")
      }

      // Upload the file with progress tracking
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          // Generate public URL
          const publicUrl = getFileUrl(key)
          setImageUrl(publicUrl)
          setUploadProgress(100)
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`)
        }
        setIsUploading(false)
      })

      xhr.addEventListener("error", () => {
        setIsUploading(false)
        alert("Failed to upload image. Please try again.")
      })

      xhr.open("PUT", url)
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.send(file)
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      alert("Failed to upload image. Please try again.")
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = () => {
    setImageUrl("")
  }

  return (
    <div className="space-y-4">
      {/* Hidden input to store the URL for form submission */}
      <input type="hidden" name={name} value={imageUrl} />

      {/* Image Preview */}
      {imageUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] group transition-all hover:shadow-md">
          <img
            src={imageUrl}
            alt="Product preview"
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-red-600 shadow-sm border border-gray-100"
            title="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Button */}
      {!imageUrl && (
        <div className="group relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-sm transition-all animate-in fade-in zoom-in-95 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
              <PhotoIcon className="h-6 w-6 text-gray-400 group-hover:text-black" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">
                {isUploading ? `Uploading... ${uploadProgress}%` : `Upload ${label}`}
              </p>
              <p className="mt-1 text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
            </div>
          </button>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="absolute inset-x-0 -bottom-1">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
