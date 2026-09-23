"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from "recharts";

interface LineSeriesConfig {
  key: string;
  name: string;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

interface AreaBandConfig {
  lowKey: string;
  highKey: string;
  name: string;
  fillColor: string;
}

interface ScientificChartProps {
  data: any[];
  xAxisKey: string;
  xAxisLabel: string;
  yAxisLabel: string;
  series: LineSeriesConfig[];
  areaBands?: AreaBandConfig[];
  height?: number;
  title?: string;
  subtitle?: string;
}

export function ScientificChart({
  data,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  series,
  areaBands = [],
  height = 340,
  title,
  subtitle,
}: ScientificChartProps) {
  return (
    <div className="w-full scientific-card p-4 rounded-lg bg-surface border border-surface-border">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
            <XAxis
              dataKey={xAxisKey}
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
              label={{
                value: xAxisLabel,
                position: "insideBottom",
                offset: -15,
                fill: "#94a3b8",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fill: "#94a3b8",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0e1526",
                borderColor: "#1e293b",
                borderRadius: "0.375rem",
                fontSize: "12px",
                color: "#f8fafc",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
              }}
              labelStyle={{ color: "#38bdf8", fontWeight: "bold" }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 8, fontSize: "11px", color: "#94a3b8" }}
            />

            {/* Percentile Envelopes / Area Bands */}
            {areaBands.map((band) => (
              <Area
                key={band.name}
                type="monotone"
                dataKey={band.highKey}
                stroke="none"
                fill={band.fillColor}
                fillOpacity={0.25}
                name={band.name}
              />
            ))}

            {/* Line Series */}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={s.strokeWidth || 2}
                strokeDasharray={s.strokeDasharray}
                dot={false}
                activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 1 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
