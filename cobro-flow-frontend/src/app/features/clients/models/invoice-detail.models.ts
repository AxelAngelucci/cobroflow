export type ConversationType = 'whatsapp' | 'email' | 'call' | 'sms';

export interface InvoiceConversation {
  id: string;
  type: ConversationType;
  date: Date;
  messages?: ConversationMessage[];
  subject?: string; // For emails
  note?: string; // For calls
  content?: string; // For email body or call notes
}

export interface ConversationMessage {
  sender: 'system' | 'client';
  text: string;
}

export interface PaymentPromise {
  id: string;
  amount: number;
  committedDate: Date;
  agreedVia: string;
  status: 'active' | 'fulfilled' | 'broken' | 'expired';
  createdAt: Date;
}

export interface AIInvoiceSummary {
  content: string;
  recommendation?: string;
  generatedAt: Date;
}

export interface InvoiceDetailData {
  id: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  riskLevel: 'low' | 'medium' | 'high';

  // Client info
  clientId: string;
  clientName: string;
  companyName?: string;
  taxId?: string;
  taxCondition?: string;

  // Invoice info
  amount: number;
  accruedInterest: number;
  totalOwed: number;
  interestRate: number;
  issueDate: Date;
  dueDate: Date;
  daysOverdue: number;
  concept: string;
  paymentMethod?: string;

  // Related data
  paymentPromise?: PaymentPromise;
  aiSummary?: AIInvoiceSummary;
  conversations: InvoiceConversation[];
}
