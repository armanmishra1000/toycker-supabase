"use client"

import React from "react"
import { LogOut, Sparkles, Wallet } from "lucide-react"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@lib/util/cn"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: any
}) => {
  const route = usePathname()
  const handleLogout = async () => {
    await signout()
  }

  return (
    <div className="space-y-6">
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== "/account" ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="account-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span>Back to account</span>
            </>
          </LocalizedClientLink>
        ) : (
          <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50">
            <div className="text-xl font-semibold px-4 pt-4 pb-2">Hello {customer?.first_name}</div>
            <div className="text-base">
              <ul>
                <MobileLink
                  href="/account/profile"
                  icon={<User size={20} />}
                  label="Profile"
                  data-testid="profile-link"
                />
                <MobileLink
                  href="/account/addresses"
                  icon={<MapPin size={20} />}
                  label="Addresses"
                  data-testid="addresses-link"
                />
                <MobileLink
                  href="/account/club"
                  icon={<Sparkles size={20} />}
                  label="Club"
                  data-testid="club-link"
                />
                <MobileLink
                  href="/account/wallet"
                  icon={<Wallet size={20} />}
                  label="Wallet"
                  data-testid="wallet-link"
                />
                <MobileLink
                  href="/account/orders"
                  icon={<Package size={20} />}
                  label="Orders"
                  data-testid="orders-link"
                />
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-4 border-t border-gray-200 px-4 w-full"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div className="space-y-4">
          <div className="pb-2">
            <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wide">
              Manage
            </h3>
          </div>
          <div className="text-base">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-2">
              <li>
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                >
                  <NavRow icon={<ChevronDown className="-rotate-90" />} label="Overview" />
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                >
                  <NavRow icon={<User size={18} />} label="Profile" />
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                >
                  <NavRow icon={<MapPin size={18} />} label="Addresses" />
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/club"
                  route={route!}
                  data-testid="club-link"
                >
                  <NavRow icon={<Sparkles size={18} />} label="Club Membership" />
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/wallet"
                  route={route!}
                  data-testid="wallet-link"
                >
                  <NavRow icon={<Wallet size={18} />} label="Wallet" />
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                >
                  <NavRow icon={<Package size={18} />} label="Orders" />
                </AccountNavLink>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                  data-testid="logout-button"
                >
                  Log out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={cn(
        "flex items-center gap-x-3 px-3 py-2 rounded-md transition-colors",
        {
          "bg-gray-100 text-gray-900 font-semibold border border-gray-200":
            active,
          "text-gray-500 hover:text-gray-900": !active,
        }
      )}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

const NavRow = ({ icon, label }: { icon: React.ReactNode; label: string }) => {
  return (
    <span className="flex items-center gap-x-3 text-base">
      {icon}
      {label}
    </span>
  )
}

const MobileLink = ({
  href,
  icon,
  label,
  "data-testid": dataTestId,
}: {
  href: string
  icon: React.ReactNode
  label: string
  "data-testid"?: string
}) => (
  <li>
    <LocalizedClientLink
      href={href}
      className="flex items-center justify-between py-4 border-t border-gray-200 px-4"
      data-testid={dataTestId}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <span>{label}</span>
      </div>
      <ChevronDown className="transform -rotate-90" />
    </LocalizedClientLink>
  </li>
)

export default AccountNav