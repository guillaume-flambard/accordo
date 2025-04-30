export type Objectives = {
  paymentDays: number;
  deliveryDays: number;
  penaltyRate: number;
};

export type ClauseField = 'payment' | 'delivery' | 'penalty';

export type ClauseSuggestion = {
  field: ClauseField;
  suggestions: string[];
  scores: number[];
};

export type NegotiationRequest = {
  contractText: string;
  objectives: Objectives;
};

export type NegotiationResponse = {
  suggestions: ClauseSuggestion[];
};

export type ContractGeneration = {
  contractText: string;
  selectedClauses: Record<ClauseField, string>;
};

export type ContractResponse = {
  pdfUrl: string;
}; 