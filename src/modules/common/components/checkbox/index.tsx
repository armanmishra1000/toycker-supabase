import React, { useState } from "react"
import { cn } from "@lib/util/cn"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleChange = () => {
    onChange?.()
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer group ">
      <div className="relative flex items-start pt-0.5">
        <input
          className="sr-only"
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          name={name}
          data-testid={dataTestId}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200",
            {
              "border-blue-600 bg-blue-600": checked,
              "border-gray-300 bg-white group-hover:border-gray-400": !checked,
              "ring-2 ring-blue-500 ring-offset-2": isFocused,
            }
          )}
        >
          {checked && (
            <svg
              className="h-3.5 w-3.5 text-white animate-in zoom-in duration-150"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 select-none group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </label>
  )
}

export default CheckboxWithLabel
