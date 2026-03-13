'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RiskGaugeProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#4ade80', '#facc15', '#f87171'];

export function RiskGauge({ data }: RiskGaugeProps) {
  const chartColors = {
    cardBg: '#1a2332',
    border: '#404860',
    text: '#e0e0e0',
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="font-semibold text-lg text-foreground mb-4">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }: any) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: chartColors.cardBg,
              border: `1px solid ${chartColors.border}`,
              borderRadius: '8px',
              color: chartColors.text,
            }}
            formatter={(value: any) => `${value}%`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
