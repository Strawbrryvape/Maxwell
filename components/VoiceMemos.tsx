// C6: Voice Memos — Maxwell
// Record, transcribe, and link voice memos to documents
// AGPL v3 — Syntropy LLC

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  X,
  Play,
  Pause,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface VoiceMemo {
  id: string;
  title: string;
  duration_seconds: number;
  transcript: string;
  transcript_preview: string;
  related_document_id: string | null;
  related_doc_title: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractKeyPoints(transcript: string): string[] {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const keywords = ['need to', 'follow up', 'schedule', 'reminder', 'upload', 'collect', 'pick up', 'call'];
  return sentences.filter(s =>
    keywords.some(kw => s.toLowerCase().includes(kw))
  ).map(s => s.trim());
}

// ── Mock Documents for Attachment ────────────────────────────────────────────

const MOCK_DOCUMENTS = [
  { id: 'doc-lease-1', title: 'Lease Agreement 2026' },
  { id: 'doc-ins-1', title: 'Health Insurance Policy' },
  { id: 'doc-med-1', title: 'Medical Bill - Emergency' },
  { id: 'doc-tax-1', title: 'W-2 Form 2025' },
  { id: 'doc-util-1', title: 'June Utility Bill' },
];

// ── Main Component ───────────────────────────────────────────────────────────

export function VoiceMemos() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [, setAudioChunks] = useState<Blob[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [pendingTranscript, setPendingTranscript] = useState('');
  const [pendingDuration, setPendingDuration] = useState(0);
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null);
  const [playingMemo, setPlayingMemo] = useState<string | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Fetch memos ────────────────────────────────────────────────────────────
  const fetchMemos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/voice/memos`);
      const data = await res.json();
      if (data.memos) {
        setMemos(data.memos);
      }
    } catch (err) {
      console.error('Failed to fetch memos:', err);
    }
  }, []);

  useEffect(() => {
    void fetchMemos();
  }, [fetchMemos]);

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const finalTime = recordingTime;
    setPendingDuration(finalTime);
    setIsRecording(false);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Request transcription
    try {
      const res = await fetch(`${API_BASE}/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_duration_seconds: finalTime }),
      });
      const data = await res.json();
      setPendingTranscript(data.transcript || '');
      setNewMemoTitle(`Voice Memo ${new Date().toLocaleDateString()}`);
      setShowSaveDialog(true);
    } catch (err) {
      console.error('Transcription failed:', err);
      setPendingTranscript('(Transcription unavailable)');
      setNewMemoTitle(`Voice Memo ${new Date().toLocaleDateString()}`);
      setShowSaveDialog(true);
    }

    setMediaRecorder(null);
    setAudioChunks([]);
  }, [mediaRecorder, recordingTime]);

  // ── Cancel recording ───────────────────────────────────────────────────────
  const cancelRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    setMediaRecorder(null);
    setAudioChunks([]);
  }, [mediaRecorder]);

  // ── Save memo ──────────────────────────────────────────────────────────────
  const saveMemo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/voice/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMemoTitle,
          duration_seconds: pendingDuration,
          transcript: pendingTranscript,
          related_document_id: selectedDocId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMemos();
      }
    } catch (err) {
      console.error('Failed to save memo:', err);
    }
    setShowSaveDialog(false);
    setNewMemoTitle('');
    setSelectedDocId('');
    setPendingTranscript('');
    setPendingDuration(0);
  }, [newMemoTitle, pendingDuration, pendingTranscript, selectedDocId, fetchMemos]);

  // ── Delete memo ────────────────────────────────────────────────────────────
  const deleteMemo = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/voice/memos/${id}`, { method: 'DELETE' });
      setMemos(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete memo:', err);
    }
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const keyPoints = (transcript: string) => extractKeyPoints(transcript);

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
          <Mic size={28} style={{ color: '#e11d48' }} />
          Voice Memos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
          Record, transcribe, and link voice notes to documents
        </p>
      </motion.div>

      {/* Recording Interface */}
      <motion.div
        className="rounded-xl border p-6 mb-6"
        style={{
          backgroundColor: isRecording ? '#fff1f2' : 'var(--maxwell-surface)',
          borderColor: isRecording ? '#fecdd3' : 'var(--maxwell-border-subtle)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            {isRecording && (
              <motion.div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#e11d48' }}
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            <span
              className="text-3xl font-mono font-bold tabular-nums"
              style={{ color: isRecording ? '#e11d48' : 'var(--maxwell-text-primary)' }}
            >
              {formatDuration(recordingTime)}
            </span>
          </div>

          {/* Record Button */}
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                }}
              >
                <Mic size={28} />
              </button>
            ) : (
              <>
                <button
                  onClick={cancelRecording}
                  className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                  }}
                  title="Cancel"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                  }}
                  title="Stop recording"
                >
                  <Square size={24} fill="white" />
                </button>
              </>
            )}
          </div>

          {/* Status text */}
          <p className="text-xs font-medium" style={{ color: isRecording ? '#e11d48' : 'var(--maxwell-text-tertiary)' }}>
            {isRecording ? 'Recording...' : 'Tap to start recording'}
          </p>
        </div>
      </motion.div>

      {/* Memo List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--maxwell-text-primary)' }}>
          {memos.length} Memo{memos.length !== 1 ? 's' : ''}
        </h3>

        <AnimatePresence>
          {memos.map((memo, i) => {
            const isExpanded = expandedMemo === memo.id;
            const isPlaying = playingMemo === memo.id;
            const kp = isExpanded ? keyPoints(memo.transcript) : [];

            return (
              <motion.div
                key={memo.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: 'var(--maxwell-surface)',
                  borderColor: 'var(--maxwell-border-subtle)',
                }}
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}
                    >
                      <Mic size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        value={memo.title}
                        onChange={(e) => {
                          setMemos(prev => prev.map(m =>
                            m.id === memo.id ? { ...m, title: e.target.value } : m
                          ));
                        }}
                        className="h-7 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={{ color: 'var(--maxwell-text-primary)' }}
                      />
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock size={10} />
                          {formatDuration(memo.duration_seconds)}
                        </Badge>
                        <span className="text-xs" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                          {formatDate(memo.created_at)}
                        </span>
                        {memo.related_doc_title && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Paperclip size={10} />
                            {memo.related_doc_title}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPlayingMemo(prev => prev === memo.id ? null : memo.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-black/5"
                        style={{ color: 'var(--maxwell-text-secondary)' }}
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => setExpandedMemo(prev => prev === memo.id ? null : memo.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-black/5"
                        style={{ color: 'var(--maxwell-text-secondary)' }}
                        title="Toggle transcript"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => deleteMemo(memo.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: '#ef4444' }}
                        title="Delete memo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Waveform placeholder */}
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1 mt-3 px-2 py-2 rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'var(--maxwell-bg)' }}
                    >
                      {Array.from({ length: 40 }).map((_, wi) => (
                        <motion.div
                          key={wi}
                          className="flex-1 rounded-full"
                          style={{ backgroundColor: '#e11d48', minWidth: 2 }}
                          animate={{
                            height: [4, 12 + Math.random() * 20, 4],
                          }}
                          transition={{
                            duration: 0.8 + Math.random() * 0.5,
                            repeat: Infinity,
                            delay: wi * 0.03,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Expanded Transcript */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--maxwell-border-subtle)' }}>
                          {/* Key Points */}
                          {kp.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium mb-1.5" style={{ color: '#e11d48' }}>
                                Key Points
                              </p>
                              <ul className="space-y-1">
                                {kp.map((point, pi) => (
                                  <li
                                    key={pi}
                                    className="text-xs flex items-start gap-1.5"
                                    style={{ color: 'var(--maxwell-text-secondary)' }}
                                  >
                                    <span className="flex-shrink-0 mt-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: '#e11d48' }} />
                                    {point}.
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Full Transcript */}
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--maxwell-text-secondary)' }}>
                            {memo.transcript}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {memos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Mic size={32} className="mx-auto mb-3" style={{ color: 'var(--maxwell-text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--maxwell-text-secondary)' }}>
              No voice memos yet.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
              Tap the record button to create your first memo.
            </p>
          </motion.div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Voice Memo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--maxwell-text-secondary)' }}>
                Title
              </label>
              <Input
                value={newMemoTitle}
                onChange={(e) => setNewMemoTitle(e.target.value)}
                placeholder="Memo title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--maxwell-text-secondary)' }}>
                Duration
              </label>
              <p className="text-sm" style={{ color: 'var(--maxwell-text-primary)' }}>
                {formatDuration(pendingDuration)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--maxwell-text-secondary)' }}>
                Transcript Preview
              </label>
              <p className="text-xs leading-relaxed rounded-lg p-3" style={{ backgroundColor: 'var(--maxwell-bg)', color: 'var(--maxwell-text-secondary)' }}>
                {pendingTranscript.slice(0, 120)}...
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--maxwell-text-secondary)' }}>
                Attach to Document
              </label>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a document (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {MOCK_DOCUMENTS.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowSaveDialog(false);
                setNewMemoTitle('');
                setSelectedDocId('');
              }}>
                Discard
              </Button>
              <Button className="flex-1" onClick={saveMemo} disabled={!newMemoTitle.trim()}>
                Save Memo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
