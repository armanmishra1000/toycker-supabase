import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  return (
    <div className="flex items-center space-x-2 ">
      <input
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        id="checkbox"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <label
        htmlFor="checkbox"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  )
}

export default CheckboxWithLabel
