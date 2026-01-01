"use client"

import { useState, useTransition, useEffect } from "react"
import { getProductOptions, saveProductOption, deleteProductOption, generateVariantsFromOptions, syncOptionsFromVariants } from "@/lib/data/admin"
import AdminCard from "./admin-card"
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"

type ProductOptionsEditorProps = {
  productId: string
  initialOptions?: { id: string; title: string; values: { id: string; value: string }[] }[]
  hasVariants?: boolean
}

type OptionFormData = {
  title: string
  values: string
}

export default function ProductOptionsEditor({ productId, initialOptions = [], hasVariants = false }: ProductOptionsEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [options, setOptions] = useState<{ id: string; title: string; values: { id: string; value: string }[] }[]>(initialOptions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<{ id: string; title: string; values: { id: string; value: string }[] } | null>(null)
  const [formData, setFormData] = useState<OptionFormData>({ title: "", values: "" })
  const [hasSynced, setHasSynced] = useState(false)

  // Auto-sync options from variants on mount if:
  // - No options exist
  // - Variants exist
  // - Haven't synced yet
  useEffect(() => {
    if (options.length === 0 && hasVariants && !hasSynced) {
      setHasSynced(true)
      startTransition(async () => {
        try {
          await syncOptionsFromVariants(productId)
          const updated = await getProductOptions(productId)
          setOptions(updated)
        } catch (error) {
          // Silently fail - don't crash the page if sync fails
          // User can manually add options or the schema migration might need to be run
          console.info("Auto-sync skipped (may need schema migration):", error)
        }
      })
    }
  }, [options.length, hasVariants, hasSynced, productId])

  const handleOpenModal = (option?: { id: string; title: string; values: { id: string; value: string }[] }) => {
    if (option) {
      setEditingOption(option)
      setFormData({
        title: option.title,
        values: option.values?.map(v => v.value).join(", ") || ""
      })
    } else {
      setEditingOption(null)
      setFormData({ title: "", values: "" })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingOption(null)
    setFormData({ title: "", values: "" })
  }

  const handleSaveOption = () => {
    startTransition(async () => {
      try {
        const valuesArray = formData.values
          .split(",")
          .map(v => v.trim())
          .filter(v => v.length > 0)

        if (valuesArray.length === 0) {
          alert("Please enter at least one variation value")
          return
        }

        await saveProductOption(productId, {
          title: formData.title,
          values: valuesArray
        })

        // Fetch updated options
        const updated = await getProductOptions(productId)
        setOptions(updated)

        handleCloseModal()
      } catch (error) {
        console.error(error)
        alert("Failed to save option")
      }
    })
  }

  const handleDeleteOption = async (optionId: string) => {
    if (confirm("Are you sure you want to delete this option? This will not delete existing variants.")) {
      startTransition(async () => {
        try {
          await deleteProductOption(optionId)
          setOptions(options.filter(o => o.id !== optionId))
          router.refresh()
        } catch (error) {
          console.error(error)
          alert("Failed to delete option")
        }
      })
    }
  }

  const handleGenerateVariants = async () => {
    if (options.length === 0) {
      alert("Please create at least one option first")
      return
    }

    if (!confirm(`This will generate variants for all combinations of your options. Continue?`)) {
      return
    }

    startTransition(async () => {
      try {
        await generateVariantsFromOptions(productId, options)
        alert("Variants generated successfully!")
        router.refresh()
      } catch (error) {
        console.error(error)
        alert("Failed to generate variants")
      }
    })
  }

  return (
    <AdminCard title={`Product Options (${options.length})`}>
      <div className="space-y-4">
        {options.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No options yet. Create your first option to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map(option => (
              <div
                key={option.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{option.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {option.values?.map(value => (
                      <span
                        key={value.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700"
                      >
                        {value.value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleOpenModal(option)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isPending}
                    type="button"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOption(option.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                    disabled={isPending}
                    type="button"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
            disabled={isPending}
          >
            <PlusIcon className="h-4 w-4" />
            Add Option
          </button>

          {options.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateVariants}
              disabled={isPending}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {isPending ? "Generating..." : "Generate Variants"}
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingOption ? "Edit Option" : "Create Option"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Option Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Size, Color"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Variations (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.values}
                  onChange={e => setFormData({ ...formData, values: e.target.value })}
                  placeholder="e.g., Small, Medium, Large"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate each variation with a comma
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOption}
                disabled={isPending || !formData.title || !formData.values}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Option"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  )
}
