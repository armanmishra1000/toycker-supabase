import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

const COLOR_SWATCH_MAP: Record<string, string> = {
  red: "#E94235",
  orange: "#FF8A3C",
  yellow: "#F6E36C",
  green: "#3BB273",
  blue: "#3A7BEB",
  navy: "#1D3C78",
  purple: "#8E44AD",
  pink: "#FF5D8F",
  black: "#111111",
  white: "#FAFAFA",
  grey: "#D9D9D9",
  gray: "#D9D9D9",
  brown: "#9B5B2A",
}

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
  layout?: "pill" | "swatch"
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  layout = "pill",
}) => {
  const filteredOptions = option.values ?? []
  const isSwatch = layout === "swatch"

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ui-fg-base">
          {isSwatch ? `${title}` : `Select ${title}`}
        </span>
        {isSwatch && (
          <span className="text-sm text-ui-fg-muted">
            Color: {current ?? "Choose"}
          </span>
        )}
      </div>
      <div
        className="flex flex-wrap gap-3"
        data-testid={dataTestId}
      >
        {filteredOptions.map((optionValue) => {
          const value = optionValue.value
          const normalized = value ? value.toLowerCase().trim() : ""
          const colorToken =
            (optionValue as any)?.metadata?.hex ||
            (normalized ? COLOR_SWATCH_MAP[normalized] : undefined)

          return (
            <button
              onClick={() => updateOption(option.id, value)}
              key={optionValue.id ?? value}
              className={clx(
                "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive",
                isSwatch
                  ? `relative flex h-12 w-12 items-center justify-center rounded-full border ${
                      value === current
                        ? "border-[#E7353A] ring-2 ring-[#FDD5DB]"
                        : "border-transparent"
                    }`
                  : `border-ui-border-base bg-ui-bg-subtle border text-sm font-medium rounded-full px-5 py-2 ${
                      value === current ? "border-[#E7353A] text-ui-fg-base" : "text-ui-fg-muted"
                    }`
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {isSwatch ? (
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: colorToken || "#f4f4f4" }}
                >
                  {!colorToken && (
                    <span className="text-xs font-semibold text-ui-fg-base">
                      {value}
                    </span>
                  )}
                  <span className="sr-only">{value}</span>
                </span>
              ) : (
                value
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
