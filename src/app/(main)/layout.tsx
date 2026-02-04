import React from "react"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"
import MobileNav from "@modules/layout/components/mobile-nav"
import ContactHub from "@modules/layout/components/contact-hub"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="relative">
        {children}
      </main>
      <Footer />
      <MobileNav />
      <ContactHub />
    </>
  )
}