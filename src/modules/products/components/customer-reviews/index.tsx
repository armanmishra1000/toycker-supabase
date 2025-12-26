"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import Modal from "@modules/common/components/modal"
import { Star } from "lucide-react"

const CustomerReviews = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [formState, setFormState] = useState({
    review: "",
    about: "",
    email: "",
    displayName: "",
    anonymous: false,
  })
  const [status, setStatus] = useState<"idle" | "success">("idle")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("success")
    setTimeout(() => {
      setIsModalOpen(false)
      setStatus("idle")
      setFormState({ review: "", about: "", email: "", displayName: "", anonymous: false })
      setRating(0)
    }, 1500)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
      <h3 className="text-2xl font-semibold text-slate-900">Customer Reviews</h3>
      <div className="mt-3 flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-5 w-5 text-[#00B37E]" />
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-500">Be the first to write a review</p>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
      >
        Write A Review
      </button>

      <Modal isOpen={isModalOpen} close={() => setIsModalOpen(false)} size="large">
        <Modal.Title>Write a Review</Modal.Title>
        <Modal.Body>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-medium text-ui-fg-base">Star rating</p>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`rounded-full p-1 ${rating > index ? "text-amber-500" : "text-ui-border-base"}`}
                    onClick={() => setRating(index + 1)}
                    aria-label={`Rate ${index + 1} star`}
                  >
                    <Star className="h-6 w-6" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ui-fg-base">
                Review content
              </label>
              <textarea
                required
                value={formState.review}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, review: event.target.value }))
                }
                className="min-h-[140px] w-full rounded-2xl border border-ui-border-base px-4 py-3 text-sm focus:border-ui-fg-interactive focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputControl
                label="About you"
                value={formState.about}
                onChange={(value) => setFormState((prev) => ({ ...prev, about: value }))}
              />
              <InputControl
                label="Email address"
                type="email"
                required
                value={formState.email}
                onChange={(value) => setFormState((prev) => ({ ...prev, email: value }))}
              />
            </div>
            <InputControl
              label="Display name"
              required
              value={formState.displayName}
              onChange={(value) => setFormState((prev) => ({ ...prev, displayName: value }))}
            />
            <label className="flex items-center gap-2 text-sm text-ui-fg-base">
              <input
                type="checkbox"
                checked={formState.anonymous}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, anonymous: event.target.checked }))
                }
                className="h-4 w-4 rounded border-ui-border-base text-ui-fg-interactive focus:ring-ui-fg-interactive"
              />
              Post review as anonymous
            </label>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Back
              </Button>
              <Button type="submit">{status === "success" ? "Saved" : "Submit review"}</Button>
            </Modal.Footer>
          </form>
        </Modal.Body>
      </Modal>
    </section>
  )
}

const InputControl = ({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ui-fg-base">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-ui-border-base px-4 py-3 text-sm focus:border-ui-fg-interactive focus:outline-none"
      />
    </div>
  )
}

export default CustomerReviews
