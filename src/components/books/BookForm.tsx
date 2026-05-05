"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, X, Loader2 } from "lucide-react"
import { createBook, updateBook, BookFormData } from "@/lib/actions/books"
import { BookWithCategories, Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StarRating } from "./StarRating"

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  authors: z.array(z.object({ value: z.string().min(1, "Nome do autor obrigatório") })).min(1),
  isbn: z.string().optional(),
  edition: z.string().optional(),
  publisher: z.string().optional(),
  publication_year: z.string().optional(),
  language: z.string().optional(),
  pages: z.string().optional(),
  synopsis: z.string().optional(),
  cover_url: z.string().optional(),
  shelf: z.string().optional(),
  rack: z.string().optional(),
  ownership_status: z.enum(["desejado", "possuido", "desfeito"]),
  possession_status: z.enum(["comigo", "emprestado"]),
  rating: z.number().optional(),
  notes: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BookFormProps {
  libraryId: string
  book?: BookWithCategories
  categories: Category[]
  onSuccess: () => void
}

export function BookForm({ libraryId, book, categories, onSuccess }: BookFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState(book?.cover_url ?? "")

  const defaultValues: FormValues = {
    title: book?.title ?? "",
    authors: book?.authors.length
      ? book.authors.map((a) => ({ value: a }))
      : [{ value: "" }],
    isbn: book?.isbn ?? "",
    edition: book?.edition ?? "",
    publisher: book?.publisher ?? "",
    publication_year: book?.publication_year?.toString() ?? "",
    language: book?.language ?? "",
    pages: book?.pages?.toString() ?? "",
    synopsis: book?.synopsis ?? "",
    cover_url: book?.cover_url ?? "",
    shelf: book?.shelf ?? "",
    rack: book?.rack ?? "",
    ownership_status: book?.ownership_status ?? "possuido",
    possession_status: book?.possession_status ?? "comigo",
    rating: book?.rating ?? 0,
    notes: book?.notes ?? "",
    category_ids: book?.categories.map((c) => c.id) ?? [],
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "authors",
  })

  const ownershipStatus = form.watch("ownership_status")
  const rating = form.watch("rating") ?? 0
  const selectedCategories = form.watch("category_ids") ?? []

  function toggleCategory(id: string) {
    const current = form.getValues("category_ids") ?? []
    if (current.includes(id)) {
      form.setValue("category_ids", current.filter((c) => c !== id))
    } else {
      form.setValue("category_ids", [...current, id])
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const data: BookFormData = {
      title: values.title,
      authors: values.authors.map((a) => a.value),
      isbn: values.isbn || undefined,
      edition: values.edition || undefined,
      publisher: values.publisher || undefined,
      publication_year: values.publication_year ? parseInt(values.publication_year) : null,
      language: values.language || undefined,
      pages: values.pages ? parseInt(values.pages) : null,
      synopsis: values.synopsis || undefined,
      cover_url: values.cover_url || undefined,
      shelf: values.shelf || undefined,
      rack: values.rack || undefined,
      ownership_status: values.ownership_status,
      possession_status: values.possession_status,
      rating: values.rating || null,
      notes: values.notes || undefined,
      category_ids: values.category_ids,
    }

    const result = book
      ? await updateBook(book.id, data)
      : await createBook(libraryId, data)

    if (!result.success) {
      setServerError(result.error ?? "Erro desconhecido")
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
      {/* Seção 1 — Informações básicas */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Informações básicas</h3>

        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" {...form.register("title")} placeholder="Título do livro" />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Autores *</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...form.register(`authors.${index}.value`)}
                placeholder={`Autor ${index + 1}`}
              />
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: "" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar autor
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" {...form.register("isbn")} placeholder="978-..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover_url">URL da capa</Label>
            <Input
              id="cover_url"
              {...form.register("cover_url")}
              placeholder="https://..."
              onChange={(e) => {
                form.register("cover_url").onChange(e)
                setCoverPreview(e.target.value)
              }}
            />
          </div>
        </div>

        {coverPreview && (
          <div className="flex justify-center">
            <img
              src={coverPreview}
              alt="Preview da capa"
              className="h-40 w-auto rounded shadow-md object-cover"
              onError={() => setCoverPreview("")}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Seção 2 — Detalhes de publicação */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Detalhes de publicação</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="publisher">Editora</Label>
            <Input id="publisher" {...form.register("publisher")} placeholder="Nome da editora" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edition">Edição</Label>
            <Input id="edition" {...form.register("edition")} placeholder="1ª edição" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="publication_year">Ano</Label>
            <Input
              id="publication_year"
              type="number"
              {...form.register("publication_year")}
              placeholder="2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Input id="language" {...form.register("language")} placeholder="Português" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pages">Páginas</Label>
            <Input id="pages" type="number" {...form.register("pages")} placeholder="300" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="synopsis">Sinopse</Label>
          <Textarea id="synopsis" {...form.register("synopsis")} rows={4} placeholder="Resumo do livro..." />
        </div>
      </div>

      <Separator />

      {/* Seção 3 — Localização */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Localização</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shelf">Estante</Label>
            <Input id="shelf" {...form.register("shelf")} placeholder="A, B, 1..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rack">Prateleira</Label>
            <Input id="rack" {...form.register("rack")} placeholder="1, 2, superior..." />
          </div>
        </div>
      </div>

      <Separator />

      {/* Seção 4 — Status */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status de propriedade *</Label>
            <Select
              value={form.watch("ownership_status")}
              onValueChange={(v) => form.setValue("ownership_status", v as "desejado" | "possuido" | "desfeito")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desejado">Desejado</SelectItem>
                <SelectItem value="possuido">Possuído</SelectItem>
                <SelectItem value="desfeito">Desfeito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ownershipStatus === "possuido" && (
            <div className="space-y-2">
              <Label>Status de posse</Label>
              <Select
                value={form.watch("possession_status")}
                onValueChange={(v) => form.setValue("possession_status", v as "comigo" | "emprestado")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comigo">Comigo</SelectItem>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Seção 5 — Classificação */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Classificação</h3>

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label>Categorias</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selectedCategories.includes(cat.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Avaliação</Label>
          <StarRating value={rating} onChange={(v) => form.setValue("rating", v)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas pessoais</Label>
          <Textarea id="notes" {...form.register("notes")} rows={3} placeholder="Suas anotações sobre o livro..." />
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {book ? "Salvar alterações" : "Adicionar livro"}
        </Button>
      </div>
    </form>
  )
}
