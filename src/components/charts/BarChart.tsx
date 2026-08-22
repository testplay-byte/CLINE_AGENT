import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fmtTokens } from '../../lib/theme';

export interface BarChartPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartPoint[];
  height?: number;
  barWidth?: number;
  barGap?: number;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  height = 140,
  barWidth = 32,
  barGap = 8,
  emptyIcon,
  emptyTitle = 'No data yet',
  formatValue = fmtTokens,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const chartWidth = data.length * (barWidth + barGap) - barGap;
  const labelArea = 24;
  const barRadius = Math.min(7, barWidth / 2);

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const clipId = `bar-clip-${barWidth}-${height}`;

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2" style={{ height: height + 40 }}>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-dashed border-border bg-muted text-muted-foreground">
          {emptyIcon}
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground">{emptyTitle}</p>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center">
      <svg width={chartWidth} height={height + labelArea} viewBox={`0 0 ${chartWidth} ${height + labelArea}`}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={-barRadius} width={chartWidth} height={height + barRadius} />
          </clipPath>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height - height * pct}
            x2={chartWidth}
            y2={height - height * pct}
            className="stroke-border"
            strokeOpacity={0.4}
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        ))}

        <line x1={0} y1={height} x2={chartWidth} y2={height} className="stroke-border" strokeWidth={1} />

        <g clipPath={`url(#${clipId})`}>
          {data.map((d, i) => {
            const barH = Math.max((d.value / maxValue) * height, 4);
            const x = i * (barWidth + barGap);
            const y = height - barH;
            const isHovered = hovered === i;
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={height}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={barRadius}
                  ry={barRadius}
                  className="fill-accent transition-all duration-300"
                  style={{ opacity: hovered === null || isHovered ? (isHovered ? 1 : 0.9) : 0.28 }}
                />
              </g>
            );
          })}
        </g>

        {data.map((d, i) => {
          const x = i * (barWidth + barGap) + barWidth / 2;
          const isHovered = hovered === i;
          return (
            <text
              key={`${d.label}-label`}
              x={x}
              y={height + 16}
              textAnchor="middle"
              className={isHovered ? 'fill-accent' : 'fill-muted-foreground'}
              fontSize={9}
              fontWeight={isHovered ? 700 : 500}
              fontFamily="'Geist Mono', ui-monospace, monospace"
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      {hovered !== null ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-drag"
          style={{ left: hovered * (barWidth + barGap) + barWidth / 2, top: 0 }}
        >
          <p className="text-[10px] font-semibold text-muted-foreground">{data[hovered].label}</p>
          <p className="font-mono text-[11px] font-bold text-accent">{formatValue(data[hovered].value)}</p>
        </div>
      ) : null}
    </div>
  );
}
