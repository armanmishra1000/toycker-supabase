import { TopProduct } from "@/lib/data/analytics"
import { convertToLocale } from "@/lib/util/money"
import Image from "next/image"
import { PhotoIcon } from "@heroicons/react/24/outline"

export default function TopProducts({ products }: { products: TopProduct[] }) {
    if (products.length === 0) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-gray-500">No product sales yet</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {products.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="w-8 flex-shrink-0 text-center font-bold text-gray-400 text-sm">
                        #{index + 1}
                    </div>

                    <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
                        {product.thumbnail ? (
                            <Image
                                src={product.thumbnail}
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full text-gray-300">
                                <PhotoIcon className="h-5 w-5" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate" title={product.title}>
                            {product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                            {convertToLocale({ amount: product.price, currency_code: product.currency_code })}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{product.total_quantity}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Sold</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
