import { motion } from 'framer-motion';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export default function Footer() {
  return (
    <motion.footer
      className="w-full border-t py-10"
      style={{
        backgroundColor: 'var(--maxwell-background)',
        borderColor: 'var(--maxwell-border-subtle)',
      }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      <div className="max-w-container mx-auto px-4 sm:px-8 lg:px-10 flex flex-col items-center gap-4 text-center">
        {/* Badge */}
        <span
          className="px-3 py-1 rounded-full font-semibold"
          style={{
            backgroundColor: 'var(--maxwell-primary-light)',
            color: 'var(--maxwell-primary)',
            fontSize: '11px',
            letterSpacing: '0.02em',
          }}
        >
          Powered by Syntropy LLC
        </span>

        {/* Mission copy */}
        <p
          className="text-sm"
          style={{ color: 'var(--maxwell-text-secondary)', lineHeight: '1.6' }}
        >
          Maxwell is built by Syntropy LLC &mdash; software that serves the public, not shareholders.
        </p>

        {/* License note */}
        <p
          className="text-xs"
          style={{ color: 'var(--maxwell-text-tertiary)' }}
        >
          Licensed under AGPL v3. Your data stays yours.
        </p>

        {/* Links row */}
        <div className="flex items-center gap-4 mt-2">
          {['Privacy', 'Terms', 'GitHub', 'Contact'].map((label) => (
            <a
              key={label}
              href="#"
              className="text-xs font-medium transition-colors duration-fast hover:text-[var(--maxwell-primary)]"
              style={{ color: 'var(--maxwell-text-tertiary)' }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}
