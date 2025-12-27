import React from "react"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  )
}