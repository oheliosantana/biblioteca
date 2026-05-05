"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1
        const filled = star <= (hovered || value)
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-300"
              }`}
            />
          </button>
        )
      })}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpar
        </button>
      )}
    </div>
  )
}
