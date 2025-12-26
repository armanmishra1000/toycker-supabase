import { getNavigationConfig } from "@lib/data/navigation"
import Header from "@modules/layout/components/header"

export default async function Nav() {
  const navigationConfig = await getNavigationConfig()

  return (
    <Header
      navLinks={navigationConfig.navLinks}
      ageCategories={navigationConfig.ageCategories}
    />
  )
}
