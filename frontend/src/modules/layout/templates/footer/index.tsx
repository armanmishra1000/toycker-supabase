import { ReactNode } from "react"
import Image from "next/image"
import {
  ArrowUpRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline"
import { Facebook, Instagram, Linkedin, LucideIcon, Music2, Twitter, Youtube } from "lucide-react"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  footerContactItems,
  footerDescription,
  footerLinkGroups,
  footerSocialLinks,
  newsletterCopy,
} from "@modules/layout/config/footer"

const contactIconMap = {
  address: MapPinIcon,
  phone: PhoneIcon,
  email: EnvelopeIcon,
  fax: PrinterIcon,
} as const

const socialIconMap: Record<string, LucideIcon> = {
  facebook: Facebook,
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
}

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <div className="space-y-2">
    <span className="text-lg font-semibold text-grey-90">{children}</span>
    <span className="block h-1 w-12 rounded-full bg-secondary" />
  </div>
)

const floatingClouds = [
  {
    id: "cloud-1",
    className: "left-[-4rem] top-14 hidden sm:block w-48",
    animation: "animate-cloud-marquee-left",
    style: { animationDelay: "0s" },
  },
  { id: "cloud-2", className: "left-0 bottom-48 hidden lg:block w-56" },
  {
    id: "cloud-3",
    className: "right-24 top-16 w-40",
    animation: "animate-cloud-marquee-right",
    style: { animationDelay: "4s" },
  },
  { id: "cloud-4", className: "right-0 bottom-48 hidden lg:block w-56" },
]

const floatingStars = [
  { id: "f1_star1", className: "left-10 top-12 w-6" },
  { id: "f1_star2", className: "left-1/4 top-32 w-6" },
  { id: "f1_star3", className: "right-1/3 top-10 w-6" },
  { id: "f1_star4", className: "right-16 top-40 w-6" },
  { id: "f1_star5", className: "left-1/3 bottom-40 w-6" },
  { id: "f1_star6", className: "right-1/4 bottom-36 w-6" },
]

const FloatingDecor = () => (
  <div className="pointer-events-none absolute inset-0">
    {floatingClouds.map((cloud) => (
      <Image
        key={cloud.id}
        src={`/assets/images/${cloud.id}.svg`}
        alt=""
        aria-hidden="true"
        width={200}
        height={120}
        className={`absolute h-auto ${cloud.className} ${cloud.animation ?? ""}`.trim()}
        style={cloud.style}
        loading="lazy"
      />
    ))}
    {floatingStars.map((star) => (
      <Image
        key={star.id}
        src={`/assets/images/${star.id}.svg`}
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        className={`absolute h-auto ${star.className}`}
        loading="lazy"
      />
    ))}
  </div>
)

const DecorativeGround = ({ year }: { year: number }) => (
  <div className="relative mt-12 w-full bg-transparent">
    <div className="relative flex w-full items-end justify-center">
      <Image
        src="/assets/images/footer-bottom-shape.svg"
        alt="Playful landscape"
        width={1920}
        height={360}
        priority
        className="h-auto w-full"
        sizes="100vw"
      />
    </div>
    <div className="pointer-events-none absolute inset-2 flex items-end justify-between px-[5%]">
      <Image
        src="/assets/images/footer-doll-left.svg"
        alt="Smiling girl illustration"
        width={260}
        height={260}
        priority
        className="h-auto max-w-[20vw] w-[180px] animate-float-bob"
        sizes="(max-width: 768px) 24vw, (max-width: 1024px) 200px, 240px"
      />
      <Image
        src="/assets/images/footer-doll-right.svg"
        alt="Cheerful boy illustration"
        width={260}
        height={260}
        priority
        className="h-auto w-[200px] max-w-[24vw] sm:w-[240px] animate-float-bob"
        style={{ animationDelay: "1.5s" }}
        sizes="(max-width: 768px) 24vw, (max-width: 1024px) 200px, 240px"
      />
    </div>
  </div>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-[#f6fbff] to-white">
      <FloatingDecor />

      <div className="content-container relative z-10 pb-16 pt-12 xl:pb-28 md:pb-32">
        <div className="grid gap-10 lg:[grid-template-columns:1.8fr_0.9fr_0.9fr_1.8fr]">
          <div className="space-y-6">
            <LocalizedClientLink href="/" className="inline-flex items-center gap-3">
              <Image
                src="/assets/images/toycker.png"
                alt="Toycker logo"
                width={150}
                height={48}
                className="h-16 w-auto rounded-lg"
                priority
              />
            </LocalizedClientLink>
            <Text className="max-w-sm text-base text-grey-70">{footerDescription}</Text>
            <ul className="space-y-4">
              {footerContactItems.map((contact) => {
                const Icon = contactIconMap[contact.type]

                return (
                  <li key={contact.id} className="flex items-start gap-4">
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full bg-white/80 text-primary shadow-sm ring-1 ring-primary/10">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="space-y-1 text-base font-medium text-grey-70 leading-relaxed">
                      {contact.href ? (
                        <a
                          href={contact.href}
                          target={contact.href.startsWith("http") ? "_blank" : undefined}
                          rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
                          className="text-base font-medium text-grey-70 transition-colors hover:text-primary"
                        >
                          {contact.label}
                        </a>
                      ) : (
                        <p className="text-base font-medium text-grey-70">{contact.label}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.id} className="space-y-4">
              <SectionHeading>{group.title}</SectionHeading>
              <ul className="space-y-3 text-sm text-grey-60">
                {group.links.map((link) => (
                  <li key={link.id}>
                    <LocalizedClientLink
                      href={link.href}
                      className="transition-colors hover:text-primary"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-4">
            <SectionHeading>{newsletterCopy.title}</SectionHeading>
            <Text className="text-sm text-grey-70">{newsletterCopy.description}</Text>
            <form className="relative" action="#" method="post" noValidate>
              <label htmlFor="footer-email" className="sr-only">
                {newsletterCopy.placeholder}
              </label>
              <EnvelopeIcon
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-40"
                aria-hidden="true"
              />
              <input
                id="footer-email"
                name="email"
                type="email"
                placeholder={newsletterCopy.placeholder}
                className="w-full rounded-full border border-[#dfe9f0] bg-white/80 py-3 pl-12 pr-16 text-sm text-grey-80 placeholder:text-grey-40 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-white  transition hover:scale-105"
                aria-label="Submit email for newsletter"
              >
                <ArrowUpRightIcon className="h-5 w-5" />
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              {footerSocialLinks.map((link) => {
                const Icon = socialIconMap[link.id]

                return (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dfe9f0] bg-transparent text-grey-60 transition hover:border-primary hover:text-primary"
                  >
                    {Icon ? <Icon className="h-5 w-5" /> : link.label.charAt(0)}
                  </a>
                )
              })}
            </div>
          </div>
        </div>

      </div>

      <DecorativeGround year={year} />
      <div className="bg-primary">
        <p className="flex items-end justify-center py-4 text-center text-sm text-white drop-shadow">
        © {year} Toycker. All Rights Reserved by Toycker Studio
      </p>
      </div>
    </footer>
  )
}
