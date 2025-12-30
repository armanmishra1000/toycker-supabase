import { Cart } from "@/lib/supabase/types"
import { convertToLocale } from "@lib/util/money"
import { Text } from "@modules/common/components/text"
import { CheckCircle } from "lucide-react"

const ShippingInfo = ({ cart }: { cart: Cart }) => {
    const currencyCode = cart.currency_code || cart.region?.currency_code || "INR"
    const shippingMethod = cart.shipping_methods?.[0]

    return (
        <div className="bg-white">
            <div className="flex flex-row items-center justify-between mb-6">
                <Text
                    as="h2"
                    weight="bold"
                    className="flex flex-row text-3xl gap-x-2 items-baseline"
                >
                    Delivery
                    <CheckCircle className="h-6 w-6 text-green-500" />
                </Text>
            </div>

            <div className="text-sm">
                <div className="flex flex-col">
                    <Text weight="bold" className="text-sm text-gray-900 mb-1">
                        Method
                    </Text>
                    <Text className="text-sm text-gray-500">
                        {shippingMethod ? (
                            <>
                                {shippingMethod.name}
                                {" - "}
                                {convertToLocale({
                                    amount: shippingMethod.amount ?? 0,
                                    currency_code: currencyCode,
                                })}
                            </>
                        ) : (
                            "Standard Shipping"
                        )}
                    </Text>
                </div>
            </div>
        </div>
    )
}

export default ShippingInfo
