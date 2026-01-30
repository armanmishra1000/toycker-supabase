import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { listCollections } from "@lib/data/collections"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { CatalogLayout, CatalogGridWrapper } from "@modules/common/components/catalog-layout"

import { Pagination } from "@modules/store/components/pagination"

export const metadata: Metadata = {
    title: "Collections | Toycker",
    description: "Explore our exclusive product collections.",
}

export const revalidate = 60

const PAGE_SIZE = 12

export default async function CollectionsPage(props: {
    searchParams: Promise<{ page?: string }>
}) {
    const searchParams = await props.searchParams
    const page = searchParams.page ? parseInt(searchParams.page) : 1
    const { collections, count } = await listCollections(page, PAGE_SIZE)
    const totalPages = Math.ceil(count / PAGE_SIZE)

    return (
        <div className="mx-auto p-4 max-w-[1440px] pb-10 w-full">
            <CatalogLayout>
                <Breadcrumbs
                    items={[
                        { label: "Store", href: "/store" },
                        { label: "Collections" },
                    ]}
                    className="mb-6 hidden small:block"
                />

                <div className="mb-10">
                    <h1 className="mb-4 text-3xl font-semibold text-slate-900">
                        Our Collections
                    </h1>
                    <p className="mt-4 text-lg text-slate-600">
                        Discover unique selections of toys and collectibles.
                    </p>
                </div>

                <CatalogGridWrapper page={page}>
                    <div className="flex flex-wrap -mx-3">
                        {collections.map((collection) => (
                            <div key={collection.id} className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 px-3 mb-6">
                                <Link
                                    href={`/collections/${collection.handle.replace(/^\//, "")}`}
                                    className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                >
                                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                        {collection.image_url ? (
                                            <Image
                                                src={collection.image_url}
                                                alt={collection.title}
                                                width={400}
                                                height={300}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                <svg
                                                    className="h-12 w-12"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-[#ed1c24]">
                                            {collection.title}
                                        </h3>
                                        <div className="mt-auto pt-2">
                                            <span className="inline-flex items-center text-sm font-bold text-[#ed1c24]">
                                                Explore Collection
                                                <svg
                                                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </CatalogGridWrapper>

                {totalPages > 1 && (
                    <Pagination page={page} totalPages={totalPages} />
                )}
            </CatalogLayout>
        </div>
    )
}
