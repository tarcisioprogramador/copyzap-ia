import { useGetCopyAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, MessageSquareReply, Send, Clock, TrendingUp } from "lucide-react";
import { messageTypeLabels, MessageType } from "@/lib/sales-techniques";

const TYPE_COLORS: Record<string, string> = {
  venda: "hsl(158 64% 52%)",
  followup: "hsl(217 91% 60%)",
  urgencia: "hsl(25 95% 53%)",
  posVenda: "hsl(45 93% 47%)",
  objecao: "hsl(0 84% 60%)",
};

const MESSAGE_TYPES: MessageType[] = ["venda", "followup", "urgencia", "posVenda", "objecao"];

export function ResponseAnalytics() {
  const { data: analytics, isLoading } = useGetCopyAnalytics();

  if (isLoading) {
    return (
      <div className="border-b border-border/50 bg-card/10 py-6">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const chartData = MESSAGE_TYPES.map((type) => ({
    name: messageTypeLabels[type].split(" / ")[0],
    type,
    rate: analytics.byType[type]?.responseRate ?? 0,
    responded: analytics.byType[type]?.responded ?? 0,
    total: analytics.byType[type]?.total ?? 0,
  })).filter((d) => d.total > 0);

  const hasTracked = analytics.overall.responded + analytics.overall.noResponse > 0;

  return (
    <div className="border-b border-border/50 bg-gradient-to-b from-card/20 to-transparent py-6">
      <div className="container max-w-[1400px] mx-auto px-4 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-lg tracking-tight uppercase">
            Taxa de Resposta por Tipo
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            label="Taxa Geral"
            value={hasTracked ? `${analytics.overall.responseRate}%` : "—"}
            sub={hasTracked ? "de respostas positivas" : "marque resultados nas copys"}
            highlight
          />
          <MetricCard
            icon={<Send className="w-4 h-4 text-blue-400" />}
            label="Aguardando"
            value={String(analytics.overall.sent)}
            sub="enviadas, sem retorno"
          />
          <MetricCard
            icon={<MessageSquareReply className="w-4 h-4 text-emerald-400" />}
            label="Responderam"
            value={String(analytics.overall.responded)}
            sub="clientes engajaram"
          />
          <MetricCard
            icon={<Clock className="w-4 h-4 text-muted-foreground" />}
            label="Sem resposta"
            value={String(analytics.overall.noResponse)}
            sub="após envio"
          />
        </div>

        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                  Performance por tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Taxa de resposta"]}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                  Detalhe por operação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MESSAGE_TYPES.map((type) => {
                  const m = analytics.byType[type];
                  if (!m || m.total === 0) return null;
                  const resolved = m.responded + m.noResponse;
                  return (
                    <div key={type} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-muted-foreground">
                          {messageTypeLabels[type].split(" / ")[0]}
                        </span>
                        <span className="font-semibold text-primary">
                          {resolved > 0 ? `${m.responseRate}%` : "—"}
                        </span>
                      </div>
                      <Progress
                        value={resolved > 0 ? m.responseRate : 0}
                        className="h-1.5 bg-muted/30"
                      />
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {m.responded} respostas · {m.noResponse} sem retorno · {m.pending} pendentes
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 font-mono text-xs uppercase tracking-wider">
            Gere copys e marque os resultados (enviado / respondeu / sem resposta) para ver analytics
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border/40 bg-card/30"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <div className={`text-2xl font-display font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
