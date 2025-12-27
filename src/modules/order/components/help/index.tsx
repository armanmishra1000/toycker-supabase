import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/text"
import React from "react"

const Help = () => {
  return (
    <div className="mt-6">
      <Text className="text-base font-semibold">Need help?</Text>
      <div className="text-sm font-normal my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href="/contact">Contact</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/contact">
              Returns & Exchanges
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help