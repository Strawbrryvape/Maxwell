// Maxwell API Client — connects frontend to real backend
// AGPL v3 — Syntropy LLC

import type {
  DocumentCategory,
  DocumentStatus as FrontendDocumentStatus,
} from '@/data/demoDocuments';
import type { DemoDocument } from '@/data/demoDocuments';
import type {
  DocumentListItem,
  DocumentDetailResponse,
  SearchResponse,
  ParsedEntities,
  DocumentStatus as BackendDocumentStatus,
} from './api-types';

// ── API Base URL ─────────────────────────────────────────────────────────────

const API_BASE = '/api';

// ── Token Management ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'maxwell_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Clear auth state and trigger re-authentication.
 */
function clearAuthAndRedirect(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('maxwell_token_expires');
  // Trigger a page reload — the auth hook will regenerate user_id and fetch a new token
  window.location.reload();
}

// ── Core Request Wrapper ─────────────────────────────────────────────────────

/**
 * Generic API request wrapper.
 * - Adds Authorization header with Bearer token
 * - Adds Content-Type: application/json for non-FormData bodies
 * - Returns parsed JSON
 * - Handles 401 → clears auth and reloads
 * - Throws user-friendly errors
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData) && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error('Network error — please check your connection and try again.');
  }

  // Handle 401 Unauthorized → clear auth and reload
  if (response.status === 401) {
    clearAuthAndRedirect();
    throw new Error('Session expired — please sign in again.');
  }

  // Handle 429 Rate Limit
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const message = resetTime
      ? 'Rate limit exceeded. Try again in a moment.'
      : 'Too many requests — please slow down.';
    throw new Error(message);
  }

  // Parse response body
  let data: unknown;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else if (contentType.includes('application/zip')) {
    // For ZIP exports, return the blob directly
    return response.blob() as unknown as T;
  } else {
    try {
      data = await response.text();
    } catch {
      data = '';
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    const errorData = data as { error?: string; message?: string } | undefined;
    const message =
      errorData?.message ||
      errorData?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ── Status Mapping: Backend → Frontend ───────────────────────────────────────

/**
 * Map backend document status to frontend DocumentStatus.
 */
function mapStatus(backend: BackendDocumentStatus): FrontendDocumentStatus {
  switch (backend) {
    case 'pending':
      return 'uploading';
    case 'parsing':
      return 'parsing';
    case 'completed':
      return 'complete';
    case 'failed':
      return 'failed';
    default:
      return 'uploading';
  }
}

// ── Format Helpers ───────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeFromMime(mimeType: string): 'pdf' | 'image' | 'unsupported' {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'unsupported';
}

// ── Type Adapters ────────────────────────────────────────────────────────────

/**
 * Convert backend DocumentListItem to frontend DemoDocument.
 */
export function adaptDocumentListItem(doc: DocumentListItem): DemoDocument {
  const entities = doc.entities || {};

  return {
    id: doc.id,
    name: doc.original_name || doc.filename,
    category: doc.category,
    entity: entities.issuer || entities.recipient || entities.employer || '',
    amount: entities.amount_due || entities.rent_amount || entities.net_amount || entities.premium_amount || entities.gross_amount || undefined,
    date: entities.issue_date || entities.coverage_dates || entities.pay_period || entities.lease_start || undefined,
    policyRef: entities.account_number || entities.policy_number || undefined,
    status: mapStatus(doc.status),
    thumbnail: '/og-image.png',
    uploadDate: new Date(doc.created_at * 1000).toISOString(),
    expirationDate: doc.expiration_date || entities.expiration_date || undefined,
    fileType: getFileTypeFromMime(doc.mime_type),
    fileSize: formatFileSize(doc.file_size),
    rawText: undefined,
  };
}

/**
 * Convert backend DocumentDetailResponse to frontend DemoDocument.
 */
export function adaptDocumentDetail(
  doc: DocumentDetailResponse & { download_url?: string | null }
): DemoDocument {
  const entities = doc.entities || {};

  return {
    id: doc.id,
    name: doc.original_name || doc.filename,
    category: doc.category,
    entity: entities.issuer || entities.recipient || entities.employer || '',
    amount: entities.amount_due || entities.rent_amount || entities.net_amount || entities.premium_amount || entities.gross_amount || undefined,
    date: entities.issue_date || entities.coverage_dates || entities.pay_period || entities.lease_start || undefined,
    policyRef: entities.account_number || entities.policy_number || undefined,
    status: mapStatus(doc.status),
    thumbnail: doc.download_url || '/og-image.png',
    uploadDate: new Date(doc.created_at * 1000).toISOString(),
    expirationDate: doc.expiration_date || entities.expiration_date || undefined,
    fileType: getFileTypeFromMime(doc.mime_type),
    fileSize: formatFileSize(doc.file_size),
    rawText: doc.raw_text || undefined,
  };
}

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * Authenticate and get a signed token.
 */
export async function authSession(userId: string): Promise<{ token: string; expires_at: number }> {
  const response = await fetch(`${API_BASE}/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a document file.
 */
export async function uploadDocument(
  file: File
): Promise<{ id: string; status: BackendDocumentStatus; filename: string; hash?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // Upload needs manual fetch to use FormData
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    clearAuthAndRedirect();
    throw new Error('Session expired — please sign in again.');
  }

  if (response.status === 429) {
    throw new Error('Too many uploads — please slow down. You can upload up to 10 files per minute.');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorData = data as { error?: string; message?: string } | undefined;
    throw new Error(errorData?.message || errorData?.error || `Upload failed: ${response.status}`);
  }

  return data as { id: string; status: BackendDocumentStatus; filename: string; hash?: string };
}

/**
 * List user's documents with optional category filter.
 */
export async function listDocuments(
  filters?: { category?: string }
): Promise<{
  documents: DocumentListItem[];
  total: number;
  category_counts: { category: string; count: number }[];
}> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'All') {
    params.set('category', filters.category);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/documents?${queryString}` : '/documents';

  return apiRequest<{
    documents: DocumentListItem[];
    total: number;
    category_counts: { category: string; count: number }[];
  }>(endpoint, { method: 'GET' });
}

/**
 * Get a single document by ID.
 */
export async function getDocument(
  id: string
): Promise<DocumentDetailResponse & { download_url: string | null }> {
  return apiRequest<DocumentDetailResponse & { download_url: string | null }>(
    `/documents/${id}`,
    { method: 'GET' }
  );
}

/**
 * Update a document's category.
 */
export async function updateDocumentCategory(
  id: string,
  category: DocumentCategory
): Promise<void> {
  await apiRequest<void>(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ category }),
  });
}

/**
 * Delete a document.
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiRequest<void>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search documents with backend full-text search.
 */
export async function searchDocuments(query: string): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/**
 * Export all documents as a ZIP archive.
 */
export async function exportDocuments(): Promise<Blob> {
  return apiRequest<Blob>('/export', {
    method: 'GET',
  });
}

export type { DocumentListItem, DocumentDetailResponse, SearchResponse, ParsedEntities };
