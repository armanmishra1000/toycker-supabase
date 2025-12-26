import { sanitizeRichText } from "@lib/util/sanitize-html"
import { clx } from "@medusajs/ui"
import type { ComponentPropsWithoutRef, ElementType } from "react"

type SafeRichTextProps<T extends ElementType> = {
  html?: string | null
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, "dangerouslySetInnerHTML" | "children">

const defaultElement = "div"

const SafeRichText = <T extends ElementType = typeof defaultElement>({
  html,
  as,
  className,
  ...rest
}: SafeRichTextProps<T>) => {
  const sanitized = sanitizeRichText(html)

  if (!sanitized) {
    return null
  }

  const Component = (as || defaultElement) as ElementType

  return (
    <Component
      className={clx(className)}
      {...rest}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

export default SafeRichText
