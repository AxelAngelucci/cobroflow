import { CampaignWithStats, CampaignKpi, CampaignsSummary } from '../models/campaigns.models';

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export const MOCK_CAMPAIGNS: CampaignWithStats[] = [
  {
    id: 'camp1',
    organizationId: 'org1',
    name: 'Recordatorio Preventivo Q1',
    description: 'Campaña preventiva para clientes con facturas próximas a vencer',
    campaignType: 'preventive',
    isActive: true,
    strategyConfig: {
      channels: ['whatsapp', 'email'],
      audience: { minDaysOverdue: 0, maxDaysOverdue: 15, minAmount: 10000 }
    },
    stages: [
      {
        id: 'stage1',
        campaignId: 'camp1',
        name: 'Amigable',
        dayStart: 0,
        dayEnd: 15,
        toneInstructions: 'Tono amigable y cordial',
        actions: [
          { id: 'act1', stageId: 'stage1', channel: 'whatsapp', triggerDay: 1, aiEnabled: true, createdAt: daysAgo(30) },
          { id: 'act2', stageId: 'stage1', channel: 'email', triggerDay: 3, aiEnabled: false, createdAt: daysAgo(30) }
        ],
        createdAt: daysAgo(30)
      }
    ],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
    status: 'active',
    channelLabel: 'WhatsApp, Email',
    clientsCount: 245,
    responseRate: 68,
    recoveredAmount: 1250000,
    startDate: daysAgo(30)
  },
  {
    id: 'camp2',
    organizationId: 'org1',
    name: 'Cobranza Firme - Morosos 30+',
    description: 'Campaña de cobranza para clientes con más de 30 días de mora',
    campaignType: 'assertive',
    isActive: true,
    strategyConfig: {
      channels: ['whatsapp', 'email', 'sms'],
      audience: { minDaysOverdue: 30, maxDaysOverdue: 60, minAmount: 50000 }
    },
    stages: [
      {
        id: 'stage2',
        campaignId: 'camp2',
        name: 'Firme',
        dayStart: 16,
        dayEnd: 30,
        toneInstructions: 'Tono firme pero respetuoso',
        actions: [
          { id: 'act3', stageId: 'stage2', channel: 'whatsapp', triggerDay: 16, aiEnabled: true, createdAt: daysAgo(20) },
          { id: 'act4', stageId: 'stage2', channel: 'sms', triggerDay: 20, aiEnabled: false, createdAt: daysAgo(20) }
        ],
        createdAt: daysAgo(20)
      },
      {
        id: 'stage3',
        campaignId: 'camp2',
        name: 'Urgente',
        dayStart: 31,
        dayEnd: 60,
        toneInstructions: 'Tono urgente con advertencia de consecuencias',
        actions: [
          { id: 'act5', stageId: 'stage3', channel: 'call', triggerDay: 31, aiEnabled: true, createdAt: daysAgo(20) },
          { id: 'act6', stageId: 'stage3', channel: 'email', triggerDay: 35, aiEnabled: false, createdAt: daysAgo(20) }
        ],
        createdAt: daysAgo(20)
      }
    ],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
    status: 'active',
    channelLabel: 'WhatsApp, Email, SMS',
    clientsCount: 89,
    responseRate: 45,
    recoveredAmount: 3450000,
    startDate: daysAgo(20)
  },
  {
    id: 'camp3',
    organizationId: 'org1',
    name: 'Seguimiento Post-Venta',
    description: 'Recordatorios de pago post-venta para nuevos clientes',
    campaignType: 'friendly',
    isActive: false,
    strategyConfig: {
      channels: ['email'],
      audience: { minDaysOverdue: 0, maxDaysOverdue: 7, tags: ['Nuevo'] }
    },
    stages: [
      {
        id: 'stage4',
        campaignId: 'camp3',
        name: 'Amigable',
        dayStart: 0,
        dayEnd: 7,
        toneInstructions: 'Tono amigable de bienvenida',
        actions: [
          { id: 'act7', stageId: 'stage4', channel: 'email', triggerDay: 1, aiEnabled: false, createdAt: daysAgo(45) }
        ],
        createdAt: daysAgo(45)
      }
    ],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(10),
    status: 'paused',
    channelLabel: 'Email',
    clientsCount: 120,
    responseRate: 72,
    recoveredAmount: 890000,
    startDate: daysAgo(45)
  },
  {
    id: 'camp4',
    organizationId: 'org1',
    name: 'Recupero Legal Q4 2025',
    description: 'Campaña de cobranza legal para deudas mayores a 90 días',
    campaignType: 'legal',
    isActive: false,
    strategyConfig: {
      channels: ['email', 'call'],
      audience: { minDaysOverdue: 90, minAmount: 200000 }
    },
    stages: [
      {
        id: 'stage5',
        campaignId: 'camp4',
        name: 'Urgente',
        dayStart: 60,
        dayEnd: 90,
        toneInstructions: 'Tono formal con advertencia legal',
        actions: [
          { id: 'act8', stageId: 'stage5', channel: 'email', triggerDay: 60, aiEnabled: false, createdAt: daysAgo(90) },
          { id: 'act9', stageId: 'stage5', channel: 'call', triggerDay: 75, aiEnabled: true, createdAt: daysAgo(90) }
        ],
        createdAt: daysAgo(90)
      }
    ],
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5),
    status: 'finished',
    channelLabel: 'Email, Llamada',
    clientsCount: 34,
    responseRate: 38,
    recoveredAmount: 5200000,
    startDate: daysAgo(90)
  },
  {
    id: 'camp5',
    organizationId: 'org1',
    name: 'WhatsApp Masivo - Febrero',
    description: 'Envío masivo de recordatorios por WhatsApp',
    campaignType: 'friendly',
    isActive: true,
    strategyConfig: {
      channels: ['whatsapp'],
      audience: { minDaysOverdue: 1, maxDaysOverdue: 30 }
    },
    stages: [
      {
        id: 'stage6',
        campaignId: 'camp5',
        name: 'Amigable',
        dayStart: 0,
        dayEnd: 15,
        toneInstructions: 'Tono casual y amigable',
        actions: [
          { id: 'act10', stageId: 'stage6', channel: 'whatsapp', triggerDay: 1, aiEnabled: true, createdAt: daysAgo(5) }
        ],
        createdAt: daysAgo(5)
      }
    ],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    status: 'active',
    channelLabel: 'WhatsApp',
    clientsCount: 312,
    responseRate: 55,
    recoveredAmount: 780000,
    startDate: daysAgo(5)
  }
];

export const MOCK_CAMPAIGN_KPIS: CampaignKpi = {
  activeCampaigns: 3,
  clientsReached: 646,
  responseRate: 56,
  recoveredAmount: 11570000
};

export const MOCK_CAMPAIGNS_SUMMARY: CampaignsSummary = {
  kpis: MOCK_CAMPAIGN_KPIS,
  totalCampaigns: 5,
  activeCampaigns: 3,
  pausedCampaigns: 1,
  finishedCampaigns: 1
};
