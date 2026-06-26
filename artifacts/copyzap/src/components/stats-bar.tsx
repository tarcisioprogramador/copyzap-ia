import { useGetCopyStats } from "@workspace/api-client-react";
import { Zap, Target, Flame, TrendingUp, Clock, AlertTriangle, BarChart3 } from "lucide-react";

export function StatsBar() {
  const { data: stats, isLoading } = useGetCopyStats();

  if (isLoading) {
    return (
      <div className="h-24 border-b border-border bg-card/30">
        <div className="container max-w-[1400px] mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 animate-pulse">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/30 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="border-b border-border/50 bg-card/20 backdrop-blur-sm">
      <div className="container max-w-[1400px] mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
          <div className="col-span-2 flex flex-col justify-center border border-primary/10 rounded-lg bg-primary/5 p-3 md:border-r md:border-0 md:bg-transparent md:p-0 md:pr-4 md:border-r md:border-border/50">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-mono">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Copys Geradas
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-display font-bold text-foreground">{stats.total}</span>
              <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-primary/20">
                <TrendingUp className="w-3 h-3" />
                Hoje: {stats.todayCount}
              </span>
            </div>
          </div>

          <StatItem label="Vendas" value={stats.byType?.venda || 0} icon={<Target className="w-4 h-4 text-primary" />} accent="primary" />
          <StatItem label="Follow-up" value={stats.byType?.followup || 0} icon={<Clock className="w-4 h-4 text-blue-400" />} />
          <StatItem label="Urgência" value={stats.byType?.urgencia || 0} icon={<Flame className="w-4 h-4 text-orange-500" />} />
          <StatItem label="Pós-Venda" value={stats.byType?.posVenda || 0} icon={<Zap className="w-4 h-4 text-yellow-400" />} />
          <StatItem label="Objeção" value={stats.byType?.objecao || 0} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} />
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className={`flex flex-col justify-center px-3 py-2 rounded-lg border border-border/30 bg-card/30 hover:border-primary/20 transition-colors ${
        accent ? "hover:bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-mono">
        {icon} {label}
      </div>
      <div className="text-xl font-display font-semibold mt-0.5">{value}</div>
    </div>
  );
}
