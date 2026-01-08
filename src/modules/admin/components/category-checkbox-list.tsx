"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Tag } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface CategoryCheckboxListProps {
  categories: Category[]
  selectedIds: string[]
  name: string
}

export default function CategoryCheckboxList({
  categories,
  selectedIds,
  name
}: CategoryCheckboxListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSelectedIds, setCurrentSelectedIds] = useState<string[]>(selectedIds)

  // Sync with props if they change
  useEffect(() => {
    setCurrentSelectedIds(selectedIds)
  }, [selectedIds])

  const toggleCategory = (id: string) => {
    setCurrentSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  return (
    <div className="space-y-4">
      {categories.length > 6 && (
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-gray-50/30 transition-all"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar py-1">
        {filteredCategories.length === 0 ? (
          <p className="text-gray-400 text-[10px] italic py-2">
            {searchQuery ? "No categories match your search." : "No categories available."}
          </p>
        ) : (
          filteredCategories.map(c => {
            const isSelected = currentSelectedIds.includes(c.id)
            return (
              <label
                key={c.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer select-none
                  ${isSelected
                    ? "bg-black border-black text-white shadow-md shadow-black/10 translate-y-[-1px]"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                  }`}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={c.id}
                  checked={isSelected}
                  onChange={() => toggleCategory(c.id)}
                  className="hidden"
                />
                <Tag className={`h-3 w-3 ${isSelected ? "text-gray-400" : "text-gray-300"}`} />
                {c.name}
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}
