import React from "react"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"
import MobileNav from "@modules/layout/components/mobile-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="relative pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </>
  )
}