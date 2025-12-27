import * as React from "react"
import { cn } from "@lib/util/cn"

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: "xsmall" | "small" | "base" | "large" | "xlarge"
  weight?: "regular" | "medium" | "semibold" | "bold"
  as?: "p" | "span" | "div"
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size = "base", weight = "regular", as: Component = "p", ...props }, ref) => {
    const sizes = {
      xsmall: "text-xs",
      small: "text-sm",
      base: "text-base",
      large: "text-lg",
      xlarge: "text-xl",
    }

    const weights = {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    }

    return (
      <Component
        ref={ref as any}
        className={cn(sizes[size], weights[weight], className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text }
