/**
 * Maxwell — AI-powered personal life-admin appliance
 * Copyright (C) 2026 Syntropy LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];

interface RawTextToggleProps {
  rawText: string;
}

export default function RawTextToggle({ rawText }: RawTextToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [rawText]);

  return (
    <div
      style={{
        borderTop: '1px solid var(--maxwell-border-subtle)',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 transition-colors duration-fast hover:opacity-80"
        style={{ color: 'var(--maxwell-text-secondary)' }}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
          {isOpen ? 'Hide raw text' : 'View raw text'}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: easeSmooth }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: contentHeight, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <div
              ref={contentRef}
              className="mb-4 overflow-auto"
              style={{
                backgroundColor: 'var(--maxwell-background)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                maxHeight: '400px',
              }}
            >
              <pre
                className="whitespace-pre-wrap break-words"
                style={{
                  fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--maxwell-text-secondary)',
                }}
              >
                {rawText}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
