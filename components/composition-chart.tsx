'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompositionChartProps {
  data: { name: string; count: number }[];
}

export function CompositionChart({ data }: CompositionChartProps) {
  const chartColors = {
    grid: 'rgba(255, 255, 255, 0.05)',
    axis: 'rgba(255, 255, 255, 0.4)',
    bar: 'var(--primary)',
    cardBg: 'rgba(15, 23, 42, 0.9)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
  };

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-xl">
      <h3 className="font-semibold text-lg text-foreground mb-4">Base Composition</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={chartColors.grid}
            opacity={0.2}
          />
          <XAxis 
            dataKey="name" 
            stroke={chartColors.axis}
            fontSize={12}
          />
          <YAxis 
            stroke={chartColors.axis}
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartColors.cardBg,
              border: `1px solid ${chartColors.border}`,
              borderRadius: '8px',
              color: chartColors.text,
            }}
          />
          <Legend />
          <Bar dataKey="count" fill={chartColors.bar} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
