import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  bgColor?: string;
  iconColor?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  bgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
  ...props
}: StatsCardProps & React.HTMLAttributes<HTMLDivElement>) {
  const getTrendIcon = () => {
    if (trendDirection === 'up') return TrendingUp;
    if (trendDirection === 'down') return TrendingDown;
    return null;
  };

  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-green-600';
    if (trendDirection === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={className} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm" data-testid="stats-title">{title}</p>
            <p className="text-2xl font-bold" data-testid="stats-value">{value}</p>
          </div>
          <div className={`${bgColor} p-3 rounded-lg`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${getTrendColor()}`}>
            {TrendIcon && <TrendIcon className="w-3 h-3 mr-1" />}
            <span data-testid="stats-trend">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
