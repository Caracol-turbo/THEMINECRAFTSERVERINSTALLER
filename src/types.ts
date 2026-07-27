export type SoftwareType = 'vanilla' | 'paper' | 'purpur' | 'fabric' | 'forge' | 'neoforge';

export interface SoftwareInfo {
  id: SoftwareType;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  recommendedRam: number;
}

export interface ServerSummary {
  name: string;
  path: string;
  hasEula: boolean;
  hasProps: boolean;
  hasStartScript: boolean;
  hasJar: boolean;
  hasPlayit?: boolean;
  hasPlayitKey?: boolean;
  ramAllocated: string;
  createdAt: string;
  startScriptContent?: string;
  isRunning?: boolean;
  status?: 'stopped' | 'starting' | 'running' | 'stopping';
}

export interface OpEntry {
  uuid?: string;
  name: string;
  level: number;
  bypassesPlayerLimit: boolean;
}

export interface ServerDetail {
  name: string;
  files: string[];
  properties: Record<string, string>;
  rawProperties: string;
  ops: OpEntry[];
  startScript: string;
  eula: string;
  hasPlayit: boolean;
  hasPlayitKey?: boolean;
  playitToml: string;
  playitSecret?: string;
  isRunning?: boolean;
  status?: 'stopped' | 'starting' | 'running' | 'stopping';
}

export type Language = 'es' | 'en';
