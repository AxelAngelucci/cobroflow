import {
  CampaignApiResponse,
  CampaignListItemApiResponse,
  StageActionApiResponse,
  CampaignStageApiResponse
} from './api.models';

export type CampaignType = 'preventive' | 'friendly' | 'assertive' | 'legal';
export type ChannelType = 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
export type CampaignStatus = 'active' | 'paused' | 'finished';
export type CampaignFilterTab = 'all' | 'active' | 'paused' | 'finished';

export interface StageAction {
  id: string;
  stageId: string;
  channel: ChannelType;
  triggerDay: number;
  templateId?: string;
  aiEnabled: boolean;
  createdAt: Date;
}

export interface CampaignStage {
  id: string;
  campaignId: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  toneInstructions?: string;
  actions: StageAction[];
  createdAt: Date;
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  campaignType?: CampaignType;
  isActive: boolean;
  strategyConfig?: Record<string, unknown>;
  workflowId?: string;
  stages: CampaignStage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignWithStats extends Campaign {
  status: CampaignStatus;
  channelLabel: string;
  clientsCount: number;
  responseRate: number;
  recoveredAmount: number;
  startDate?: Date;
}

export interface CampaignsFilter {
  search?: string;
  tab: CampaignFilterTab;
}

export interface CampaignKpi {
  activeCampaigns: number;
  clientsReached: number;
  responseRate: number;
  recoveredAmount: number;
}

export interface CampaignsSummary {
  kpis: CampaignKpi;
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  finishedCampaigns: number;
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  preventive: 'Preventiva',
  friendly: 'Amigable',
  assertive: 'Asertiva',
  legal: 'Legal'
};

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  call: 'Llamada',
  ai_voice: 'IA Voice'
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  finished: 'Finalizada'
};

// ============================================
// API → Frontend Mappers
// ============================================

function mapApiAction(action: StageActionApiResponse): StageAction {
  return {
    id: action.id,
    stageId: action.stage_id,
    channel: action.channel,
    triggerDay: action.trigger_day,
    templateId: action.template_id ?? undefined,
    aiEnabled: action.ai_enabled,
    createdAt: new Date(action.created_at)
  };
}

function mapApiStage(stage: CampaignStageApiResponse): CampaignStage {
  return {
    id: stage.id,
    campaignId: stage.campaign_id,
    name: stage.name,
    dayStart: stage.day_start,
    dayEnd: stage.day_end,
    toneInstructions: stage.tone_instructions ?? undefined,
    actions: stage.actions.map(mapApiAction),
    createdAt: new Date(stage.created_at)
  };
}

function deriveChannelLabel(stages: CampaignStage[]): string {
  const channels = new Set<ChannelType>();
  for (const stage of stages) {
    for (const action of stage.actions) {
      channels.add(action.channel);
    }
  }
  return Array.from(channels).map(ch => CHANNEL_LABELS[ch]).join(', ') || 'Sin canal';
}

export function mapApiToCampaignWithStats(api: CampaignApiResponse): CampaignWithStats {
  const stages = api.stages.map(mapApiStage);
  return {
    id: api.id,
    organizationId: api.organization_id,
    name: api.name,
    description: api.description ?? undefined,
    campaignType: api.campaign_type ?? undefined,
    isActive: api.is_active,
    strategyConfig: api.strategy_config ?? undefined,
    workflowId: api.workflow_id ?? undefined,
    stages,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
    status: api.is_active ? 'active' : 'paused',
    channelLabel: deriveChannelLabel(stages),
    clientsCount: 0,
    responseRate: 0,
    recoveredAmount: 0,
    startDate: new Date(api.created_at)
  };
}

export function mapApiListItemToCampaignWithStats(api: CampaignListItemApiResponse): CampaignWithStats {
  const channelsFromConfig = (api.strategy_config as Record<string, unknown>)?.['channels'] as string[] | undefined;
  const channelLabel = channelsFromConfig
    ? channelsFromConfig.map(ch => CHANNEL_LABELS[ch as ChannelType] ?? ch).join(', ')
    : 'Sin canal';

  return {
    id: api.id,
    organizationId: api.organization_id,
    name: api.name,
    description: api.description ?? undefined,
    campaignType: api.campaign_type ?? undefined,
    isActive: api.is_active,
    strategyConfig: api.strategy_config ?? undefined,
    workflowId: api.workflow_id ?? undefined,
    stages: [],
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
    status: api.is_active ? 'active' : 'paused',
    channelLabel,
    clientsCount: 0,
    responseRate: 0,
    recoveredAmount: 0,
    startDate: new Date(api.created_at)
  };
}
