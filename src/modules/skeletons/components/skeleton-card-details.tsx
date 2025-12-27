const SkeletonCardDetails = () => {
  return (
    <div className="flex flex-col gap-y-2 animate-pulse mb-4 mt-4">
      <div className="w-full h-8 bg-gray-100 rounded-md"></div>
      <div className="grid grid-cols-2 gap-x-2">
        <div className="w-full h-8 bg-gray-100 rounded-md"></div>
        <div className="w-full h-8 bg-gray-100 rounded-md"></div>
      </div>
    </div>
  )
}

export default SkeletonCardDetails