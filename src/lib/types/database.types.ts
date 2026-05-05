export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      libraries: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      library_members: {
        Row: {
          id: string
          library_id: string
          user_id: string
          role: 'manager' | 'visitor'
          created_at: string
        }
        Insert: {
          id?: string
          library_id: string
          user_id: string
          role: 'manager' | 'visitor'
          created_at?: string
        }
        Update: {
          role?: 'manager' | 'visitor'
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          library_id: string
          title: string
          authors: string[]
          isbn: string | null
          edition: string | null
          publisher: string | null
          publication_year: number | null
          language: string | null
          pages: number | null
          synopsis: string | null
          cover_url: string | null
          shelf: string | null
          rack: string | null
          ownership_status: Database['public']['Enums']['ownership_status']
          possession_status: Database['public']['Enums']['possession_status']
          rating: number | null
          notes: string | null
          search_tsv: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          library_id: string
          title: string
          authors: string[]
          isbn?: string | null
          edition?: string | null
          publisher?: string | null
          publication_year?: number | null
          language?: string | null
          pages?: number | null
          synopsis?: string | null
          cover_url?: string | null
          shelf?: string | null
          rack?: string | null
          ownership_status?: Database['public']['Enums']['ownership_status']
          possession_status?: Database['public']['Enums']['possession_status']
          rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          authors?: string[]
          isbn?: string | null
          edition?: string | null
          publisher?: string | null
          publication_year?: number | null
          language?: string | null
          pages?: number | null
          synopsis?: string | null
          cover_url?: string | null
          shelf?: string | null
          rack?: string | null
          ownership_status?: Database['public']['Enums']['ownership_status']
          possession_status?: Database['public']['Enums']['possession_status']
          rating?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          library_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          library_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      book_categories: {
        Row: {
          book_id: string
          category_id: string
        }
        Insert: {
          book_id: string
          category_id: string
        }
        Update: {
          book_id?: string
          category_id?: string
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          id: string
          library_id: string
          name: string
          field_type: string
          created_at: string
        }
        Insert: {
          id?: string
          library_id: string
          name: string
          field_type: string
          created_at?: string
        }
        Update: {
          name?: string
          field_type?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          id: string
          book_id: string
          borrower_name: string
          borrower_user_id: string | null
          loaned_at: string
          due_date: string | null
          returned_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          borrower_name: string
          borrower_user_id?: string | null
          loaned_at: string
          due_date?: string | null
          returned_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          returned_at?: string | null
          notes?: string | null
          due_date?: string | null
        }
        Relationships: []
      }
      loan_requests: {
        Row: {
          id: string
          book_id: string
          requester_id: string
          status: Database['public']['Enums']['loan_request_status']
          message: string | null
          manager_response: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          requester_id: string
          status?: Database['public']['Enums']['loan_request_status']
          message?: string | null
          manager_response?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: Database['public']['Enums']['loan_request_status']
          manager_response?: string | null
          responded_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      library_invites: {
        Row: {
          id: string
          library_id: string
          email: string
          role: 'manager' | 'visitor'
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          library_id: string
          email: string
          role: 'manager' | 'visitor'
          invited_by: string
          created_at?: string
        }
        Update: {
          role?: 'manager' | 'visitor'
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
    Enums: {
      ownership_status: 'desejado' | 'possuido' | 'desfeito'
      possession_status: 'comigo' | 'emprestado'
      loan_request_status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada'
    }
  }
}
