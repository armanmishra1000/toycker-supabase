/**
 * HeroSkeleton - Loading placeholder for hero banner section
 * Matches the aspect ratio and layout of the Hero component
 */

export default function HeroSkeleton() {
    return (
        <section className="w-full">
            <div className="w-full md:px-4 md:py-8">
                <div className="relative overflow-hidden">
                    {/* Main hero skeleton */}
                    <div className="flex gap-4">
                        {/* Primary slide skeleton */}
                        <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0">
                            <div className="relative w-full overflow-hidden md:rounded-2xl aspect-[16/9] bg-gray-200">
                                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                            </div>
                        </div>
                        {/* Secondary slide skeleton (visible on larger screens) */}
                        <div className="hidden md:block w-1/2 lg:w-2/5 flex-shrink-0">
                            <div className="relative w-full overflow-hidden rounded-2xl aspect-[16/9] bg-gray-200">
                                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
