// Request DTOs
export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  company_name: string;
  cuit: string;
  industry_type: IndustryType;
  company_size: CompanySize;
  monthly_collection_volume: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Response DTOs
export interface Organization {
  id: string;
  name: string;
  cuit: string;
  industry_type: IndustryType;
  company_size: CompanySize;
  monthly_collection_volume: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  organization_id: string;
  organization?: Organization;
  is_active?: boolean;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Enums
export type IndustryType = 
  | 'retail' 
  | 'services' 
  | 'manufacturing' 
  | 'healthcare' 
  | 'education' 
  | 'technology' 
  | 'finance' 
  | 'real_estate' 
  | 'hospitality' 
  | 'other';

export type CompanySize = 
  | 'micro' 
  | 'small' 
  | 'medium' 
  | 'large' 
  | 'enterprise';

export type UserRole = 'admin' | 'agent' | 'viewer';

// Mappers for form values to API values
export const INDUSTRY_MAP: Record<string, IndustryType> = {
  'finanzas': 'finance',
  'retail': 'retail',
  'telecomunicaciones': 'services',
  'servicios': 'services',
  'salud': 'healthcare',
  'educacion': 'education',
  'inmobiliaria': 'real_estate',
  'manufactura': 'manufacturing',
  'tecnologia': 'technology',
  'otro': 'other'
};

export const COMPANY_SIZE_MAP: Record<string, CompanySize> = {
  '1-10': 'micro',
  '11-50': 'small',
  '51-200': 'medium',
  '201-500': 'large',
  '500+': 'enterprise'
};

export const MONTHLY_VOLUME_MAP: Record<string, number> = {
  '0-100k': 50000,
  '100k-500k': 300000,
  '500k-1m': 750000,
  '1m-5m': 3000000,
  '5m+': 10000000
};
