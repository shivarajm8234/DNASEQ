import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface RiskCardProps {
  title: string;
  score: number;
  level: 'safe' | 'moderate' | 'high';
  description: string;
}

export function RiskCard({ title, score, level, description }: RiskCardProps) {
  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'safe':
        return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', glow: 'shadow-green-500/20' };
      case 'moderate':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/20' };
      case 'high':
        return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-red-500/20' };
      default:
        return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', glow: 'shadow-slate-500/10' };
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle className="w-5 h-5" />;
      case 'moderate':
        return <AlertTriangle className="w-5 h-5" />;
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const styles = getLevelStyles(level);

  return (
    <div className={`relative group overflow-hidden rounded-2xl border ${styles.border} bg-card/40 backdrop-blur-md p-6 transition-all duration-300 hover:shadow-lg ${styles.glow} hover:-translate-y-1`}>
      <div className={`absolute top-0 right-0 p-3 ${styles.text} opacity-20 group-hover:opacity-40 transition-opacity`}>
        {getIcon(level)}
      </div>
      <div className="flex flex-col h-full">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1">{title}</h3>
        <p className="text-sm text-foreground/80 font-medium mb-4 line-clamp-2">{description}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${styles.text}`}>{score}</span>
            <span className="text-xs font-bold text-muted-foreground/60">%</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${styles.bg} ${styles.text} border ${styles.border}`}>
            {level}
          </span>
        </div>
      </div>
    </div>
  );
}
