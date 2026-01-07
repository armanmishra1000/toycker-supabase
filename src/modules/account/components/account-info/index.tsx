import { Disclosure } from "@headlessui/react"
import { Button } from "@modules/common/components/button"
import { cn } from "@lib/util/cn"
import { useEffect } from "react"
import { useFormStatus } from "react-dom"

import useToggleState from "@lib/hooks/use-toggle-state"

// Separate component to use useFormStatus inside form context
const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <Button
      isLoading={pending}
      className="rounded-xl bg-primary border-primary shadow-none hover:bg-foreground transition-all text-base"
      type="submit"
      data-testid="save-button"
      size="base"
    >
      Save changes
    </Button>
  )
}

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
  editable?: boolean
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "An error occurred, please try again",
  children,
  'data-testid': dataTestid,
  editable = true,
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const handleToggle = () => {
    clearState()
    toggle()
  }

  useEffect(() => {
    if (isSuccess) {
      close()
      // Auto-clear success message after 3 seconds
      const timer = setTimeout(() => {
        clearState()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, close, clearState])

  if (!editable) {
    return (
      <div className="text-sm" data-testid={dataTestid}>
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="uppercase text-gray-500 text-xs font-semibold">{label}</span>
            <div className="flex items-center flex-1 basis-0 justify-end gap-x-4">
              {typeof currentInfo === "string" ? (
                <span className="font-semibold text-gray-900" data-testid="current-info">
                  {currentInfo}
                </span>
              ) : (
                currentInfo
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm" data-testid={dataTestid}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="uppercase text-gray-500 text-xs font-semibold">{label}</span>
          <div className="flex items-center flex-1 basis-0 justify-end gap-x-4">
            {typeof currentInfo === "string" ? (
              <span className="font-semibold text-gray-900" data-testid="current-info">{currentInfo}</span>
            ) : (
              currentInfo
            )}
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            className="w-[100px] min-h-[35px] py-1 rounded-xl"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleToggle()
            }}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Success state */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={cn(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isSuccess,
              "max-h-0 opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <div className="p-2 my-4 bg-green-100 text-green-700 rounded text-xs font-medium">
            <span>{label} updated successfully</span>
          </div>
        </Disclosure.Panel>
      </Disclosure>

      {/* Error state  */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={cn(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError,
              "max-h-0 opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <div className="p-2 my-4 bg-red-100 text-red-700 rounded text-xs font-medium">
            <span>{errorMessage}</span>
          </div>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={cn(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": state,
              "max-h-0 opacity-0": !state,
            }
          )}
        >
          <div className="flex flex-col gap-y-2 py-4">
            <div>{children}</div>
            <div className="flex items-center justify-end mt-2">
              <SubmitButton />
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
