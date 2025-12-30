import { Text } from "@modules/common/components/text"

type LineItemOptionsProps = {
  variant: any
  "data-testid"?: string
  "data-value"?: any
}

const LineItemOptions = ({
  variant,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  // Don't show variant if title is "Default Title", "Default Variant" or if variant doesn't exist
  if (!variant?.title ||
      variant?.title === "Default Title" ||
      variant?.title === "Title: Default Title" ||
      variant?.title === "Default Variant" ||
      variant?.title === "Default variant") {
    return null
  }

  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block text-sm sm:text-base text-gray-500 w-full overflow-hidden text-ellipsis whitespace-nowrap"
    >
      {variant?.title}

    </Text>
  )
}

export default LineItemOptions
