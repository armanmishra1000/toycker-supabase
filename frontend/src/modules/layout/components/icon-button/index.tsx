"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface IconButtonProps {
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >
  label: string
  count?: number
  href?: string
  ariaLabel?: string
  onClick?: () => void
  ariaPressed?: boolean
}

const IconButton = ({
  icon: Icon,
  label,
  count = 0,
  href,
  ariaLabel,
  onClick,
  ariaPressed,
}: IconButtonProps) => {
  const content = (
    <div
      className="w-10 h-10 bg-foreground rounded-full transition-colors relative flex justify-center items-center"
      aria-hidden="true"
    >
      <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <LocalizedClientLink
        href={href}
        className="group relative"
        aria-label={ariaLabel || label}
      >
        {content}
      </LocalizedClientLink>
    )
  }

  return (
    <button
      type="button"
      className="group relative"
      onClick={onClick}
      aria-label={ariaLabel || label}
      aria-pressed={ariaPressed}
    >
      {content}
    </button>
  )
}

export default IconButton
