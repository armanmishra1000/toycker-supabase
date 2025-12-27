"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  return (
    <div className="max-w-4xl h-full bg-gray-50 w-full rounded-lg border border-gray-200">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-gray-900 text-xl font-semibold">
          Your test order was successfully created! 🎉
        </Text>
        <Text className="text-gray-500 text-sm">
          You can now complete setting up your store in the admin.
        </Text>
        <Button
          className="w-fit"
          size="large"
          onClick={() => resetOnboardingState(orderId)}
        >
          Complete setup in admin
        </Button>
      </div>
    </div>
  )
}

export default OnboardingCta