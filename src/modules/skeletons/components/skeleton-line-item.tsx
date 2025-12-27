const SkeletonLineItem = () => {
  return (
    <tr className="w-full grid grid-cols-[122px_1fr] gap-x-4 border-b border-gray-200 py-4 last:border-none animate-pulse">
      <td className="w-[122px]">
        <div className="w-[122px] h-[122px] bg-gray-100 rounded-lg aspect-square"></div>
      </td>
      <td className="flex flex-col gap-y-2 text-left">
        <div className="flex flex-col gap-y-2">
          <div className="w-32 h-4 bg-gray-100 rounded-md"></div>
          <div className="w-24 h-4 bg-gray-100 rounded-md"></div>
        </div>
        <div className="w-20 h-4 bg-gray-100 rounded-md mt-auto"></div>
      </td>
    </tr>
  )
}

export default SkeletonLineItem