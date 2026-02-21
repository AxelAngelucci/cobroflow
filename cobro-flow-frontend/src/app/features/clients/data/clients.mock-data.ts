import {
  Client,
  ClientWithStats,
  Invoice,
  Payment,
  PaymentWithAllocations,
  ClientActivity,
  ClientsSummary,
  InvoiceStatus
} from '../models/clients.models';

// Helper to generate dates relative to today
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Mock Clients
export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    organizationId: 'org1',
    erpId: 'SAP-001',
    name: 'Distribuidora Norte S.A.',
    email: 'cuentas@distribuidoranorte.com',
    phone: '+54 11 4555-1234',
    taxId: '30-71234567-9',
    riskScore: 25,
    tags: ['VIP', 'Mayorista'],
    aiProfileSummary: 'Cliente con buen historial de pagos. Ocasionalmente requiere recordatorios pero siempre cumple.',
    createdAt: daysAgo(365)
  },
  {
    id: 'c2',
    organizationId: 'org1',
    erpId: 'SAP-002',
    name: 'Mario González',
    email: 'mario.gonzalez@gmail.com',
    phone: '+54 11 4555-5678',
    taxId: '20-28456789-3',
    riskScore: 45,
    tags: ['Minorista'],
    aiProfileSummary: 'Paga generalmente a tiempo. Últimamente ha tenido algunos retrasos menores.',
    createdAt: daysAgo(180)
  },
  {
    id: 'c3',
    organizationId: 'org1',
    erpId: 'SAP-003',
    name: 'TechSolutions Argentina',
    email: 'pagos@techsolutions.com.ar',
    phone: '+54 11 4555-9012',
    taxId: '30-70987654-1',
    riskScore: 15,
    tags: ['Corporativo', 'Tech'],
    aiProfileSummary: 'Excelente pagador. Siempre paga antes del vencimiento.',
    createdAt: daysAgo(540)
  },
  {
    id: 'c4',
    organizationId: 'org1',
    erpId: 'SAP-004',
    name: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    phone: '+54 11 4555-3456',
    taxId: '27-32109876-5',
    riskScore: 78,
    tags: ['Retail'],
    aiProfileSummary: 'Cliente con historial problemático. Múltiples facturas vencidas. Requiere seguimiento cercano.',
    createdAt: daysAgo(90)
  },
  {
    id: 'c5',
    organizationId: 'org1',
    erpId: 'SAP-005',
    name: 'Comercial del Sur',
    email: 'admin@comercialdelsur.com',
    phone: '+54 11 4555-7890',
    taxId: '30-65432109-8',
    riskScore: 55,
    tags: ['Mayorista', 'Regional'],
    aiProfileSummary: 'Cliente mediano. Paga con retrasos frecuentes pero eventualmente cumple.',
    createdAt: daysAgo(270)
  },
  {
    id: 'c6',
    organizationId: 'org1',
    erpId: 'SAP-006',
    name: 'Carlos Rodriguez',
    email: 'carlos.rodriguez@gmail.com',
    phone: '+54 11 4555-2345',
    taxId: '20-25678901-7',
    riskScore: 35,
    tags: ['Minorista'],
    aiProfileSummary: 'Buen cliente. Responde rápido a comunicaciones y cumple compromisos.',
    createdAt: daysAgo(150)
  },
  {
    id: 'c7',
    organizationId: 'org1',
    erpId: 'SAP-007',
    name: 'Importadora Central',
    email: 'finanzas@importadoracentral.com',
    phone: '+54 11 4555-6789',
    taxId: '30-78901234-6',
    riskScore: 92,
    tags: ['Corporativo', 'Importador'],
    aiProfileSummary: 'ALERTA: Cliente en situación crítica. Deuda acumulada significativa. Evaluar acciones legales.',
    createdAt: daysAgo(730)
  },
  {
    id: 'c8',
    organizationId: 'org1',
    erpId: 'SAP-008',
    name: 'Servicios Express Ltda.',
    email: 'contabilidad@serviciosexpress.com',
    phone: '+54 11 4555-0123',
    taxId: '30-56789012-4',
    riskScore: 20,
    tags: ['Servicios', 'Pyme'],
    aiProfileSummary: 'Cliente confiable. Pagos puntuales en los últimos 12 meses.',
    createdAt: daysAgo(400)
  }
];

