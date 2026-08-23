export type GatewayErrorKind = 'RETRIABLE' | 'BUSINESS';

export interface GatewayResult {
    success: boolean;
    externalId?: string;
    status?: 'paid' | 'failed' | 'pending';
    errorCode?: string;
    errorMessage?: string;
    kind?: GatewayErrorKind;
    raw?: unknown;
  }