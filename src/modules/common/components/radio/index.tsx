import { cn } from "@lib/util/cn"

const Radio = ({ checked, 'data-testid': dataTestId }: { checked: boolean, 'data-testid'?: string }) => {
  return (
    <div className="relative flex items-center">
      <div
        data-testid={dataTestId || 'radio-button'}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200",
          {
            "border-blue-600 bg-white": checked,
            "border-gray-300 bg-white hover:border-gray-400": !checked,
          }
        )}
      >
        {checked && (
          <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-in zoom-in duration-150" />
        )}
      </div>
    </div>
  )
}

export default Radio