// Mock Invoices
export const MOCK_INVOICES: Invoice[] = [
  // Client 1 - Distribuidora Norte
  {
    id: 'inv1',
    organizationId: 'org1',
    debtorId: 'c1',
    invoiceNumber: 'FAC-2024-001',
    issueDate: daysAgo(45),
    dueDate: daysAgo(15),
    amount: 45000,
    balance: 0,
    currency: 'ARS',
    status: 'paid'
  },
  {
    id: 'inv2',
    organizationId: 'org1',
    debtorId: 'c1',
    invoiceNumber: 'FAC-2024-015',
    issueDate: daysAgo(20),
    dueDate: daysFromNow(10),
    amount: 78500,
    balance: 78500,
    currency: 'ARS',
    status: 'pending'
  },
  // Client 2 - Mario González
  {
    id: 'inv3',
    organizationId: 'org1',
    debtorId: 'c2',
    invoiceNumber: 'FAC-2024-002',
    issueDate: daysAgo(60),
    dueDate: daysAgo(30),
    amount: 12500,
    balance: 5800,
    currency: 'ARS',
    status: 'overdue'
  },
  {
    id: 'inv4',
    organizationId: 'org1',
    debtorId: 'c2',
    invoiceNumber: 'FAC-2024-018',
    issueDate: daysAgo(15),
    dueDate: daysFromNow(15),
    amount: 8900,
    balance: 8900,
    currency: 'ARS',
    status: 'pending'
  },
  // Client 3 - TechSolutions
  {
    id: 'inv5',
    organizationId: 'org1',
    debtorId: 'c3',
    invoiceNumber: 'FAC-2024-003',
    issueDate: daysAgo(30),
    dueDate: daysAgo(0),
    amount: 156000,
    balance: 0,
    currency: 'ARS',
    status: 'paid'
  },
  {
    id: 'inv6',
    organizationId: 'org1',
    debtorId: 'c3',
    invoiceNumber: 'FAC-2024-022',
    issueDate: daysAgo(5),
    dueDate: daysFromNow(25),
    amount: 234000,
    balance: 234000,
    currency: 'ARS',
    status: 'pending'
  },
  // Client 4 - Ana Silva (problematic)
  {
    id: 'inv7',
    organizationId: 'org1',
    debtorId: 'c4',
    invoiceNumber: 'FAC-2024-004',
    issueDate: daysAgo(90),
    dueDate: daysAgo(60),
    amount: 25600,
    balance: 25600,
    currency: 'ARS',
    status: 'overdue'
  },
  {
    id: 'inv8',
    organizationId: 'org1',
    debtorId: 'c4',
    invoiceNumber: 'FAC-2024-008',
    issueDate: daysAgo(75),
    dueDate: daysAgo(45),
    amount: 18400,
    balance: 12400,
    currency: 'ARS',
    status: 'overdue'
  },
  {
    id: 'inv9',
    organizationId: 'org1',
    debtorId: 'c4',
    invoiceNumber: 'FAC-2024-012',
    issueDate: daysAgo(50),
    dueDate: daysAgo(20),
    amount: 31200,
    balance: 31200,
    currency: 'ARS',
    status: 'overdue'
  },
  // Client 5 - Comercial del Sur
  {
    id: 'inv10',
    organizationId: 'org1',
    debtorId: 'c5',
    invoiceNumber: 'FAC-2024-005',
    issueDate: daysAgo(40),
    dueDate: daysAgo(10),
    amount: 67800,
    balance: 67800,
    currency: 'ARS',
    status: 'overdue'
  },
  {
    id: 'inv11',
    organizationId: 'org1',
    debtorId: 'c5',
    invoiceNumber: 'FAC-2024-019',
    issueDate: daysAgo(10),
    dueDate: daysFromNow(20),
    amount: 45300,
    balance: 45300,
    currency: 'ARS',
    status: 'pending'
  },
  // Client 6 - Carlos Rodriguez
  {
    id: 'inv12',
    organizationId: 'org1',
    debtorId: 'c6',
    invoiceNumber: 'FAC-2024-006',
    issueDate: daysAgo(25),
    dueDate: daysFromNow(5),
    amount: 15600,
    balance: 15600,
    currency: 'ARS',
    status: 'pending'
  },
  // Client 7 - Importadora Central (critical)
  {
    id: 'inv13',
    organizationId: 'org1',
    debtorId: 'c7',
    invoiceNumber: 'FAC-2023-089',
    issueDate: daysAgo(180),
    dueDate: daysAgo(150),
    amount: 450000,
    balance: 450000,
    currency: 'ARS',
    status: 'overdue'
  },
  {
    id: 'inv14',
    organizationId: 'org1',
    debtorId: 'c7',
    invoiceNumber: 'FAC-2024-001',
    issueDate: daysAgo(120),
    dueDate: daysAgo(90),
    amount: 320000,
    balance: 320000,
    currency: 'ARS',
    status: 'overdue'
  },
  {
    id: 'inv15',
    organizationId: 'org1',
    debtorId: 'c7',
    invoiceNumber: 'FAC-2024-007',
    issueDate: daysAgo(60),
    dueDate: daysAgo(30),
    amount: 185000,
    balance: 185000,
    currency: 'ARS',
    status: 'disputed'
  },
  // Client 8 - Servicios Express
  {
    id: 'inv16',
    organizationId: 'org1',
    debtorId: 'c8',
    invoiceNumber: 'FAC-2024-014',
    issueDate: daysAgo(35),
    dueDate: daysAgo(5),
    amount: 28900,
    balance: 0,
    currency: 'ARS',
    status: 'paid'
  },
  {
    id: 'inv17',
    organizationId: 'org1',
    debtorId: 'c8',
    invoiceNumber: 'FAC-2024-023',
    issueDate: daysAgo(3),
    dueDate: daysFromNow(27),
    amount: 42100,
    balance: 42100,
    currency: 'ARS',
    status: 'pending'
  }
];

