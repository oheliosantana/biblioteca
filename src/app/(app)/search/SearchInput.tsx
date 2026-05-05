"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const [pending, setPending] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValue(v)
    if (timer.current) clearTimeout(timer.current)
    setPending(true)
    timer.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (v.trim()) params.set("q", v.trim())
      router.push(`${pathname}?${params.toString()}`)
      setPending(false)
    }, 400)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      {pending && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
      )}
      <Input
        autoFocus
        className="pl-9 pr-9"
        placeholder="Buscar livros em todas as bibliotecas..."
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}
