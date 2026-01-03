/**
 * CategoryMarqueeSkeleton - Loading placeholder for category marquee
 */

export default function CategoryMarqueeSkeleton() {
    return (
        <section className="bg-[#cfbfff] md:py-10 py-4">
            <div className="w-full overflow-hidden">
                <div className="flex items-center gap-6 px-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-6 w-24 bg-purple-300/50 rounded animate-pulse flex-shrink-0"
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
