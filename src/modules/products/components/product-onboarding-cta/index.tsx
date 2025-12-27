import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import { cookies as nextCookies } from "next/headers"

async function ProductOnboardingCta() {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <div className="max-w-4xl h-full bg-gray-50 border border-gray-200 rounded-lg w-full p-8">
      <div className="flex flex-col gap-y-4 center text-center">
        <Text weight="semibold" className="text-gray-900 text-xl">
          Your demo product was successfully created! 🎉
        </Text>
        <Text className="text-gray-500 text-sm">
          You can now continue setting up your store in the admin.
        </Text>
        <a href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs">
          <Button className="w-full">Continue setup in admin</Button>
        </a>
      </div>
    </div>
  )
}

export default ProductOnboardingCta
