// API Response Types - matching backend responses

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Client/Debtor from API
// NOTE: all snake_case fields are converted to camelCase by the camelCaseInterceptor
export interface ClientApiResponse {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  erpId: string | null;
  riskScore: number | null;
  tags: string[] | null;
  aiProfileSummary: string | null;
  createdAt: string;
  // Aggregated stats from backend
  totalDebt: string | null;
  overdueAmount: string | null;
  totalInvoices: number | null;
  overdueInvoices: number | null;
  status: 'current' | 'at_risk' | 'overdue' | 'critical' | null;
}

// Invoice from API
// NOTE: all snake_case fields are converted to camelCase by the camelCaseInterceptor
export interface InvoiceApiResponse {
  id: string;
  organizationId: string;
  debtorId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: string; // Decimal comes as string
  balance: string; // Decimal comes as string
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  fileUrl: string | null;
  erpMetadata: Record<string, unknown> | null;
}

// Payment from API
// NOTE: all snake_case fields are converted to camelCase by the camelCaseInterceptor
export interface PaymentApiResponse {
  id: string;
  organizationId: string;
  debtorId: string;
  amount: string; // Decimal comes as string
  paymentDate: string;
  method: string | null;
  referenceNumber: string | null;
  proofFileUrl: string | null;
}

// Payment allocation from API
export interface PaymentAllocationApiResponse {
  id: string;
  paymentId: string;
  invoiceId: string;
  amountAllocated: string;
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
