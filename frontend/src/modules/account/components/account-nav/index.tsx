"use client"

import React from "react"
import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { usePathname, useParams } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
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
          <div className="flex flex-col rounded-lg border border-ui-border bg-ui-bg-subtle">
            <div className="text-xl-semi px-4 pt-4 pb-2">Hello {customer?.first_name}</div>
            <div className="text-base-regular">
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
                  href="/account/orders"
                  icon={<Package size={20} />}
                  label="Orders"
                  data-testid="orders-link"
                />
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-4 border-t border-ui-border px-4 w-full"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <ArrowRightOnRectangle />
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
            <h3 className="text-base-semi text-ui-fg-subtle uppercase tracking-wide">
              Manage
            </h3>
          </div>
          <div className="text-base-regular">
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
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
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
      className={clx(
        "flex items-center gap-x-3 px-3 py-2 rounded-md transition-colors",
        {
          "bg-ui-bg-subtle text-ui-fg-base font-semibold border border-ui-border":
            active,
          "text-ui-fg-subtle hover:text-ui-fg-base": !active,
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
    <span className="flex items-center gap-x-3 text-base-regular">
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
      className="flex items-center justify-between py-4 border-t border-ui-border px-4"
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
