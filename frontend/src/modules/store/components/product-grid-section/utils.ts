import { ViewMode } from "@modules/store/components/refinement-list/types"

export const getGridClassName = (mode: ViewMode) => {
  if (mode === "grid-5") {
    return "grid w-full grid-cols-1 gap-x-5 gap-y-8 small:grid-cols-2 medium:grid-cols-5"
  }

  if (mode === "grid-4") {
    return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-4"
  }

  if (mode === "list") {
    return "flex w-full flex-col gap-5"
  }

  return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-4"
}
