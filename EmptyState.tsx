import { memo } from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const FloatingIllustration = memo(function FloatingIllustration() {
  return (
    <motion.svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      {/* Folder */}
      <rect x="20" y="30" width="80" height="55" rx="8" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2"/>
      <path d="M20 42H100" stroke="#4F46E5" strokeWidth="2"/>
      <path d="M35 30V24C35 21.2386 37.2386 19 40 19H55L60 30H35Z" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2"/>

      {/* Floating document 1 */}
      <motion.rect
        x="72" y="10" width="30" height="38" rx="4"
        fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
      />
      <motion.line x1="78" y1="18" x2="96" y2="18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, -3, 0] }} transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}/>
      <motion.line x1="78" y1="24" x2="92" y2="24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, -3, 0] }} transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}/>
      <motion.line x1="78" y1="30" x2="94" y2="30" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, -3, 0] }} transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}/>

      {/* Floating document 2 */}
      <motion.rect
        x="12" y="12" width="26" height="34" rx="4"
        fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
      />
      <motion.line x1="17" y1="20" x2="33" y2="20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}/>
      <motion.line x1="17" y1="26" x2="30" y2="26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}/>

      {/* Checkmark */}
      <motion.circle
        cx="95" cy="72" r="12"
        fill="#ECFDF5"
        stroke="#10B981"
        strokeWidth="2"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.path
        d="M89 72L93 76L101 68"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
      />
    </motion.svg>
  );
});

export default function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      style={{ maxWidth: '400px', margin: '0 auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      <FloatingIllustration />

      <motion.h2
        className="mt-6 font-semibold"
        style={{
          fontSize: '18px',
          lineHeight: '1.4',
          color: 'var(--maxwell-text-primary)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Drop your first document
      </motion.h2>

      <motion.p
        className="mt-2 text-center"
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--maxwell-text-secondary)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Maxwell will handle the rest.
      </motion.p>

      <motion.p
        className="mt-4 text-center"
        style={{
          fontSize: '12px',
          color: 'var(--maxwell-text-tertiary)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        Use the upload area above or drag a file anywhere on this page.
      </motion.p>
    </motion.div>
  );
}
