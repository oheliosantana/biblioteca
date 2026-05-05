import { Database } from './database.types'

export type Library = Database['public']['Tables']['libraries']['Row']
export type Book = Database['public']['Tables']['books']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type CustomField = Database['public']['Tables']['custom_fields']['Row']
export type Loan = Database['public']['Tables']['loans']['Row']
export type LoanRequest = Database['public']['Tables']['loan_requests']['Row']
export type LibraryInvite = Database['public']['Tables']['library_invites']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type OwnershipStatus = Database['public']['Enums']['ownership_status']
export type PossessionStatus = Database['public']['Enums']['possession_status']
export type LoanRequestStatus = Database['public']['Enums']['loan_request_status']

export type LibraryWithRole = Library & {
  role: 'owner' | 'manager' | 'visitor'
  book_count: number
}

export type BookWithCategories = Book & {
  categories: Category[]
}

export type LoanWithBorrower = Loan & {
  borrower_profile: Profile | null
}

export type MemberWithProfile = {
  user_id: string
  display_name: string | null
  email: string | null
  role: 'owner' | 'manager' | 'visitor'
  joined_at: string
}

export type LoanRequestWithDetails = LoanRequest & {
  book_title: string
  book_cover_url: string | null
  book_authors: string[]
  library_id: string
  library_name: string
  requester_display_name: string | null
}
