// C2: Auto-Ingest Hub — Maxwell
// Email forwarding, webhooks, and channel management
// AGPL v3 — Syntropy LLC

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Copy,
  Check,
  Trash2,
  Plus,
  Webhook,
  Mail,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE = '/api';
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// ── Types ────────────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  type: 'email' | 'webhook' | 'api';
  source: string;
  status: 'active' | 'paused';
  created_at: string;
  last_used_at: string;
}

interface Ingestion {
  id: string;
  filename: string;
  category: string;
  source: string;
  status: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
      style={{
        color: active ? 'var(--maxwell-primary)' : 'var(--maxwell-text-secondary)',
        backgroundColor: active ? 'var(--maxwell-primary-light)' : 'transparent',
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">{count}</Badge>
      )}
    </button>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AutoIngestHub() {
  const [activeTab, setActiveTab] = useState<'email' | 'webhook' | 'channels' | 'recent'>('email');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ingestions, setIngestions] = useState<Ingestion[]>([]);
  const [forwardingAddress, setForwardingAddress] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChannel, setNewChannel] = useState<{ type: string; source: string }>({ type: 'email', source: '' });
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch channels ─────────────────────────────────────────────────────────
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auto-ingest/channels`);
      const data = await res.json();
      if (data.success && data.channels) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  }, []);

  // ── Generate forwarding address ────────────────────────────────────────────
  const generateForwardingAddress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auto-ingest/forwarding-address`, { method: 'POST' });
      const data = await res.json();
      setForwardingAddress(data.forwarding_address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate address');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Generate webhook URL ──────────────────────────────────────────────────
  const generateWebhookUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auto-ingest/forwarding-address`, { method: 'POST' });
      const data = await res.json();
      const base = window.location.origin;
      setWebhookUrl(`${base}/api/auto-ingest/webhook?token=${data.forwarding_address.split('@')[0].replace('maxwell-', '')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate webhook');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Disconnect channel ────────────────────────────────────────────────────
  const disconnectChannel = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/auto-ingest/channels/${id}`, { method: 'DELETE' });
      setChannels(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to disconnect channel:', err);
    }
  }, []);

  // ── Add channel ───────────────────────────────────────────────────────────
  const addChannel = useCallback(() => {
    if (!newChannel.source.trim()) return;
    const channel: Channel = {
      id: `ch-${Math.random().toString(36).slice(2)}`,
      type: newChannel.type as 'email' | 'webhook' | 'api',
      source: newChannel.source,
      status: 'active',
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    };
    setChannels(prev => [...prev, channel]);
    setNewChannel({ type: 'email', source: '' });
    setShowAddDialog(false);
  }, [newChannel]);

  // ── Seed data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    void fetchChannels();
    // Seed ingestions from the function's seed data
    setIngestions([
      { id: 'ing-1', filename: 'insurance_policy_q2.pdf', category: 'Medical', source: 'Gmail Forward', status: 'completed', created_at: '2026-06-25T14:30:00Z' },
      { id: 'ing-2', filename: 'june_utility_bill.pdf', category: 'Financial', source: 'Dropbox Sync', status: 'completed', created_at: '2026-06-24T09:15:00Z' },
      { id: 'ing-3', filename: 'lease_amendment_2026.pdf', category: 'Housing', source: 'Gmail Forward', status: 'processing', created_at: '2026-06-23T11:00:00Z' },
    ]);
    // Pre-generate forwarding address and webhook
    void generateForwardingAddress();
    void generateWebhookUrl();
  }, [fetchChannels, generateForwardingAddress, generateWebhookUrl]);

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "My App",
    "payload": {
      "document_url": "https://example.com/doc.pdf",
      "metadata": { "title": "Invoice", "description": "Monthly utility bill" }
    }
  }'`;

  return (
    <div className="w-full max-w-container mx-auto px-4 sm:px-8 lg:px-10 py-6">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
      >
        <h1
          className="font-semibold flex items-center gap-3"
          style={{
            fontSize: 'clamp(22px, 3vw, 28px)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--maxwell-text-primary)',
          }}
        >
          <Inbox size={28} style={{ color: 'var(--maxwell-primary)' }} />
          Auto-Ingest Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
          Email forwarding, webhooks, and ingestion channels
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--maxwell-error-bg)', color: 'var(--maxwell-error)' }}
        >
          <span className="text-sm flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-sm underline">Dismiss</button>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        className="flex flex-wrap gap-2 mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TabButton
          active={activeTab === 'email'}
          onClick={() => setActiveTab('email')}
          icon={<Mail size={16} />}
          label="Email Forwarding"
        />
        <TabButton
          active={activeTab === 'webhook'}
          onClick={() => setActiveTab('webhook')}
          icon={<Webhook size={16} />}
          label="Webhook"
        />
        <TabButton
          active={activeTab === 'channels'}
          onClick={() => setActiveTab('channels')}
          icon={<Terminal size={16} />}
          label="Channels"
          count={channels.length}
        />
        <TabButton
          active={activeTab === 'recent'}
          onClick={() => setActiveTab('recent')}
          icon={<Inbox size={16} />}
          label="Recent"
          count={ingestions.length}
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ── Email Forwarding Tab ── */}
        {activeTab === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: 'var(--maxwell-surface)',
                borderColor: 'var(--maxwell-border-subtle)',
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--maxwell-primary-light)', color: 'var(--maxwell-primary)' }}
                >
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--maxwell-text-primary)' }}>
                    Your Maxwell Ingest Email
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                    Forward emails with attachments to this address. Documents are auto-categorized.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-mono"
                  style={{ backgroundColor: 'var(--maxwell-bg)', color: 'var(--maxwell-text-primary)' }}
                >
                  {forwardingAddress || 'Generating...'}
                </div>
                <CopyButton text={forwardingAddress} label="Copy" />
              </div>

              <div
                className="rounded-lg p-4 text-xs"
                style={{ backgroundColor: 'var(--maxwell-primary-light)' }}
              >
                <p className="font-medium mb-1" style={{ color: 'var(--maxwell-primary)' }}>
                  How it works
                </p>
                <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--maxwell-text-secondary)' }}>
                  <li>Copy the unique address above</li>
                  <li>In Gmail, create a forwarding filter to this address</li>
                  <li>Attachments are extracted, categorized, and stored</li>
                  <li>Supported: PDFs, images, Word docs (max 25MB)</li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Webhook Tab ── */}
        {activeTab === 'webhook' && (
          <motion.div
            key="webhook"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: 'var(--maxwell-surface)',
                borderColor: 'var(--maxwell-border-subtle)',
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}
                >
                  <Webhook size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--maxwell-text-primary)' }}>
                    Webhook Endpoint
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                    POST documents from external systems using this URL.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-mono break-all"
                  style={{ backgroundColor: 'var(--maxwell-bg)', color: 'var(--maxwell-text-primary)' }}
                >
                  {webhookUrl || 'Generating...'}
                </div>
                <CopyButton text={webhookUrl} label="Copy URL" />
              </div>

              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: '#1e293b' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Terminal size={14} style={{ color: '#94a3b8' }} />
                  <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                    cURL Example
                  </span>
                </div>
                <pre className="text-xs overflow-x-auto" style={{ color: '#e2e8f0' }}>
                  <code>{curlExample}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Channels Tab ── */}
        {activeTab === 'channels' && (
          <motion.div
            key="channels"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--maxwell-text-primary)' }}>
                Connected Channels
              </h3>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus size={14} />
                    Add Channel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Ingestion Channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--maxwell-text-secondary)' }}>
                        Channel Type
                      </label>
                      <Select
                        value={newChannel.type}
                        onValueChange={(v) => setNewChannel(prev => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--maxwell-text-secondary)' }}>
                        Source Name
                      </label>
                      <Input
                        placeholder="e.g., Gmail, Dropbox, Scanner"
                        value={newChannel.source}
                        onChange={(e) => setNewChannel(prev => ({ ...prev, source: e.target.value }))}
                      />
                    </div>
                    <Button onClick={addChannel} disabled={!newChannel.source.trim()} className="w-full">
                      Add Channel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence>
                {channels.map((channel, i) => (
                  <motion.div
                    key={channel.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 rounded-xl border p-4"
                    style={{
                      backgroundColor: 'var(--maxwell-surface)',
                      borderColor: 'var(--maxwell-border-subtle)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: channel.type === 'email' ? 'var(--maxwell-primary-light)' :
                          channel.type === 'webhook' ? '#dbeafe' : '#f3f4f6',
                        color: channel.type === 'email' ? 'var(--maxwell-primary)' :
                          channel.type === 'webhook' ? '#2563eb' : '#6b7280',
                      }}
                    >
                      {channel.type === 'email' ? <Mail size={18} /> :
                        channel.type === 'webhook' ? <Webhook size={18} /> : <Terminal size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--maxwell-text-primary)' }}>
                          {channel.source}
                        </p>
                        <Badge
                          variant={channel.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {channel.status}
                        </Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                        {channel.type.toUpperCase()} · Last used {formatDate(channel.last_used_at)} at {formatTime(channel.last_used_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => disconnectChannel(channel.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50 flex-shrink-0"
                      style={{ color: '#ef4444' }}
                      title="Disconnect channel"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {channels.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--maxwell-text-secondary)' }}>
                    No channels connected yet.
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                    Add your first ingestion channel to get started.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Recent Tab ── */}
        {activeTab === 'recent' && (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--maxwell-text-primary)' }}>
              Recent Ingestions
            </h3>
            <div className="space-y-2.5">
              <AnimatePresence>
                {ingestions.map((ing, i) => (
                  <motion.div
                    key={ing.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 rounded-xl border p-4"
                    style={{
                      backgroundColor: 'var(--maxwell-surface)',
                      borderColor: 'var(--maxwell-border-subtle)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--maxwell-text-primary)' }}>
                          {ing.filename}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {ing.category}
                        </Badge>
                        <Badge
                          variant={ing.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {ing.status}
                        </Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                        From {ing.source} · {formatDate(ing.created_at)} at {formatTime(ing.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {ingestions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--maxwell-text-secondary)' }}>
                    No ingestions yet.
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                    Documents will appear here once ingested.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
