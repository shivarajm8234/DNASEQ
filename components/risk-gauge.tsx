'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskGaugeProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  '#10b981', // Safe - Success green
  '#f59e0b', // Moderate - Warning yellow
  '#ef4444', // High - Error red
];

const GRADIENTS = [
  'url(#gradientSafe)',
  'url(#gradientModerate)',
  'url(#gradientHigh)',
];

export function RiskGauge({ data }: RiskGaugeProps) {
  // Add fill properties directly for RadialBar
  const chartData = data.map((entry, index) => ({
    ...entry,
    fill: GRADIENTS[index % GRADIENTS.length]
  }));

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-xl h-full flex flex-col pt-8">
      <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4">Risk Group Distribution</h3>
      
      <div className="flex-1 min-h-[250px] relative -mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="35%" 
            outerRadius="100%" 
            barSize={16} 
            data={chartData}
            startAngle={210}
            endAngle={-30}
          >
            <defs>
              <linearGradient id="gradientSafe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="gradientModerate" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="gradientHigh" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const payloadData = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl ring-1 ring-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payloadData.name}</p>
                      <p className="text-xl font-black text-foreground">{payloadData.value}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <RadialBar
              background={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              dataKey="value"
              cornerRadius={10}
              className="drop-shadow-lg"
              animationBegin={0}
              animationDuration={1500}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex flex-col items-center p-3 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full mb-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter truncate w-full text-center">{entry.name}</span>
            <span className="text-sm font-black text-foreground mt-0.5">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
