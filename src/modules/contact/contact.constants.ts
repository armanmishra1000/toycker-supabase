export type ContactReason = {
  id: string
  label: string
}

export type ContactHours = {
  weekdays: string
  sunday: string
}

export const contactReasons: ContactReason[] = [
  { id: "product", label: "Product inquiries" },
  { id: "tracking", label: "Order tracking" },
  { id: "returns", label: "Return & refund requests" },
  { id: "bulk", label: "Bulk purchase queries" },
  { id: "feedback", label: "General feedback" },
  { id: "ad", label: "Ad & collaboration requests" },
]

export const contactInfo = {
  phone: {
    display: "+91 9925819694",
    href: "tel:+919925819694",
  },
  email: {
    display: "customercare@toycker.com",
    href: "mailto:customercare@toycker.com",
  },
  address:
    "shed no-7/8, sardar campus, opp. River Kent, Mota Varachha, Surat, Gujarat 394101",
  hours: {
    weekdays: "Monday – Saturday: 10:00 AM – 10:00 PM",
    sunday: "Sunday: Closed",
  } satisfies ContactHours,
}

export type ContactLocation = {
  id: string
  title: string
  label: string
  addressLines: string[]
  phone: {
    display: string
    href: string
  }
  mapQuery: string
  virtualTourUrl: string
  isHeadOffice?: boolean
}

export const contactLocations: ContactLocation[] = [
  {
    id: "head-office-varachha",
    title: "HEAD OFFICE - VARACHHA",
    label: "Main Toy Hub",
    addressLines: [
      "shed no-7/8, sardar campus, opp. River Kent,",
      "Mota Varachha, Surat, Gujarat 394101",
    ],
    phone: {
      display: "+91 9925819694",
      href: "tel:919925819694",
    },
    mapQuery: "Toycker Head Office Varachha Surat",
    virtualTourUrl: "https://maps.google.com/?q=Toycker+Head+Office+Varachha+Surat",
    isHeadOffice: true,
  },
  {
    id: "branch-2-adajan",
    title: "BRANCH 2 - ADAJAN",
    label: "Branch 2",
    addressLines: [
      "109, 1st Floor, Infinity Tower",
      "Nr. G.D. Goenka School, LP Savani Road",
      "Adajan, Surat 395009",
    ],
    phone: {
      display: "+91 90991 44170",
      href: "tel:+919099144170",
    },
    mapQuery: "Toycker Branch Adajan Surat",
    virtualTourUrl: "https://maps.google.com/?q=Toycker+Adajan+Surat",
  },
]
