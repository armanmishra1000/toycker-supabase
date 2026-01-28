import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Related products
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <div className="overflow-hidden md:overflow-visible">
        <ul className="flex md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-8 -ml-4 md:ml-0">
          {repeat(4).map((index) => (
            <li
              key={index}
              className="flex-[0_0_80%] small:flex-[0_0_45%] min-w-0 pl-4 md:pl-0 md:flex-none"
            >
              <SkeletonProductPreview />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default SkeletonRelatedProducts