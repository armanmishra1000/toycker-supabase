import { ViewMode } from "@modules/store/components/refinement-list/types"

export const getGridClassName = (mode: ViewMode) => {
  if (mode === "grid-5") {
    return "flex flex-wrap -mx-2 sm:-mx-3"
  }

  if (mode === "grid-4") {
    return "flex flex-wrap -mx-2 sm:-mx-3"
  }

  if (mode === "list") {
    return "flex w-full flex-col gap-5"
  }

  return "flex flex-wrap -mx-2 sm:-mx-3"
}

export const getGridItemClassName = (mode: ViewMode) => {
  if (mode === "grid-5") {
    return "w-full xsmall:w-1/2 small:w-1/3 medium:w-1/5 px-2 sm:px-3 mb-8"
  }

  if (mode === "grid-4") {
    return "w-full xsmall:w-1/2 small:w-1/3 medium:w-1/4 px-2 sm:px-3 mb-8"
  }

  return "w-full xsmall:w-1/2 small:w-1/3 medium:w-1/4 px-2 sm:px-3 mb-8"
}
