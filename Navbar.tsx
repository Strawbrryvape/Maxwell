import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router';
import {
  FileText,
  Zap,
  Brain,
  TrendingUp,
  Shield,
  Globe,
  Mic,
  Inbox,
  Download,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

// ── Navigation Items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Documents', href: '/', icon: FileText },
  { label: 'Briefing', href: '/briefing', icon: Zap },
  { label: 'Insights', href: '/insights', icon: Brain },
  { label: 'Financial', href: '/financial', icon: TrendingUp },
  { label: 'Contracts', href: '/contracts', icon: Shield },
  { label: 'Identity', href: '/identity', icon: Globe },
  { label: 'Voice', href: '/voice', icon: Mic },
  { label: 'Ingest', href: '/auto-ingest', icon: Inbox },
  { label: 'Export', href: '/export', icon: Download },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b"
        style={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'var(--maxwell-border-subtle)',
        }}
      >
        {/* Left: Logo */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
        >
          <Link to="/" className="flex items-center gap-2">
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--maxwell-primary)', fontFamily: 'Inter, sans-serif' }}
            >
              Maxwell
            </span>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--maxwell-primary)' }}
            />
          </Link>
        </motion.div>

        {/* Center: Nav Links (hidden on small screens) */}
        <motion.div
          className="hidden lg:flex items-center gap-0.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeSpring, delay: 0.15 }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-fast"
                style={{
                  color: isActive ? 'var(--maxwell-primary)' : 'var(--maxwell-text-secondary)',
                  backgroundColor: isActive ? 'var(--maxwell-primary-light)' : 'transparent',
                }}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </motion.div>

        {/* Right: Icons */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <button
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-fast hover:bg-[var(--maxwell-primary-light)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-fast hover:bg-[var(--maxwell-primary-light)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Help"
          >
            <HelpCircle size={20} />
          </button>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-fast hover:scale-[1.02]"
              style={{ color: 'var(--maxwell-text-secondary)' }}
              title="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
        </motion.div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer Panel */}
            <motion.div
              className="fixed top-0 left-0 bottom-0 z-[61] w-[280px] flex flex-col overflow-y-auto"
              style={{ backgroundColor: 'var(--maxwell-surface)' }}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: easeOut }}
            >
              <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0" style={{ borderColor: 'var(--maxwell-border-subtle)' }}>
                <span
                  className="text-lg font-bold"
                  style={{ color: 'var(--maxwell-primary)' }}
                >
                  Maxwell
                </span>
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ color: 'var(--maxwell-text-secondary)' }}
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex flex-col gap-1 p-4">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
                      style={{
                        color: isActive ? 'var(--maxwell-primary)' : 'var(--maxwell-text-secondary)',
                        backgroundColor: isActive ? 'var(--maxwell-primary-light)' : 'transparent',
                      }}
                    >
                      <item.icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                <div className="border-t my-2" style={{ borderColor: 'var(--maxwell-border-subtle)' }} />
                <button
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
                  style={{ color: 'var(--maxwell-text-secondary)' }}
                >
                  <Settings size={18} />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <button
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
                  style={{ color: 'var(--maxwell-text-secondary)' }}
                >
                  <HelpCircle size={18} />
                  <span className="text-sm font-medium">Help</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
