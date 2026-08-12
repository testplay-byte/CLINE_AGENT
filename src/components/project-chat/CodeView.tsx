'use client';

import { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/dashboard-helpers';
import { useProjectChatStore } from '@/lib/project-chat-store';
import { useScrollFade } from '@/lib/useScrollFade';

export function CodeView() {
  const { isDark, card, text, border, muted, accent, inputBg } = useTheme();
  const code = useProjectChatStore((s) => s.code);
  const codeFileName = useProjectChatStore((s) => s.codeFileName);
  const codeFilePath = useProjectChatStore((s) => s.codeFilePath);
  const isAgentThinking = useProjectChatStore((s) => s.isAgentThinking);
  const codeScrollRef = useRef<HTMLDivElement>(null);

  useScrollFade(codeScrollRef);

  // Scroll to top when file changes
  useEffect(() => {
    if (codeScrollRef.current) {
      codeScrollRef.current.scrollTop = 0;
    }
  }, [codeFilePath]);

  const lines = code.split('\n');

  return (
    <div
      className="flex flex-col h-full rounded-2xl border overflow-hidden"
      style={{
        background: card,
        borderColor: border,
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.2)'
          : '0 4px 24px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      {/* Code header */}
      <div
        className="h-10 flex items-center gap-3 px-4 border-b shrink-0 rounded-t-2xl"
        style={{ borderColor: border, background: card }}
      >
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F56', border: '1px solid rgba(0,0,0,0.1)' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E', border: '1px solid rgba(0,0,0,0.1)' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#27C93F', border: '1px solid rgba(0,0,0,0.1)' }} />
        </div>
        <span className="text-[12px] font-mono font-medium" style={{ color: text }}>
          {codeFileName || 'Select a file'}
        </span>
        {codeFilePath && (
          <span className="text-[10px] font-mono hidden lg:inline" style={{ color: muted }}>
            {codeFilePath.length > 50 ? '...' + codeFilePath.slice(-47) : codeFilePath}
          </span>
        )}
        <div
          className="hidden md:inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-mono border ml-auto"
          style={{ background: inputBg, borderColor: border, color: muted }}
        >
          {isAgentThinking ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Nova editing
              <span className="flex gap-0.5 ml-1">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: muted, animation: 'bounceDot 1s infinite ' + delay + 's' }}
                  />
                ))}
              </span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              {lines.length} lines
            </>
          )}
        </div>
      </div>

      {/* Code body */}
      <div ref={codeScrollRef} className="flex-1 overflow-auto flex min-h-0 auto-scroll rounded-b-2xl">
        {code ? (
          <>
            <div
              className="w-[48px] shrink-0 py-4 text-right pr-3 select-none font-mono text-[12px] leading-[22px]"
              style={{ color: muted, background: inputBg + '60' }}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="flex-1 py-4 pl-4 pr-6 font-mono text-[12.5px] leading-[22px] whitespace-pre-wrap break-words" style={{ color: text }}>
              {lines.map((line, i) => (
                <div key={i}><span style={{ color: i < 2 ? muted : undefined }}>{highlightLine(line)}</span></div>
              ))}
            </pre>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2" style={{ color: muted }}>
              <Sparkles size={24} style={{ color: accent, opacity: 0.5 }} />
              <div className="text-[13px]">No file selected</div>
              <div className="text-[11px]">Click a file in the Explorer to view its content</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function highlightLine(line: string) {
  const keywords = ['import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'async', 'await', 'if', 'else', 'new', 'typeof', 'interface', 'type', 'extends', 'class', 'implements', 'private', 'public', 'protected', 'static', 'default', 'switch', 'case', 'break', 'continue', 'throw', 'try', 'catch', 'finally', 'yield'];
  const types = ['string', 'number', 'boolean', 'void', 'null', 'undefined', 'any', 'unknown', 'never', 'Promise', 'Record', 'Array', 'Map', 'Set'];

  const tokens = line.split(/(\b(?:'[^']*'|"[^"]*"|`[^`]*`|\d+\.?\d*|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)\b|[{}()<>:;,=+\-*/&|!?.@[\]]|\/\/.*$)/g);

  return tokens.map((token, i) => {
    if ((token.startsWith("'") && token.endsWith("'")) ||
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith('`') && token.endsWith('`'))) {
      return <span key={i} style={{ color: '#a5d6a7' }}>{token}</span>;
    }
    if (token.startsWith('//')) return <span key={i} style={{ color: '#6a737d' }}>{token}</span>;
    if (/^\d+\.?\d*$/.test(token)) return <span key={i} style={{ color: '#f9a825' }}>{token}</span>;
    if (keywords.includes(token)) return <span key={i} style={{ color: '#c792ea' }}>{token}</span>;
    if (types.includes(token)) return <span key={i} style={{ color: '#82aaff' }}>{token}</span>;
    return <span key={i}>{token}</span>;
  });
}
