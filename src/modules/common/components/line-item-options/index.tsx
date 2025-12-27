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
  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block text-sm text-gray-500 w-full overflow-hidden text-ellipsis"
    >
      Variant: {variant?.title}
    </Text>
  )
}

export default LineItemOptions
