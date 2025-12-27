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
      <div className="relative bg-gray-50 min-h-[calc(100vh-400px)]">
        {children}
      </div>
      <Footer />
    </>
  )
}