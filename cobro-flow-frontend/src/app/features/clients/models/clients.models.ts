// Invoice status based on database schema
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'disputed';

// Client/Debtor interface matching the debtors table
export interface Client {
  id: string;
  organizationId: string;
  erpId?: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  riskScore?: number;
  tags?: string[];
  aiProfileSummary?: string;
  createdAt: Date;
}

// Invoice interface matching the invoices table
export interface Invoice {
  id: string;
  organizationId: string;
  debtorId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  balance: number;
  currency: string;
  status: InvoiceStatus;
  fileUrl?: string;
  erpMetadata?: Record<string, unknown>;
}

// Payment interface matching the payments table
export interface Payment {
  id: string;
  organizationId: string;
  debtorId: string;
  amount: number;
  paymentDate: Date;
  method?: string;
  referenceNumber?: string;
  proofFileUrl?: string;
}

// Payment allocation interface
export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amountAllocated: number;
}

// Extended client with computed stats for display
export interface ClientWithStats extends Client {
  totalDebt: number;
  overdueAmount: number;
  invoiceCount: number;
  overdueCount: number;
  lastPaymentDate?: Date;
  statusLabel: ClientStatusLabel;
}

// Client status for UI display
export type ClientStatusLabel = 'Al día' | 'Por vencer' | 'Vencido' | 'Crítico';

// Risk level for UI badges
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Filter options for clients list
export interface ClientsFilter {
  search?: string;
  status?: InvoiceStatus | 'all';
  riskLevel?: RiskLevel | 'all';
  tags?: string[];
  sortBy?: 'name' | 'totalDebt' | 'overdueAmount' | 'riskScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Client detail view data
export interface ClientDetail extends ClientWithStats {
  invoices: Invoice[];
  payments: PaymentWithAllocations[];
  recentActivity: ClientActivity[];
}

// Payment with its allocations
export interface PaymentWithAllocations extends Payment {
  allocations: PaymentAllocationDetail[];
}

// Allocation with invoice details
export interface PaymentAllocationDetail extends PaymentAllocation {
  invoiceNumber: string;
}

// Activity item for client timeline
export interface ClientActivity {
  id: string;
  type: 'payment' | 'invoice_created' | 'invoice_overdue' | 'communication' | 'status_change';
  description: string;
  date: Date;
  amount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
}

// Summary stats for clients page header
export interface ClientsSummary {
  totalClients: number;
  activeClients: number;
  totalDebt: number;
  totalOverdue: number;
  avgRiskScore: number;
}
