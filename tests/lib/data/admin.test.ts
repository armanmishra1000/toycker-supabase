import { beforeEach, describe, expect, it, vi } from "vitest"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getAdminUser, getStaffMembers, promoteToStaff } from "@/lib/data/admin"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}))

function buildEnsureAdminClient() {
  const single = vi.fn().mockResolvedValue({
    data: { role: "admin" },
    error: null,
  })
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "admin-user",
          },
        },
      }),
    },
    from: vi.fn((table: string) => {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`)
      }

      return {
        select,
      }
    }),
  }
}

describe("admin data identity handling", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("prefers contact_email for the current admin user", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        first_name: "Ada",
        last_name: "Lovelace",
        email: "919876543210@wa.toycker.store",
        contact_email: "ada@example.com",
        phone: "919876543210",
        role: "admin",
        admin_role_id: null,
        admin_role: null,
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "919876543210@wa.toycker.store",
              phone: "919876543210",
              user_metadata: {},
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table !== "profiles") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return {
          select,
        }
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getAdminUser()

    expect(result).toMatchObject({
      email: "ada@example.com",
      contact: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "System Admin",
    })
  })

  it("falls back to phone when the admin only has a synthetic auth email", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        first_name: "",
        last_name: "",
        email: "919876543210@wa.toycker.store",
        contact_email: null,
        phone: "919876543210",
        role: "admin",
        admin_role_id: null,
        admin_role: null,
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "919876543210@wa.toycker.store",
              phone: "919876543210",
              user_metadata: {},
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table !== "profiles") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return {
          select,
        }
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getAdminUser()

    expect(result).toMatchObject({
      email: "",
      contact: "919876543210",
    })
  })

  it("maps staff members to resolved contact values and suppresses synthetic auth email", async () => {
    const ensureAdminClient = buildEnsureAdminClient()

    const countQuery = {
      not: vi.fn(),
      or: vi.fn().mockResolvedValue({ count: 2 }),
    }
    countQuery.not.mockReturnValue(countQuery)

    const dataQuery = {
      not: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      or: vi.fn().mockResolvedValue({
        data: [
          {
            id: "staff-1",
            email: "919876543210@wa.toycker.store",
            contact_email: "staff.one@example.com",
            phone: "919876543210",
            first_name: "Staff",
            last_name: "One",
            admin_role_id: "role-1",
            created_at: "2026-03-16T00:00:00.000Z",
            admin_role: null,
          },
          {
            id: "staff-2",
            email: "919111111111@wa.toycker.store",
            contact_email: null,
            phone: "919111111111",
            first_name: null,
            last_name: null,
            admin_role_id: "role-2",
            created_at: "2026-03-15T00:00:00.000Z",
            admin_role: null,
          },
        ],
        error: null,
      }),
    }
    dataQuery.not.mockReturnValue(dataQuery)
    dataQuery.order.mockReturnValue(dataQuery)
    dataQuery.range.mockReturnValue(dataQuery)

    const staffClient = {
      from: vi.fn((table: string) => {
        if (table !== "profiles") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return {
          select: vi.fn((_columns: string, options?: { head?: boolean }) => {
            if (options?.head) {
              return countQuery
            }

            return dataQuery
          }),
        }
      }),
    }

    vi.mocked(createClient)
      .mockResolvedValueOnce(
        ensureAdminClient as unknown as Awaited<ReturnType<typeof createClient>>
      )
      .mockResolvedValueOnce(
        staffClient as unknown as Awaited<ReturnType<typeof createClient>>
      )

    const result = await getStaffMembers({ search: "staff" })

    expect(result.staff).toMatchObject([
      {
        id: "staff-1",
        email: "staff.one@example.com",
        display_contact: "staff.one@example.com",
        phone: "919876543210",
      },
      {
        id: "staff-2",
        email: "",
        display_contact: "919111111111",
        phone: "919111111111",
      },
    ])
    expect(countQuery.or).toHaveBeenCalledWith(
      expect.stringContaining("contact_email.ilike.%staff%")
    )
    expect(dataQuery.or).toHaveBeenCalledWith(
      expect.stringContaining("phone.ilike.%staff%")
    )
  })

  it("stores admin profile identity and syncs auth metadata when promoting a user", async () => {
    const ensureAdminClient = buildEnsureAdminClient()
    const updateProfileEq = vi.fn().mockResolvedValue({ error: null })
    const updateProfile = vi.fn().mockReturnValue({ eq: updateProfileEq })
    const selectProfileSingle = vi.fn().mockResolvedValue({
      data: {
        id: "user-2",
        admin_role_id: null,
      },
      error: null,
    })
    const selectProfileEq = vi
      .fn()
      .mockReturnValue({ single: selectProfileSingle })
    const selectProfile = vi.fn().mockReturnValue({ eq: selectProfileEq })
    const getUserById = vi.fn().mockResolvedValue({
      data: {
        user: {
          user_metadata: {
            theme: "dark",
          },
        },
      },
      error: null,
    })
    const updateUserById = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(createClient).mockResolvedValueOnce(
      ensureAdminClient as unknown as Awaited<ReturnType<typeof createClient>>
    )
    vi.mocked(createAdminClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table !== "profiles") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return {
          select: selectProfile,
          update: updateProfile,
        }
      }),
      auth: {
        admin: {
          getUserById,
          updateUserById,
        },
      },
    } as unknown as Awaited<ReturnType<typeof createAdminClient>>)

    await promoteToStaff({
      userId: "user-2",
      roleId: "role-1",
      firstName: "Ada",
      lastName: "Lovelace",
      contactEmail: "Ada@example.com",
    })

    expect(updateProfile).toHaveBeenCalledWith({
      admin_role_id: "role-1",
      role: "admin",
      first_name: "Ada",
      last_name: "Lovelace",
      contact_email: "ada@example.com",
    })
    expect(updateUserById).toHaveBeenCalledWith("user-2", {
      user_metadata: {
        theme: "dark",
        first_name: "Ada",
        last_name: "Lovelace",
        full_name: "Ada Lovelace",
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/admin/team")
    expect(revalidatePath).toHaveBeenCalledWith("/admin", "layout")
  })

  it("rejects synthetic staff contact emails during promotion", async () => {
    const ensureAdminClient = buildEnsureAdminClient()

    vi.mocked(createClient).mockResolvedValueOnce(
      ensureAdminClient as unknown as Awaited<ReturnType<typeof createClient>>
    )

    await expect(
      promoteToStaff({
        userId: "user-2",
        roleId: "role-1",
        firstName: "Ada",
        lastName: "Lovelace",
        contactEmail: "919876543210@wa.toycker.store",
      })
    ).rejects.toThrow(
      "Enter a valid public email address for this staff member"
    )

    expect(createAdminClient).not.toHaveBeenCalled()
  })
})
