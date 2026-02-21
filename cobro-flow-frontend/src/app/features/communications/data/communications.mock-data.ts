import {
  MessageTemplate, CollectionWorkflow, ActivityItem,
  CommunicationHubSummary
} from '../models/communications.models';

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const hoursAgo = (hours: number): Date => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

const minutesAgo = (minutes: number): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
};

export const MOCK_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl1', organizationId: 'org1',
    name: 'Recordatorio Amigable', channel: 'email',
    subject: 'Recordatorio de pago - Factura {{numero_factura}}',
    body: 'Hola {{nombre}},\n\nTe recordamos que tenés una factura pendiente por {{monto}} con vencimiento el {{fecha_vencimiento}}.\n\nPodés realizar el pago a través de nuestros canales habituales.\n\nSaludos,\n{{empresa}}',
    variables: ['nombre', 'monto', 'fecha_vencimiento', 'numero_factura', 'empresa'],
    status: 'active', language: 'es', timesUsed: 1240,
    openRate: 72.5, clickRate: 18.3, replyRate: 8.2, conversionRate: 12.1,
    createdAt: daysAgo(60), updatedAt: daysAgo(5),
  },
  {
    id: 'tpl2', organizationId: 'org1',
    name: 'WhatsApp - Primer Contacto', channel: 'whatsapp',
    body: 'Hola {{nombre}} 👋\n\nSoy de {{empresa}}. Te contacto por tu factura #{{numero_factura}} por {{monto}} que venció el {{fecha_vencimiento}}.\n\n¿Necesitás ayuda con el pago?',
    variables: ['nombre', 'monto', 'fecha_vencimiento', 'numero_factura', 'empresa'],
    status: 'active', language: 'es', timesUsed: 890,
    openRate: 95.2, replyRate: 45.8, conversionRate: 22.3,
    createdAt: daysAgo(45), updatedAt: daysAgo(3),
  },
  {
    id: 'tpl3', organizationId: 'org1',
    name: 'Aviso Formal de Mora', channel: 'email',
    subject: 'IMPORTANTE: Deuda pendiente - {{empresa}}',
    body: 'Estimado/a {{nombre}},\n\nLe informamos que su cuenta presenta un saldo vencido de {{monto}} correspondiente a la factura #{{numero_factura}}.\n\nLe solicitamos regularizar su situación a la brevedad.\n\nAtentamente,\nDepartamento de Cobranzas\n{{empresa}}',
    variables: ['nombre', 'monto', 'numero_factura', 'empresa'],
    status: 'active', language: 'es', timesUsed: 456,
    openRate: 65.1, clickRate: 12.4, replyRate: 15.7, conversionRate: 18.9,
    createdAt: daysAgo(90), updatedAt: daysAgo(15),
  },
  {
    id: 'tpl4', organizationId: 'org1',
    name: 'SMS Recordatorio', channel: 'sms',
    body: '{{empresa}}: Recordatorio factura #{{numero_factura}} por {{monto}} venc. {{fecha_vencimiento}}. Pague en linea: {{link_pago}}',
    variables: ['empresa', 'numero_factura', 'monto', 'fecha_vencimiento', 'link_pago'],
    status: 'active', language: 'es', timesUsed: 320,
    openRate: 98.0, conversionRate: 8.5,
    createdAt: daysAgo(30), updatedAt: daysAgo(10),
  },
  {
    id: 'tpl5', organizationId: 'org1',
    name: 'Guión Llamada - Negociación', channel: 'call',
    body: 'GUIÓN DE LLAMADA:\n\n1. Presentación: "Buenos días/tardes, soy {{agente}} de {{empresa}}"\n2. Motivo: "Lo contacto por su factura #{{numero_factura}} por {{monto}}"\n3. Consultar situación del deudor\n4. Ofrecer plan de pagos si corresponde\n5. Confirmar compromiso de pago',
    variables: ['agente', 'empresa', 'numero_factura', 'monto'],
    status: 'active', language: 'es', timesUsed: 89,
    conversionRate: 35.0,
    createdAt: daysAgo(120), updatedAt: daysAgo(20),
  },
  {
    id: 'tpl6', organizationId: 'org1',
    name: 'WhatsApp - Agradecimiento Pago', channel: 'whatsapp',
    body: 'Hola {{nombre}} 🎉\n\nConfirmamos la recepción de tu pago por {{monto}}. ¡Gracias por regularizar tu cuenta!\n\nSi tenés alguna consulta, no dudes en escribirnos.\n\nSaludos,\n{{empresa}}',
    variables: ['nombre', 'monto', 'empresa'],
    status: 'draft', language: 'es', timesUsed: 0,
    createdAt: daysAgo(2), updatedAt: daysAgo(1),
  },
];

