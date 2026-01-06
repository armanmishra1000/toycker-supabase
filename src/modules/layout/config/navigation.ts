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
  { id: "metal-cars", label: "Metal Car", href: "/collections/metal-car" },
  { id: "boys", label: "Boys", href: "/collections/boys" },
  { id: "girls", label: "Girls", href: "/collections/girls" },
  { id: "about", label: "About Us", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "club", label: "Club", href: "/club" },
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

export const toyCategories: ShopMenuLink[] = [
  { id: "soft-toys", label: "Soft Toys", href: "/collections/soft-toys" },
  { id: "doll-doll-house", label: "Doll & Doll House", href: "/collections/doll-doll-house" },
  { id: "rattles", label: "Rattles", href: "/collections/rattles" },
  { id: "bath-toys", label: "Bath Toys", href: "/collections/bath-toys" },
  { id: "musical-toys", label: "Musical Toys", href: "/collections/musical-toys" },
  { id: "role-play-toys", label: "Role Play Toys", href: "/collections/role-play-toys" },
  { id: "die-cast-toy-vehicles", label: "Die-cast & Toy Vehicles", href: "/collections/die-cast-toy-vehicles" },
  { id: "toy-guns", label: "Toy Guns", href: "/collections/toy-guns" },
  { id: "coin-bank", label: "Coin Bank", href: "/collections/coin-bank" },
]

export const rideOutdoorCategories: ShopMenuLink[] = [
  { id: "ride-on-toys", label: "Ride-On Toys", href: "/collections/ride-on-toys" },
  { id: "tricycles", label: "Tricycles", href: "/collections/tricycles" },
  { id: "swing-car", label: "Swing Car", href: "/collections/swing-car" },
  { id: "kick-scooter", label: "Kick Scooter", href: "/collections/kick-scooter" },
  { id: "skating", label: "Skating", href: "/collections/skating" },
  { id: "sports-outdoor", label: "Sports & Outdoor", href: "/collections/sports-outdoor" },
]

export const gamesLearningCategories: ShopMenuLink[] = [
  { id: "remote-controlled-toys", label: "Remote Controlled Toys", href: "/collections/remote-controlled-toys" },
  { id: "drone", label: "Drone", href: "/collections/drone" },
  { id: "hover-board", label: "Hover Board", href: "/collections/hover-board" },
  { id: "games", label: "Games (Board Games, Indoor Games)", href: "/collections/games" },
  { id: "pc-tv-games", label: "PC Games & TV Games", href: "/collections/pc-tv-games" },
  { id: "learning-education", label: "Learning & Education", href: "/collections/learning-education" },
  { id: "arts-crafts", label: "Arts & Crafts", href: "/collections/arts-crafts" },
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
  { id: "under-299", label: "Under ₹299", max: 299 },
  { id: "under-499", label: "Under ₹499", max: 499 },
  { id: "under-699", label: "Under ₹699", max: 699 },
  { id: "under-999", label: "Under ₹999", max: 999 },
  { id: "above-999", label: "Above ₹999", min: 1000 },
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
    id: "toy-categories",
    title: "Toy Categories",
    items: toyCategories,
  },
  {
    id: "ride-outdoor",
    title: "Ride & Outdoor",
    items: rideOutdoorCategories,
  },
  {
    id: "games-learning",
    title: "Games & Learning",
    items: gamesLearningCategories,
  },
  {
    id: "price",
    title: "Shop by Price",
    items: priceTierLinks,
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
