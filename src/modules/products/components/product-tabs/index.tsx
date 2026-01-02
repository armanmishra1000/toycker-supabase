"use client"

import Accordion from "./accordion"
import { Product } from "@/lib/supabase/types"
import SafeRichText from "@modules/common/components/safe-rich-text"

type ProductTabsProps = {
  product: Product
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
  <div className="py-6 text-sm text-slate-700">
    <p>Quick Delivery & 7-Day Return Policy</p>
  </div>
)

export default ProductTabs
