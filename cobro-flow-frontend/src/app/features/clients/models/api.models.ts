// API Response Types - matching backend responses

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Client/Debtor from API
export interface ClientApiResponse {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  erp_id: string | null;
  risk_score: number | null;
  tags: string[] | null;
  ai_profile_summary: string | null;
  created_at: string;
  // Aggregated stats from backend
  total_debt: string | null;
  overdue_amount: string | null;
  total_invoices: number | null;
  overdue_invoices: number | null;
  status: 'current' | 'at_risk' | 'overdue' | 'critical' | null;
}

// Invoice from API
export interface InvoiceApiResponse {
  id: string;
  organization_id: string;
  debtor_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: string; // Decimal comes as string
  balance: string; // Decimal comes as string
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  file_url: string | null;
  erp_metadata: Record<string, unknown> | null;
}

// Payment from API
export interface PaymentApiResponse {
  id: string;
  organization_id: string;
  debtor_id: string;
  amount: string; // Decimal comes as string
  payment_date: string;
  method: string | null;
  reference_number: string | null;
  proof_file_url: string | null;
}

// Payment allocation from API
export interface PaymentAllocationApiResponse {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount_allocated: string;
}

// Request types for creating/updating

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  erp_id?: string;
  risk_score?: number;
  tags?: string[];
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  erp_id?: string;
  risk_score?: number;
  tags?: string[];
}

export interface CreateInvoiceRequest {
  debtor_id: string;
  invoice_number: string;
  issue_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  amount: number;
  currency?: string;
  file_url?: string;
  erp_metadata?: Record<string, unknown>;
}

export interface UpdateInvoiceRequest {
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  balance?: number;
  file_url?: string;
}

export interface PaymentAllocationRequest {
  invoice_id: string;
  amount_allocated: number;
}

export interface CreatePaymentRequest {
  debtor_id: string;
  amount: number;
  method?: string;
  reference_number?: string;
  proof_file_url?: string;
  allocations?: PaymentAllocationRequest[];
}

// Import types
export interface ImportError {
  row: number;
  field: string | null;
  message: string;
}

export interface ImportClientsResponse {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

// Query params
export interface ClientsQueryParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface InvoicesQueryParams {
  page?: number;
  size?: number;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
}

export interface PaymentsQueryParams {
  page?: number;
  size?: number;
}
