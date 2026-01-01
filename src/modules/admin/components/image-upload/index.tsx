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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
  }

  return (
    <div className="space-y-4">
      {/* Hidden input to store the URL for form submission */}
      <input type="hidden" name={name} value={imageUrl} />

      {/* Image Preview */}
      {imageUrl && (
        <div className="relative w-48 aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group">
          <img
            src={imageUrl}
            alt="Product preview"
            className="object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div>
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
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhotoIcon className="h-5 w-5" />
          {isUploading ? `Uploading... ${uploadProgress}%` : "Upload Image"}
        </button>
        <p className="mt-2 text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
      </div>

      {/* Or Manual URL Input */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">or enter URL:</span>
      </div>
      <input
        type="url"
        value={imageUrl}
        onChange={handleUrlChange}
        placeholder="https://cdn.toycker.in/..."
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0"
      />

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  )
}
