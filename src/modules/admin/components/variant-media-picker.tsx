"use client"

import { useState } from "react"
import Image from "next/image"
import { PhotoIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@lib/util/cn"

interface VariantMediaPickerProps {
    images: string[]
    selectedImage: string | null
    onSelect: (url: string | null) => void
}

export default function VariantMediaPicker({
    images,
    selectedImage,
    onSelect
}: VariantMediaPickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center transition-all bg-gray-50/50 hover:bg-white overflow-hidden group-hover:border-indigo-400 group-hover:scale-105",
                    selectedImage ? "border-indigo-400" : "border-gray-200"
                )}
            >
                {selectedImage ? (
                    <Image
                        src={selectedImage}
                        alt="Variant"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                    />
                ) : (
                    <PhotoIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-0 left-full ml-4 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 min-w-[300px] max-w-[400px]">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                <div>
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Select Image</h4>
                                    <p className="text-[10px] text-gray-400 font-medium">Assign to this variant</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {images.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 border border-dashed border-gray-100 rounded-lg">
                                    <PhotoIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">No product images</p>
                                    <p className="text-[9px] text-gray-300 mt-1">Upload images to the gallery first</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelect(null)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all hover:bg-white",
                                            !selectedImage ? "border-indigo-500 bg-white" : "border-gray-50 bg-gray-50/50 hover:border-gray-200"
                                        )}
                                    >
                                        <XMarkIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-[8px] font-black text-gray-400 uppercase">None</span>
                                    </button>
                                    {images.map((url, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                onSelect(url)
                                                setIsOpen(false)
                                            }}
                                            className={cn(
                                                "aspect-square rounded-lg border-2 overflow-hidden transition-all relative group/img",
                                                selectedImage === url ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-gray-50 hover:border-gray-200"
                                            )}
                                        >
                                            <Image
                                                src={url}
                                                alt={`Option ${idx}`}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            {selectedImage === url && (
                                                <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                                                    <div className="bg-indigo-500 rounded-full p-0.5 shadow-lg">
                                                        <CheckIcon className="w-3 h-3 text-white stroke-[3]" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <p className="text-[9px] text-gray-400 italic font-medium leading-tight">
                                    Tip: Assigning a unique image helps customers see exactly what they're buying.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
