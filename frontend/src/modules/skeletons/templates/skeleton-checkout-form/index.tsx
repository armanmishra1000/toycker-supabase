const SkeletonCheckoutForm = () => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      {/* Skeleton for each checkout step */}
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="bg-white">
          <div className="flex flex-row items-center justify-between mb-6">
            <div className="w-48 h-10 bg-gray-200 animate-pulse rounded" />
          </div>

          <div className="flex flex-col gap-y-4 pb-8">
            {/* Skeleton for form fields */}
            {index === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
                <div className="h-14 w-full max-w-[200px] mt-4 bg-gray-200 animate-pulse rounded" />
              </>
            )}

            {/* Skeleton for shipping options */}
            {index === 2 && (
              <>
                <div className="flex flex-col gap-y-2 mb-4">
                  <div className="w-40 h-5 bg-gray-200 animate-pulse rounded" />
                  <div className="w-64 h-5 bg-gray-200 animate-pulse rounded" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 border border-gray-200 rounded-lg px-8 flex items-center justify-between"
                  >
                    <div className="w-32 h-5 bg-gray-200 animate-pulse rounded" />
                    <div className="w-16 h-5 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
                <div className="h-14 w-full max-w-[200px] mt-4 bg-gray-200 animate-pulse rounded" />
              </>
            )}

            {/* Skeleton for payment methods */}
            {index === 3 && (
              <>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 border border-gray-200 rounded-lg px-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-gray-200 animate-pulse rounded-full" />
                      <div className="w-40 h-5 bg-gray-200 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
                <div className="h-14 w-full max-w-[200px] mt-4 bg-gray-200 animate-pulse rounded" />
              </>
            )}

            {/* Skeleton for review */}
            {index === 4 && (
              <>
                <div className="flex flex-col gap-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-16 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
                <div className="h-14 w-full max-w-[200px] mt-4 bg-gray-200 animate-pulse rounded" />
              </>
            )}
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="w-full h-px bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonCheckoutForm
