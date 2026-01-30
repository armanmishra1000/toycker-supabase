"use client"

import { useState } from "react"
import ImageUploader from "./image-uploader"

type Props = {
    initialImageUrl?: string | null
    folder: "categories" | "collections"
}

export default function CatalogImageSection({ initialImageUrl, folder }: Props) {
    const [imageUrl, setImageUrl] = useState(initialImageUrl || "")

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
                Feature Image
            </label>
            <p className="text-xs text-gray-500 mb-3">
                This image will be displayed on the {folder} index page.
            </p>

            <input type="hidden" name="image_url" value={imageUrl} />

            <div className="max-w-md">
                <ImageUploader
                    folder={folder}
                    value={imageUrl}
                    onChange={setImageUrl}
                    acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                    maxSizeMB={5}
                />
            </div>
        </div>
    )
}
