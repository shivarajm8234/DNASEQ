import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface RiskCardProps {
  title: string;
  score: number;
  level: 'safe' | 'moderate' | 'high';
  description: string;
}

export function RiskCard({ title, score, level, description }: RiskCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'safe':
        return { bg: 'bg-green-950', text: 'text-green-400', border: 'border-green-800' };
      case 'moderate':
        return { bg: 'bg-yellow-950', text: 'text-yellow-400', border: 'border-yellow-800' };
      case 'high':
        return { bg: 'bg-red-950', text: 'text-red-400', border: 'border-red-800' };
      default:
        return { bg: 'bg-gray-900', text: 'text-gray-400', border: 'border-gray-800' };
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'moderate':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'high':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      default:
        return null;
    }
  };

  const colors = getLevelColor(level);

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-6 flex items-start gap-4`}>
      <div className="flex-shrink-0">
        {getIcon(level)}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${colors.bg} border ${colors.border} ${colors.text}`}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
