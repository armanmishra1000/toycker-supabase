import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (..._args: any[]) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex gap-x-3 flex-col gap-y-3">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</Text>
      <div data-testid={dataTestId} className="space-y-2">
        {items?.map((i) => (
          <div
            key={i.value}
            className={cn("flex gap-x-2 items-center")}
            onClick={() => handleChange(i.value)}
          >
            <div className="relative flex items-center justify-center h-4 w-4">
              <input
                type="radio"
                checked={i.value === value}
                onChange={() => handleChange(i.value)}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                id={i.value}
                value={i.value}
              />
            </div>
            <label
              htmlFor={i.value}
              className={cn(
                "text-sm text-gray-500 hover:cursor-pointer transition-colors",
                {
                  "text-gray-900 font-medium": i.value === value,
                }
              )}
              data-testid="radio-label"
              data-active={i.value === value}
            >
              {i.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FilterRadioGroup
