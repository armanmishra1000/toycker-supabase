"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bars3Icon, HeartIcon, ShoppingBagIcon, MagnifyingGlassIcon, UserIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import Search from "@modules/layout/components/search"
import IconButton from "@modules/layout/components/icon-button"
import MainNavigation from "@modules/layout/components/main-navigation"
import MobileMenu from "@modules/layout/components/mobile-menu"
import SearchDrawer from "@modules/layout/components/search-drawer"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { useWishlistCount } from "@modules/products/hooks/use-wishlist-count"
import {
  AgeCategory,
  NavLink,
  ShopMenuPromo,
  ShopMenuSection,
  ageCategories as defaultAgeCategories,
  navLinks as defaultNavLinks,
  shopMenuPromo as defaultShopMenuPromo,
  shopMenuSections as defaultShopMenuSections,
} from "@modules/layout/config/navigation"

interface ContactInfoProps {
  phone?: string
  showIcon?: boolean
}

const ContactInfo = ({ 
  phone = "+91 9925819694", 
  showIcon = true 
}: ContactInfoProps) => {
  return (
    <div className="py-2 px-4 border border-white/30 rounded-full">
      <a
        href={`tel:${phone.replace(/\D/g, "")}`}
        className="hidden lg:flex items-center gap-2 text-white "
        aria-label="Contact phone number"
      >
        {showIcon && (
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
            <PhoneIcon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm">24/7 Support:</span>
          <span className="text-sm font-medium">{phone}</span>
        </div>
      </a>
    </div>
  )
}

type HeaderProps = {
  regions?: Record<string, unknown>
  cart?: HttpTypes.StoreCart | null
  navLinks?: NavLink[]
  ageCategories?: AgeCategory[]
  shopMenuSections?: ShopMenuSection[]
  shopMenuPromo?: ShopMenuPromo
}

const Header = ({
  regions,
  cart,
  navLinks,
  ageCategories,
  shopMenuSections,
  shopMenuPromo,
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const {
    isOpen: isCartSidebarOpen,
    openCart,
    closeCart,
    cart: sharedCart,
    setCart,
  } = useCartSidebar()
  const pathname = usePathname()
  const wishlistCount = useWishlistCount()

  useEffect(() => {
    setCart(cart ?? null)
  }, [cart, setCart])

  const openSearch = () => setIsSearchOpen(true)
  const toggleSearch = () => setIsSearchOpen((prev) => !prev)

  useEffect(() => {
    setIsSearchOpen(false)
  }, [pathname])
  const resolvedCart = sharedCart ?? cart
  const cartItemCount =
    resolvedCart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
  const resolvedNavLinks = navLinks && navLinks.length ? navLinks : defaultNavLinks
  const resolvedAgeCategories = ageCategories && ageCategories.length ? ageCategories : defaultAgeCategories
  const fallbackSections = defaultShopMenuSections.map((section) =>
    section.id === "age"
      ? {
          ...section,
          items: resolvedAgeCategories.map((category) => ({
            id: category.id,
            label: category.label,
            href: category.href,
          })),
        }
      : section,
  )
  const resolvedShopMenuSections = shopMenuSections && shopMenuSections.length ? shopMenuSections : fallbackSections
  const resolvedShopMenuPromo = shopMenuPromo ?? defaultShopMenuPromo

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 bg-primary text-white">
        {/* Row 1 - Main Header with Primary Background */}
        <div className="mx-auto px-4 max-w-[1440px]">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Menu Button & Logo - Left Side */}
            <div className="flex items-center gap-3 lg:gap-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 w-10 h-10 bg-foreground rounded-full transition-colors relative flex justify-center items-center group"
                aria-label="Toggle mobile menu"
              >
                <Bars3Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Logo - Inline */}
              <LocalizedClientLink href="/" className="flex-shrink-0">
                <div className="relative w-auto h-12">
                  <Image
                    src="/assets/images/toycker.png"
                    alt="Toycker Logo"
                    width={150}
                    height={50}
                    priority
                    className="h-full w-auto"
                  />
                </div>
              </LocalizedClientLink>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-xl">
              <Search placeholder="Search for toys..." onActivate={openSearch} />
            </div>

            {/* Contact Info */}
            <div className="hidden lg:block">
              <ContactInfo />
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              {/* Mobile Search Icon */}
              <button
                onClick={toggleSearch}
                className="lg:hidden w-10 h-10 bg-foreground rounded-full transition-colors relative flex justify-center items-center"
                aria-label={isSearchOpen ? "Close search" : "Open search"}
                aria-pressed={isSearchOpen}
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Login Button - Desktop Only */}
              <div className="hidden lg:block ">
                <LocalizedClientLink href="/account" className="group relative">
                  <button
                    className="w-10 h-10 bg-foreground rounded-full transition-colors relative flex justify-center items-center"
                    aria-label="Login to account"
                  >
                    <UserIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </LocalizedClientLink>
              </div>

              {/* Wishlist - Desktop Only */}
              <div className="hidden lg:block">
                <IconButton
                  icon={HeartIcon}
                  label="Wishlist"
                  count={wishlistCount}
                  href="/wishlist"
                  ariaLabel={`Wishlist (${wishlistCount} items)`}
                />
              </div>

              {/* Shopping Bag / Cart */}
              <IconButton
                icon={ShoppingBagIcon}
                label="Shopping Bag"
                count={cartItemCount}
                ariaLabel={`Shopping bag (${cartItemCount} items)`}
                onClick={openCart}
              />
            </div>
          </div>
        </div>

        {/* Mobile Search - Expandable */}
        <div className="lg:hidden hidden mx-auto px-4 max-w-[1440px] pb-3">
          <Search placeholder="Search toys..." onActivate={openSearch} />
        </div>
      </header>

      {/* Row 2 - Navigation with White Background - Desktop Only */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="mx-auto px-4 max-w-[1440px]">
          <div className="flex items-center justify-between">
            {/* Main Navigation */}
            <MainNavigation
              navLinks={resolvedNavLinks}
              shopMenuSections={resolvedShopMenuSections}
              shopMenuPromo={resolvedShopMenuPromo}
            />
            
            {/* Email Contact - Right Side */}
            <a
              href="mailto:customercare@toycker.com"
              className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Contact email"
            >
              <EnvelopeIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-base font-medium">customercare@toycker.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={resolvedNavLinks}
        shopMenuSections={resolvedShopMenuSections}
        shopMenuPromo={resolvedShopMenuPromo}
      />

      <CartSidebar isOpen={isCartSidebarOpen} onClose={closeCart} />

      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

export default Header
