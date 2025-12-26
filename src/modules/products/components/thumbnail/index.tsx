import { Container, clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: HttpTypes.StoreProductImage[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const gallery = (images ?? []).filter((image): image is HttpTypes.StoreProductImage => Boolean(image?.url))
  const primaryImage = thumbnail || gallery[0]?.url || null
  const secondaryImage = gallery.find((image) => image.url && image.url !== primaryImage)?.url || null
  const hasHoverImage = Boolean(primaryImage && secondaryImage)

  return (
    <Container
      className={clx(
        "group/thumbnail relative w-full overflow-hidden rounded-large bg-ui-bg-subtle p-4 shadow-elevation-card-rest transition-shadow ease-in-out duration-150 hover:shadow-elevation-card-hover",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      {primaryImage ? (
        <div className="relative h-full w-full">
          <MediaLayer url={primaryImage} isPrimary hasHoverImage={hasHoverImage} />
          {hasHoverImage && secondaryImage && (
            <MediaLayer url={secondaryImage} isPrimary={false} hasHoverImage={hasHoverImage} />
          )}
        </div>
      ) : (
        <PlaceholderFallback size={size} />
      )}
    </Container>
  )
}

const PlaceholderFallback = ({ size }: Pick<ThumbnailProps, "size">) => (
  <div className="absolute inset-0 flex h-full w-full items-center justify-center">
    <PlaceholderImage size={size === "small" ? 16 : 24} />
  </div>
)

const videoExtensions = /\.(mp4|webm|ogg)$/i
const gifExtension = /\.gif$/i

const classifyMedia = (url: string) => {
  if (videoExtensions.test(url)) {
    return "video" as const
  }
  if (gifExtension.test(url)) {
    return "gif" as const
  }
  return "image" as const
}

const MediaLayer = ({
  url,
  isPrimary,
  hasHoverImage,
}: {
  url: string
  isPrimary: boolean
  hasHoverImage: boolean
}) => {
  const type = classifyMedia(url)
  const baseClass = clx(
    "absolute inset-0 h-full w-full object-cover object-center transition-all duration-300 ease-out",
    hasHoverImage
      ? isPrimary
        ? "opacity-100 group-hover/thumbnail:opacity-0"
        : "opacity-0 scale-[1.01] group-hover/thumbnail:opacity-100 group-hover/thumbnail:scale-[1.05]"
      : "opacity-100"
  )

  if (type === "video") {
    return (
      <video
        className={baseClass}
        src={url}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
    )
  }

  return (
    <Image
      src={url}
      alt="Product thumbnail"
      fill
      draggable={false}
      quality={type === "gif" ? 90 : 50}
      unoptimized={type === "gif"}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      className={baseClass}
    />
  )
}

export default Thumbnail
