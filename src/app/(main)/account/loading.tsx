const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
)

export default function Loading() {
    return (
        <div className="content-container py-12">
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="flex flex-col gap-2 p-4 border rounded-lg">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="flex flex-col gap-2 p-4 border rounded-lg">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
