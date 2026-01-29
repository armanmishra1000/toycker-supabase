import React from "react"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="relative min-h-[calc(100vh-400px)]">
        {children}
      </main>
      <Footer />
    </>
  )
}