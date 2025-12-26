import { ageCategories, navLinks, AgeCategory, NavLink } from "@modules/layout/config/navigation"

export type NavigationConfig = {
  navLinks: NavLink[]
  ageCategories: AgeCategory[]
}

export const getNavigationConfig = async (): Promise<NavigationConfig> => {
  return {
    navLinks,
    ageCategories,
  }
}
