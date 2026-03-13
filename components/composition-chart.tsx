'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompositionChartProps {
  data: { name: string; count: number }[];
}

export function CompositionChart({ data }: CompositionChartProps) {
  const chartColors = {
    grid: '#404860',
    axis: '#8090a0',
    bar: '#4db8ff',
    cardBg: '#1a2332',
    border: '#404860',
    text: '#e0e0e0',
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
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
