"use client"

import { ChangeEvent, FormEvent, useState } from "react"

import {
  contactInfo,
  contactLocations,
  contactReasons,
} from "@modules/contact/contact.constants"
import {
  Ban,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  Youtube,
} from "lucide-react"

const buildMapEmbedUrl = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`

type ContactPageProps = {
  countryCode: string
}

const ContactPage = (_props: ContactPageProps) => {
  const locations = contactLocations
  const socialLinks = [
    {
      id: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/toyckerofficial",
      Icon: Facebook,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/toyckerofficial",
      Icon: Instagram,
    },
    {
      id: "youtube",
      label: "YouTube",
      href: "https://www.youtube.com/@toyckerofficial",
      Icon: Youtube,
    },
  ]
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "success">("idle")

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (status === "success") {
      setStatus("idle")
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("success")
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    })
  }

  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="space-y-3 text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Contact Toycker
          </p>
          <h1 className="text-4xl font-semibold text-ui-fg-base">
            One head office · Three fully-equipped branches
          </h1>
          <p className="mx-auto max-w-3xl text-ui-fg-subtle">
            We’re here to help! Whether you have questions about our products,
            need assistance with an order, or want to share feedback, feel free
            to reach out to us using the details below.
          </p>
        </div>
        <div className="max-w-screen-2xl mx-auto mb-12">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#e4e7ec] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe3e3] text-primary mb-3">
                    <Mail className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                      Customer Care
                    </p>
                    <a
                      href={contactInfo.email.href}
                      className="text-xl font-semibold text-ui-fg-base underline decoration-primary underline-offset-4"
                    >
                      {contactInfo.email.display}
                    </a>
                    <p className="text-sm text-ui-fg-subtle">
                      Our support specialists respond within business hours.
                    </p>
                  </div>
              </div>

              <div className="rounded-2xl border border-[#e4e7ec] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe3e3] text-primary mb-3">
                    <Clock3 className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                      Business Hours
                    </p>
                    <div className="space-y-2  text-ui-fg-base">
                      <div className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-primary" aria-hidden />
                        <span>{contactInfo.hours.weekdays}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Ban className="h-5 w-5 text-primary" aria-hidden />
                        <span>{contactInfo.hours.sunday}</span>
                      </div>
                    </div>
                  </div>
              </div>

              <div className="rounded-2xl border border-[#e4e7ec] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                    Follow Us
                  </p>
                  <p className="text-sm text-ui-fg-subtle">
                    Join our community for launches, events, and behind-the-scenes fun.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map(({ id, label, href, Icon }) => (
                      <a
                        key={id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4e7ec] text-ui-fg-base transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-transparent bg-gradient-to-br from-[#ff3e3e] to-[#d50000] text-white p-6">
                <p className="text-sm uppercase tracking-[0.4em] text-white/80">
                  Need Assistance?
                </p>
                <h3 className="mt-3 text-2xl font-semibold">Talk to our team</h3>
                <p className="mt-2 text-sm text-white/90">
                  Share your request and we’ll respond within business hours.
                </p>
                <a
                  href="#contact-form"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:bg-black hover:text-white"
                >
                  Start Inquiry
                </a>
              </div>
            </div>
        </div>

        <div className="max-w-screen-xl mx-auto">
          <div className="space-y-10">
            {locations.map((location) => (
              <section
                key={location.id}
                className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-stretch"
              >
                <div className="overflow-hidden rounded-2xl border border-ui-border-base bg-gray-50 shadow-sm">
                  <iframe
                    src={buildMapEmbedUrl(location.mapQuery)}
                    title={`${location.title} map`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-80 w-full border-0 sm:h-[26rem]"
                  />
                </div>

                <article
                  className="relative flex flex-col justify-between before:rounded-2xl before:border-[3px] before:border-primary bg-white p-10 before:content-[''] before:block before:absolute before:top-0 before:left-0 before:h-full before:w-1/2"
                >
                  <div className="bg-white z-10 h-full flex flex-col justify-between py-3 ps-4">

                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                      {location.label}
                    </p>
                    <h2 className="text-2xl font-semibold uppercase text-ui-fg-base">
                      {location.title}
                    </h2>

                    <address className="space-y-1 not-italic text-ui-fg-subtle">
                      {location.addressLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </address>

                    <p className="text-lg font-semibold text-ui-fg-base">
                      {location.phone.display}
                    </p>
                  </div>

                  <div className="mt-10">
                    <a
                      href={location.virtualTourUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full px-10 py-2.5 text-sm font-semibold uppercase tracking-[0.25em] text-white transition bg-black hover:bg-primary hover:text-white"
                    >
                      Get Virtual Tour
                    </a>
                  </div>
                  </div>
                </article>
              </section>
            ))}
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto mt-16" id="contact-form">
          <div className="grid gap-10 rounded-3xl border border-ui-border-base bg-white p-10 shadow-xl lg:grid-cols-[0.9fr,1.1fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Send us a message
              </p>
              <p className="text-2xl font-semibold text-ui-fg-base">
                Have a custom request?
              </p>
              <p className="text-ui-fg-subtle">
                Share your questions, order details, or collaboration ideas through the form and our team will reach out during business hours.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                  How Can We Help You?
                </p>
                <ul className="space-y-1 text-ui-fg-subtle">
                  {contactReasons.map((reason) => (
                    <li key={reason.id} className="flex items-start gap-2">
                      <span aria-hidden>•</span>
                      <span>{reason.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-sm font-semibold text-ui-fg-base">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-sm font-semibold text-ui-fg-base">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-phone" className="text-sm font-semibold text-ui-fg-base">
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-sm font-semibold text-ui-fg-base">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Tell us how we can help"
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p
                  className={`text-sm font-semibold ${
                    status === "success" ? "text-primary" : "text-transparent"
                  }`}
                  aria-live="polite"
                >
                  Thanks for reaching out! We’ll get back to you shortly.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-black"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
