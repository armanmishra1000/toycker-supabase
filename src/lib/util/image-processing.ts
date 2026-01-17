/**
 * Resizes an image to a maximum dimension and converts it to a JPEG blob.
 * This helps stay within payload limits and ensures format compatibility.
 */
export async function resizeImage(file: File, maxDimension = 512): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement("canvas")
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > maxDimension) {
                        height *= maxDimension / width
                        width = maxDimension
                    }
                } else {
                    if (height > maxDimension) {
                        width *= maxDimension / height
                        height = maxDimension
                    }
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("Could not get canvas context"))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error("Canvas toBlob failed"))
                        }
                    },
                    "image/jpeg",
                    0.85
                )
            }
            img.onerror = () => reject(new Error("Failed to load image into element"))
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
    })
}
