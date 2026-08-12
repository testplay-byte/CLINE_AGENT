'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  Trash2,
  Zap,
  MessageSquare,
  Filter,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { useDashboardStore, type Session } from '@/lib/dashboard-store';
import { useTheme, bdr, staggerContainer, staggerItem, fadeInUp, ease, fmtTokens } from '@/lib/dashboard-helpers';

// ============================================================
// HISTORY VIEW — All sessions from all projects, chronological
// ============================================================
export function HistoryView() {
  const projects = useDashboardStore((s) => s.projects);
  const sessions = useDashboardStore((s) => s.sessions);
  const deleteSession = useDashboardStore((s) => s.deleteSession);
  const selectProject = useDashboardStore((s) => s.selectProject);
  const { isDark, card, text, muted, accent, accentFaded, border, inputBg, hover } = useTheme();

  const [query, setQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // Build flat sorted list with project info
  const allSessions = useMemo(() => {
    const flat: (Session & { projectName: string; projectColor: string })[] = [];
    for (const [pid, sess] of Object.entries(sessions)) {
      const proj = projects.find((p) => p.id === pid);
      for (const s of sess) {
        flat.push({
          ...s,
          projectName: proj?.name || 'Unknown',
          projectColor: proj?.color || accent,
        });
      }
    }
    // Already chronological from mock data (newest first)
    return flat;
  }, [sessions, projects, accent]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = allSessions;
    if (projectFilter) {
      result = result.filter((s) => s.projectId === projectFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.preview.toLowerCase().includes(q) ||
          s.model.toLowerCase().includes(q) ||
          s.projectName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allSessions, query, projectFilter]);

  const handleDelete = (projectId: string, sessionId: string) => {
    if (confirmDeleteId === sessionId) {
      deleteSession(projectId, sessionId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(sessionId);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <motion.main
      key="history"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      className="flex-1 flex flex-col rounded-lg overflow-hidden min-w-0"
      style={{ backgroundColor: card, border: bdr('1.5px', border) }}
    >
      {/* Header */}
      <div
        className="px-4 md:px-5 py-3.5"
        style={{ borderBottom: bdr('1.5px', border) }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accentFaded }}
          >
            <Clock size={15} style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-bold" style={{ color: text }}>
              Session History
            </h2>
            <p className="text-[10px]" style={{ color: muted }}>
              {allSessions.length} sessions across {projects.length} projects
            </p>
          </div>
          {projectFilter && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setProjectFilter(null)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer"
              style={{ backgroundColor: accentFaded, color: accent }}
            >
              <Filter size={9} />
              {projects.find((p) => p.id === projectFilter)?.name}
              <X size={9} />
            </motion.button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: muted }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions by title, model, or project..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-[12px] outline-none"
            style={{
              backgroundColor: inputBg,
              border: bdr('1.5px', query ? accent + '50' : border),
              color: text,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: muted }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="flex items-center justify-center py-16"
          >
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: bdr('1.5px', border),
                }}
              >
                {query || projectFilter ? (
                  <Search size={22} style={{ color: muted }} />
                ) : (
                  <MessageSquare size={22} style={{ color: muted }} />
                )}
              </div>
              <h3 className="text-[14px] font-bold mb-1.5" style={{ color: text }}>
                {query || projectFilter ? 'No matching sessions' : 'No session history yet'}
              </h3>
              <p className="text-[11px] max-w-[240px] mx-auto leading-relaxed" style={{ color: muted }}>
                {query || projectFilter
                  ? `Try adjusting your search or filter to find what you're looking for.`
                  : 'Sessions from all your projects will appear here as you work.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {filtered.map((session) => {
              const isConfirming = confirmDeleteId === session.id;
              return (
                <motion.div
                  key={session.id}
                  variants={staggerItem}
                  layout
                >
                  <div
                    className="group relative p-3.5 rounded-lg cursor-pointer transition-all duration-200"
                    style={{ border: bdr('1.5px', isConfirming ? '#ef4444' : border) }}
                    onClick={() => selectProject(session.projectId)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.backgroundColor = hover;
                      el.style.transform = 'translateY(-1px)';
                      el.style.boxShadow = `0 4px 12px rgba(0,0,0,${isDark ? 0.2 : 0.06})`;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.backgroundColor = 'transparent';
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    {/* Confirmation banner */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-md"
                          style={{
                            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
                            border: bdr('1px', 'rgba(239,68,68,0.2)'),
                          }}
                        >
                          <AlertTriangle size={12} style={{ color: '#ef4444' }} />
                          <span className="text-[10px] font-medium flex-1" style={{ color: '#ef4444' }}>
                            Delete this session?
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.projectId, session.id);
                              setConfirmDeleteId(null);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#ef4444', color: '#fff' }}
                          >
                            <Check size={10} /> Yes
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                              color: muted,
                            }}
                          >
                            No
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <MessageSquare size={12} style={{ color: accent, opacity: 0.7 }} className="flex-shrink-0" />
                          <h3 className="text-[12px] font-bold truncate" style={{ color: text }}>
                            {session.title}
                          </h3>
                        </div>

                        {/* Project name with color dot */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: session.projectColor }}
                          />
                          <span className="text-[10px] font-semibold truncate" style={{ color: session.projectColor }}>
                            {session.projectName}
                          </span>
                          <span className="text-[10px]" style={{ color: muted }}>
                            ·
                          </span>
                          <span className="text-[10px]" style={{ color: muted }}>
                            {session.timestamp}
                          </span>
                        </div>

                        {/* Preview text */}
                        <p className="text-[10px] leading-relaxed line-clamp-2 mb-2.5" style={{ color: muted }}>
                          {session.preview}
                        </p>

                        {/* Meta badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: accent + '12', color: accent }}
                          >
                            {session.model}
                          </span>
                          <span
                            className="text-[9px] font-medium flex items-center gap-0.5"
                            style={{ color: muted }}
                          >
                            <Zap size={8} />
                            {fmtTokens(session.tokensUsed)} tokens
                          </span>
                          <span
                            className="text-[9px] font-medium"
                            style={{ color: muted }}
                          >
                            {session.apiCalls} calls
                          </span>
                        </div>
                      </div>

                      {/* Actions (visible on hover) */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.projectId, session.id);
                          }}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-110"
                          style={{
                            color: isConfirming ? '#ef4444' : muted,
                            backgroundColor: isConfirming
                              ? isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)'
                              : 'transparent',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: accent + '10', color: accent }}
                        >
                          <ChevronRight size={13} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
