import { beforeEach, describe, expect, it, vi } from "vitest"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/permissions/server"
import { revalidatePath } from "next/cache"
import { updateOrderShippingAddress } from "@/lib/data/admin"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

const buildFormData = () => {
  const formData = new FormData()
  formData.set("orderId", "order-1")
  formData.set("first_name", "Yash")
  formData.set("last_name", "Sheliya")
  formData.set("company", "")
  formData.set("address_1", "Amroli Main Road")
  formData.set("address_2", "Near Market")
  formData.set("city", "Surat")
  formData.set("country_code", "IN")
  formData.set("province", "Gujarat")
  formData.set("postal_code", "395003")
  formData.set("phone", "9898989898")

  return formData
}

const createProfileQuery = () => {
  const query = {
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { role: "admin" },
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        first_name: "Admin",
        last_name: "User",
        email: "admin@example.com",
      },
      error: null,
    }),
  }

  query.eq.mockReturnValue(query)
  return query
}

describe("updateOrderShippingAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requirePermission).mockResolvedValue(undefined)
  })

  it("updates the order shipping address while the order is still editable", async () => {
    const orderQuery = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "order-1",
          status: "accepted",
          shipping_address: {
            first_name: "Old",
            last_name: "Receiver",
            address_1: "Old Street",
            address_2: null,
            city: "Surat",
            country_code: "in",
            province: "Gujarat",
            postal_code: "395001",
            phone: "9000000000",
            company: null,
          },
        },
        error: null,
      }),
    }
    orderQuery.eq.mockReturnValue(orderQuery)

    const mockFrom = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue(createProfileQuery()),
        }
      }

      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue(orderQuery),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const orderUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const timelineInsert = vi.fn().mockResolvedValue({ error: null })
    const adminFrom = vi.fn((table: string) => {
      if (table === "orders") {
        return {
          update: orderUpdate,
        }
      }

      if (table === "order_timeline") {
        return {
          insert: timelineInsert,
        }
      }

      throw new Error(`Unexpected admin table: ${table}`)
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "admin-1",
              email: "admin@example.com",
            },
          },
        }),
      },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    vi.mocked(createAdminClient).mockResolvedValue({
      from: adminFrom,
    } as unknown as Awaited<ReturnType<typeof createAdminClient>>)

    const result = await updateOrderShippingAddress(
      { success: false, error: null },
      buildFormData()
    )

    expect(result).toEqual({ success: true, error: null })
    expect(orderUpdate).toHaveBeenCalledWith({
      shipping_address: {
        first_name: "Yash",
        last_name: "Sheliya",
        company: null,
        address_1: "Amroli Main Road",
        address_2: "Near Market",
        city: "Surat",
        country_code: "in",
        province: "Gujarat",
        postal_code: "395003",
        phone: "9898989898",
      },
      updated_at: expect.any(String),
    })
    expect(timelineInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        event_type: "note_added",
        title: "Shipping Address Updated",
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders/order-1")
    expect(revalidatePath).toHaveBeenCalledWith("/order/confirmed/order-1")
    expect(revalidatePath).toHaveBeenCalledWith(
      "/account/orders/details/order-1"
    )
  })

  it("rejects edits after shipment", async () => {
    const orderQuery = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "order-1",
          status: "shipped",
          shipping_address: null,
        },
        error: null,
      }),
    }
    orderQuery.eq.mockReturnValue(orderQuery)

    const mockFrom = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue(createProfileQuery()),
        }
      }

      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue(orderQuery),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const adminFrom = vi.fn()

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "admin-1",
              email: "admin@example.com",
            },
          },
        }),
      },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    vi.mocked(createAdminClient).mockResolvedValue({
      from: adminFrom,
    } as unknown as Awaited<ReturnType<typeof createAdminClient>>)

    const result = await updateOrderShippingAddress(
      { success: false, error: null },
      buildFormData()
    )

    expect(result).toEqual({
      success: false,
      error: "Shipping address can only be edited before the order is shipped.",
    })
    expect(adminFrom).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