export const MOCK_WORKFLOWS: CollectionWorkflow[] = [
  {
    id: 'wf1', organizationId: 'org1',
    name: 'Cobranza Estándar 30 Días',
    description: 'Workflow de cobranza progresivo para deudas de hasta 30 días. Comienza con recordatorio amigable y escala gradualmente.',
    status: 'active',
    triggerDescription: 'Al vencer factura',
    totalExecutions: 2340, successRate: 68.5,
    steps: [
      { id: 'ws1', workflowId: 'wf1', stepOrder: 1, name: 'Email Recordatorio', channel: 'email', templateId: 'tpl1', delayDays: 0, delayHours: 0, sendTime: '09:00', conditionType: 'none', aiEnabled: false, createdAt: daysAgo(60) },
      { id: 'ws2', workflowId: 'wf1', stepOrder: 2, name: 'WhatsApp Seguimiento', channel: 'whatsapp', templateId: 'tpl2', delayDays: 3, delayHours: 0, sendTime: '10:00', conditionType: 'previous_not_opened', aiEnabled: true, aiInstructions: 'Personalizar según historial del cliente', createdAt: daysAgo(60) },
      { id: 'ws3', workflowId: 'wf1', stepOrder: 3, name: 'SMS Urgente', channel: 'sms', templateId: 'tpl4', delayDays: 7, delayHours: 0, conditionType: 'invoice_still_unpaid', aiEnabled: false, createdAt: daysAgo(60) },
      { id: 'ws4', workflowId: 'wf1', stepOrder: 4, name: 'Llamada Directa', channel: 'call', templateId: 'tpl5', delayDays: 15, delayHours: 0, sendTime: '14:00', conditionType: 'previous_not_replied', aiEnabled: false, createdAt: daysAgo(60) },
    ],
    createdAt: daysAgo(60), updatedAt: daysAgo(2),
  },
  {
    id: 'wf2', organizationId: 'org1',
    name: 'Seguimiento Rápido WhatsApp',
    description: 'Workflow intensivo por WhatsApp para deudas recientes. Ideal para clientes con buen historial.',
    status: 'active',
    triggerDescription: '3 días después del vencimiento',
    totalExecutions: 1560, successRate: 72.1,
    steps: [
      { id: 'ws5', workflowId: 'wf2', stepOrder: 1, name: 'WhatsApp Inicial', channel: 'whatsapp', templateId: 'tpl2', delayDays: 0, delayHours: 0, sendTime: '10:00', conditionType: 'none', aiEnabled: true, createdAt: daysAgo(45) },
      { id: 'ws6', workflowId: 'wf2', stepOrder: 2, name: 'WhatsApp Recordatorio', channel: 'whatsapp', delayDays: 2, delayHours: 0, conditionType: 'previous_not_replied', aiEnabled: true, aiInstructions: 'Tono más urgente, mencionar consecuencias', createdAt: daysAgo(45) },
      { id: 'ws7', workflowId: 'wf2', stepOrder: 3, name: 'Email Formal', channel: 'email', templateId: 'tpl3', delayDays: 5, delayHours: 0, conditionType: 'invoice_still_unpaid', aiEnabled: false, createdAt: daysAgo(45) },
    ],
    createdAt: daysAgo(45), updatedAt: daysAgo(5),
  },
  {
    id: 'wf3', organizationId: 'org1',
    name: 'Cobranza Intensiva 60+',
    description: 'Workflow para deudas de más de 60 días. Combinación de canales con escalamiento a llamadas.',
    status: 'paused',
    triggerDescription: 'Manual - deudas 60+ días',
    totalExecutions: 450, successRate: 42.8,
    steps: [
      { id: 'ws8', workflowId: 'wf3', stepOrder: 1, name: 'Email Formal', channel: 'email', templateId: 'tpl3', delayDays: 0, delayHours: 0, conditionType: 'none', aiEnabled: false, createdAt: daysAgo(90) },
      { id: 'ws9', workflowId: 'wf3', stepOrder: 2, name: 'Llamada Negociación', channel: 'call', templateId: 'tpl5', delayDays: 3, delayHours: 0, sendTime: '11:00', conditionType: 'previous_not_opened', aiEnabled: false, createdAt: daysAgo(90) },
    ],
    createdAt: daysAgo(90), updatedAt: daysAgo(30),
  },
  {
    id: 'wf4', organizationId: 'org1',
    name: 'Recordatorio Pre-Vencimiento',
    description: 'Workflow preventivo que se ejecuta antes del vencimiento de la factura.',
    status: 'draft',
    triggerDescription: '5 días antes del vencimiento',
    totalExecutions: 0,
    steps: [
      { id: 'ws10', workflowId: 'wf4', stepOrder: 1, name: 'Email Preventivo', channel: 'email', delayDays: 0, delayHours: 0, sendTime: '08:00', conditionType: 'none', aiEnabled: false, createdAt: daysAgo(3) },
    ],
    createdAt: daysAgo(3), updatedAt: daysAgo(1),
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'act1', channel: 'email', title: 'Email enviado', description: 'Recordatorio de pago a Juan Pérez - Factura #1234', status: 'delivered', timestamp: minutesAgo(5), debtorName: 'Juan Pérez' },
  { id: 'act2', channel: 'whatsapp', title: 'WhatsApp abierto', description: 'María García abrió el mensaje de seguimiento', status: 'opened', timestamp: minutesAgo(12), debtorName: 'María García' },
  { id: 'act3', channel: 'whatsapp', title: 'Respuesta recibida', description: 'Carlos López respondió: "Pago el viernes"', status: 'replied', timestamp: minutesAgo(25), debtorName: 'Carlos López' },
  { id: 'act4', channel: 'email', title: 'Email rebotado', description: 'No se pudo entregar a info@empresa.com', status: 'bounced', timestamp: minutesAgo(45), debtorName: 'Empresa XYZ S.A.' },
  { id: 'act5', channel: 'call', title: 'Llamada completada', description: 'Llamada de 4:32 min con Ana Martínez - Promesa de pago', status: 'replied', timestamp: hoursAgo(1), debtorName: 'Ana Martínez' },
  { id: 'act6', channel: 'whatsapp', title: 'WhatsApp enviado', description: 'Segundo recordatorio a Roberto Sánchez', status: 'sent', timestamp: hoursAgo(2), debtorName: 'Roberto Sánchez' },
  { id: 'act7', channel: 'email', title: 'Email abierto', description: 'Laura Fernández abrió aviso formal de mora', status: 'opened', timestamp: hoursAgo(3), debtorName: 'Laura Fernández' },
  { id: 'act8', channel: 'email', title: 'Email enviado', description: 'Aviso formal enviado a Distribuidora Norte S.R.L.', status: 'delivered', timestamp: hoursAgo(4), debtorName: 'Distribuidora Norte S.R.L.' },
  { id: 'act9', channel: 'call', title: 'Llamada sin respuesta', description: 'Intento de contacto con Diego Ramírez', status: 'failed', timestamp: hoursAgo(5), debtorName: 'Diego Ramírez' },
  { id: 'act10', channel: 'whatsapp', title: 'Pago confirmado', description: 'Sofía Torres realizó pago de $45.000 post contacto', status: 'replied', timestamp: hoursAgo(6), debtorName: 'Sofía Torres' },
];

export const MOCK_HUB_SUMMARY: CommunicationHubSummary = {
  kpis: {
    sentToday: 1247,
    sentTodayChange: 18.0,
    openRate: 68.5,
    openRateChange: 5.2,
    replyRate: 32.1,
    replyRateChange: -2.1,
    paymentsPostContact: 89,
    paymentsPostContactChange: 24.0,
  },
  channels: [
    { channel: 'email', status: 'active', sentToday: 523, description: 'Operativo' },
    { channel: 'whatsapp', status: 'active', sentToday: 412, description: 'Operativo' },
    { channel: 'call', status: 'manual', sentToday: 89, description: 'Manual' },
    { channel: 'sms', status: 'inactive', sentToday: 0, description: 'No configurado' },
  ],
};
