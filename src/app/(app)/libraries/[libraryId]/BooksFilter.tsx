"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search, X } from "lucide-react"
import { Category } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BooksFilterProps {
  categories: Category[]
}

export function BooksFilter({ categories }: BooksFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
          params.delete("page")
        }
      }
      return params.toString()
    },
    [searchParams]
  )

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("ownership") ||
    searchParams.get("possession") ||
    searchParams.get("category")

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar livros..."
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-9"
          onChange={(e) => {
            const qs = createQueryString({ search: e.target.value || null })
            router.push(`${pathname}?${qs}`)
          }}
        />
      </div>

      <Select
        defaultValue={searchParams.get("ownership") ?? "all"}
        onValueChange={(v) => {
          const qs = createQueryString({ ownership: v === "all" ? null : v })
          router.push(`${pathname}?${qs}`)
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Propriedade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="desejado">Desejado</SelectItem>
          <SelectItem value="possuido">Possuído</SelectItem>
          <SelectItem value="desfeito">Desfeito</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("possession") ?? "all"}
        onValueChange={(v) => {
          const qs = createQueryString({ possession: v === "all" ? null : v })
          router.push(`${pathname}?${qs}`)
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Posse" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="comigo">Comigo</SelectItem>
          <SelectItem value="emprestado">Emprestado</SelectItem>
        </SelectContent>
      </Select>

      {categories.length > 0 && (
        <Select
          defaultValue={searchParams.get("category") ?? "all"}
          onValueChange={(v) => {
            const qs = createQueryString({ category: v === "all" ? null : v })
            router.push(`${pathname}?${qs}`)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  )
}
