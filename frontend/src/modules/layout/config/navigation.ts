export interface NavLink {
  id: string
  label: string
  href: string
  hasDropdown?: boolean
}

export interface AgeCategory {
  id: string
  label: string
  href: string
}

export interface ShopMenuLink {
  id: string
  label: string
  href: string
}

export interface ShopMenuSection {
  id: string
  title: string
  items: ShopMenuLink[]
  accent?: "muted" | "highlight"
}

export interface ShopMenuPromo {
  title: string
  links: ShopMenuLink[]
  image: {
    src: string
    alt: string
  }
}

export const navLinks: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "shop", label: "Shop", href: "/shop-by-age", hasDropdown: true },
  { id: "about", label: "About Us", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "metal-cars", label: "Metal Car", href: "/collections/metal-car" },
]

export const ageCategories: AgeCategory[] = [
  { id: "0-18-months", label: "0-18 Months", href: "/collections/0-18-months" },
  { id: "18-36-months", label: "18-36 Months", href: "/collections/18-36-months" },
  { id: "3-5-years", label: "3-5 Years", href: "/collections/3-5-years" },
  { id: "5-7-years", label: "5-7 Years", href: "/collections/5-7-years" },
  { id: "7-9-years", label: "7-9 Years", href: "/collections/7-9-years" },
  { id: "9-12-years", label: "9-12 Years", href: "/collections/9-12-years" },
  { id: "12-14-years", label: "12-14 Years", href: "/collections/12-14-years" },
  { id: "14-plus-years", label: "14+ Years", href: "/collections/14-plus-years" },
]

type PriceTier = {
  id: string
  label: string
  min?: number
  max?: number
}

const buildStorePriceHref = ({ min, max }: Pick<PriceTier, "min" | "max">) => {
  const params = new URLSearchParams()

  if (typeof min === "number") {
    params.set("price_min", Math.round(min).toString())
  }

  if (typeof max === "number") {
    params.set("price_max", Math.round(max).toString())
  }

  const query = params.toString()
  return query ? `/store?${query}` : "/store"
}

const priceTiers: PriceTier[] = [
  { id: "under-299", label: "Under 299", max: 299 },
  { id: "under-499", label: "Under 499", max: 499 },
  { id: "under-699", label: "Under 699", max: 699 },
  { id: "under-999", label: "Under 999", max: 999 },
  { id: "above-999", label: "Above 999", min: 1000 },
]

const priceTierLinks: ShopMenuLink[] = priceTiers.map((tier) => ({
  id: tier.id,
  label: tier.label,
  href: buildStorePriceHref(tier),
}))

export const shopMenuSections: ShopMenuSection[] = [
  {
    id: "age",
    title: "Shop by Age",
    accent: "muted",
    items: ageCategories.map((category) => ({
      id: category.id,
      label: category.label,
      href: category.href,
    })),
  },
  {
    id: "price",
    title: "Shop By Price",
    items: [
      ...priceTierLinks,
      { id: "boys", label: "Boys", href: "/collections/boys" },
      { id: "girls", label: "Girls", href: "/collections/girls" },
    ],
  },
]

export const shopMenuPromo: ShopMenuPromo = {
  title: "Shop All",
  links: [
    { id: "shop-all", label: "Shop All", href: "/store" },
    { id: "new-arrivals", label: "New Arrivals", href: "/collections/new-arrivals" },
    { id: "best-selling", label: "Best Sellers", href: "/collections/best-selling" },
  ],
  image: {
    src: "/assets/images/H373b3e2614344291824ff29116a86506M.jpg",
    alt: "Happy kid playing with toys",
  },
}