// Mock Payments
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay1',
    organizationId: 'org1',
    debtorId: 'c1',
    amount: 45000,
    paymentDate: daysAgo(10),
    method: 'Transferencia',
    referenceNumber: 'TRF-2024-001'
  },
  {
    id: 'pay2',
    organizationId: 'org1',
    debtorId: 'c2',
    amount: 6700,
    paymentDate: daysAgo(5),
    method: 'Transferencia',
    referenceNumber: 'TRF-2024-002'
  },
  {
    id: 'pay3',
    organizationId: 'org1',
    debtorId: 'c3',
    amount: 156000,
    paymentDate: daysAgo(2),
    method: 'Cheque',
    referenceNumber: 'CHQ-2024-001'
  },
  {
    id: 'pay4',
    organizationId: 'org1',
    debtorId: 'c4',
    amount: 6000,
    paymentDate: daysAgo(20),
    method: 'Efectivo',
    referenceNumber: 'EFE-2024-001'
  },
  {
    id: 'pay5',
    organizationId: 'org1',
    debtorId: 'c8',
    amount: 28900,
    paymentDate: daysAgo(3),
    method: 'Transferencia',
    referenceNumber: 'TRF-2024-003'
  }
];

// Mock Payments with Allocations
export const MOCK_PAYMENTS_WITH_ALLOCATIONS: PaymentWithAllocations[] = MOCK_PAYMENTS.map(payment => ({
  ...payment,
  allocations: []
}));

