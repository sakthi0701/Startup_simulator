export interface ScenarioInput {
  founders: Founder[];
  initialShares: number;
  initialEsopPoolPercent: number;
  rounds: Round[];
  exitValuation: number;
}

export interface Founder {
  id: string;
  name: string;
  // Founders can now be defined by either equity percentage or absolute shares
  equityPercent?: number;
  shares?: number;
}

export interface Round {
  id:string;
  name: string;
  preMoneyValuation: number;
  capitalRaised: number;
  safes: SAFE[];
  esopTopUp?: {
    percentage: number;
    isPreMoney: boolean;
  };
  // Changed to an array to support multiple secondary sales
  founderSecondary?: FounderSecondary[];
}

// A new interface for a single founder secondary sale
export interface FounderSecondary {
  id: string;
  founderName: string;
  amount: number;
}


export interface SAFE {
  id: string;
  name: string;
  amount: number;
  valuationCap?: number;
  discount?: number;
}

export interface CalculationResponse {
  summary: ScenarioSummary;
  breakdown: RoundBreakdown[];
  error?: string;
  warnings?: string[]; // Added for validation warnings
}

export interface ScenarioSummary {
  finalPostMoneyValuation: number;
  finalOwnership: StakeholderOwnership[];
  exitPayouts: StakeholderPayout[];
}

export interface RoundBreakdown {
  roundName: string;
  preMoneyValuation: number;
  capitalRaised: number;
  postMoneyValuation: number;
  preMoneyShares: number;
  pricedRoundSharePrice: number;
  ownershipBefore: StakeholderOwnership[];
  ownershipAfter: StakeholderOwnership[];
  dilutionPercent: number;
  safeAuditDetails: SafeAuditDetail[];
}

export interface SafeAuditDetail {
  safeName: string;
  amount: number;
  valuationCap?: number;
  discount?: number;
  priceFromCap?: number;
  priceFromDiscount?: number;
  finalConversionPrice: number;
  sharesFromSafe: number;
}

export interface StakeholderOwnership {
  name: string;
  type: 'Founder' | 'Investor' | 'ESOP';
  shares: number;
  percentage: number;
}

export interface StakeholderPayout {
  name: string;
  type: 'Founder' | 'Investor' | 'ESOP';
  percentage: number;
  amount: number;
}