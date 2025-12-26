"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import SafeRichText from "@modules/common/components/safe-rich-text"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Description",
      component: <DescriptionTab description={product.description} />,
    },
    {
      label: "Shipping & Returns",
      component: <ShippingReturnsTab />,
    },
  ]

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white mb-5">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
            className="border-transparent px-4"
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DescriptionTab = ({
  description,
}: {
  description?: string | null
}) => {
  const hasDescription = Boolean(description && description.trim())

  return (
    <div className="space-y-3 py-6 text-sm text-slate-600">
      <SafeRichText html={description} className="rich-text-block text-slate-600" />
      {!hasDescription && <p>Product description will be updated shortly.</p>}
    </div>
  )
}

const ShippingReturnsTab = () => (
  <div className="space-y-4 py-6 text-sm text-slate-700">
    <div>
      <p className="font-semibold">Order Now and Get it Delivered.</p>
      <p className="text-ui-fg-subtle">
        We dispatch within 24 hours and deliver across India via express partners.
      </p>
    </div>
    <div>
      <p className="font-semibold">Cash On Delivery is Available</p>
      <p className="text-ui-fg-subtle">
        Choose COD at checkout for a worry-free purchase experience.
      </p>
    </div>
    <div>
      <p className="font-semibold">
        Easy Returns / Exchanges Policy (Wrong/Damaged items Only)
      </p>
      <p className="text-ui-fg-subtle">
        Share unboxing photos within 48 hours and we will arrange a free exchange.
      </p>
    </div>
  </div>
)

export default ProductTabs