// Computed clients with stats
export const MOCK_CLIENTS_WITH_STATS: ClientWithStats[] = MOCK_CLIENTS.map(client => {
  const clientInvoices = MOCK_INVOICES.filter(inv => inv.debtorId === client.id);
  const clientPayments = MOCK_PAYMENTS.filter(pay => pay.debtorId === client.id);

  const totalDebt = clientInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const overdueInvoices = clientInvoices.filter(inv => inv.status === 'overdue');
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const lastPayment = clientPayments.sort((a, b) =>
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  )[0];

  let statusLabel: ClientWithStats['statusLabel'] = 'Al día';
  if (client.riskScore && client.riskScore >= 80) {
    statusLabel = 'Crítico';
  } else if (overdueAmount > 0) {
    const maxDaysOverdue = Math.max(...overdueInvoices.map(inv => {
      const today = new Date();
      const dueDate = new Date(inv.dueDate);
      return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }));
    statusLabel = maxDaysOverdue > 60 ? 'Crítico' : 'Vencido';
  } else if (clientInvoices.some(inv => {
    const today = new Date();
    const dueDate = new Date(inv.dueDate);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0 && inv.balance > 0;
  })) {
    statusLabel = 'Por vencer';
  }

  return {
    ...client,
    totalDebt,
    overdueAmount,
    invoiceCount: clientInvoices.length,
    overdueCount: overdueInvoices.length,
    lastPaymentDate: lastPayment?.paymentDate,
    statusLabel
  };
});

// Summary stats
export const MOCK_CLIENTS_SUMMARY: ClientsSummary = {
  totalClients: MOCK_CLIENTS.length,
  activeClients: MOCK_CLIENTS_WITH_STATS.filter(c => c.totalDebt > 0).length,
  totalDebt: MOCK_CLIENTS_WITH_STATS.reduce((sum, c) => sum + c.totalDebt, 0),
  totalOverdue: MOCK_CLIENTS_WITH_STATS.reduce((sum, c) => sum + c.overdueAmount, 0),
  avgRiskScore: Math.round(MOCK_CLIENTS.reduce((sum, c) => sum + (c.riskScore || 0), 0) / MOCK_CLIENTS.length)
};

// Helper function to get client activity
export function getClientActivity(clientId: string): ClientActivity[] {
  const clientInvoices = MOCK_INVOICES.filter(inv => inv.debtorId === clientId);
  const clientPayments = MOCK_PAYMENTS.filter(pay => pay.debtorId === clientId);

  const activities: ClientActivity[] = [];

  // Add payment activities
  clientPayments.forEach(payment => {
    activities.push({
      id: `act-pay-${payment.id}`,
      type: 'payment',
      description: `Pago recibido - ${payment.method}`,
      date: new Date(payment.paymentDate),
      amount: payment.amount
    });
  });

  // Add invoice activities
  clientInvoices.forEach(invoice => {
    activities.push({
      id: `act-inv-${invoice.id}`,
      type: 'invoice_created',
      description: `Factura emitida`,
      date: new Date(invoice.issueDate),
      amount: invoice.amount,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber
    });

    if (invoice.status === 'overdue') {
      activities.push({
        id: `act-over-${invoice.id}`,
        type: 'invoice_overdue',
        description: `Factura vencida`,
        date: new Date(invoice.dueDate),
        amount: invoice.balance,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      });
    }
  });

  // Sort by date descending
  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Helper to get invoices for a client
export function getClientInvoices(clientId: string): Invoice[] {
  return MOCK_INVOICES.filter(inv => inv.debtorId === clientId)
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

// Helper to get payments for a client
export function getClientPayments(clientId: string): PaymentWithAllocations[] {
  return MOCK_PAYMENTS_WITH_ALLOCATIONS.filter(pay => pay.debtorId === clientId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

// Status color mapping
export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: '#F59E0B',
  paid: '#22C55E',
  overdue: '#EF4444',
  cancelled: '#6B7280',
  disputed: '#8B5CF6'
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  disputed: 'Disputada'
};
