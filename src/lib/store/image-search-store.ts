import { create } from "zustand"

interface ImageSearchState {
    file: File | null
    previewUrl: string | null
    setImage: (file: File | null) => void
    clear: () => void
}

export const useImageSearchStore = create<ImageSearchState>((set) => ({
    file: null,
    previewUrl: null,
    setImage: (file) => {
        set((state) => {
            if (state.previewUrl) {
                URL.revokeObjectURL(state.previewUrl)
            }

            if (!file) {
                return { file: null, previewUrl: null }
            }

            const previewUrl = URL.createObjectURL(file)
            return { file, previewUrl }
        })
    },
    clear: () => {
        set((state) => {
            if (state.previewUrl) {
                URL.revokeObjectURL(state.previewUrl)
            }
            return { file: null, previewUrl: null }
        })
    },
}))
