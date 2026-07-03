// Maxwell API Type Definitions — frontend-safe copies
// These mirror db/schema.ts types for use in the React frontend.
// Do NOT import from @/db/schema here — that module is backend-only.
// AGPL v3 — Syntropy LLC

// ── Enums ────────────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'Housing'
  | 'Medical'
  | 'Financial'
  | 'Legal'
  | 'Vehicle'
  | 'Employment'
  | 'General';

/** Backend status values as stored in the database */
export type DocumentStatus =
  | 'pending'
  | 'parsing'
  | 'completed'
  | 'failed';

// ── Entity Types ─────────────────────────────────────────────────────────────

export interface ParsedEntities {
  issuer?: string;
  recipient?: string;
  account_number?: string;
  policy_number?: string;
  amount_due?: string;
  expiration_date?: string;
  issue_date?: string;
  rent_amount?: string;
  lease_start?: string;
  lease_end?: string;
  pay_period?: string;
  gross_amount?: string;
  net_amount?: string;
  employer?: string;
  premium_amount?: string;
  coverage_dates?: string;
  confidence?: number;
  [key: string]: string | number | undefined;
}

// ── API Response Types ───────────────────────────────────────────────────────

export interface DocumentListItem {
  id: string;
  filename: string;
  original_name: string;
  category: DocumentCategory;
  document_type: string | null;
  status: DocumentStatus;
  entities: ParsedEntities;
  file_size: number;
  mime_type: string;
  created_at: number;
  expiration_date?: string;
}

export interface DocumentDetailResponse {
  id: string;
  filename: string;
  original_name: string;
  category: DocumentCategory;
  document_type: string | null;
  status: DocumentStatus;
  entities: ParsedEntities;
  file_size: number;
  mime_type: string;
  created_at: number;
  expiration_date?: string;
  raw_text: string | null;
  storage_key: string;
}

export interface SearchResult {
  id: string;
  filename: string;
  original_name: string;
  category: DocumentCategory;
  document_type: string | null;
  snippet: string;
  relevance: number;
  entities: ParsedEntities;
  status: DocumentStatus;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  grouped_by_category: Record<string, SearchResult[]>;
}

// ── API Request Types ────────────────────────────────────────────────────────

export interface UploadRequest {
  file: File;
}

export interface UploadResponse {
  id: string;
  status: DocumentStatus;
  filename: string;
  hash?: string;
}

export interface CategoryUpdateRequest {
  category: DocumentCategory;
}

export interface SearchRequest {
  query: string;
}

// ── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthSessionRequest {
  user_id: string;
}

export interface AuthSessionResponse {
  token: string;
  expires_at: number;
}
