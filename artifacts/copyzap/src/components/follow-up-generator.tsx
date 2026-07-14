import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getListCopiesQueryKey, getGetCopyStatsQueryKey } from "@workspace/api-client-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface FollowUpGeneratorProps {
  onGenerated: (copy: any) => void;
}

export function FollowUpGenerator({ onGenerated }: FollowUpGeneratorProps) {
  const [clientName, setClientName] = useState("");
  const [product, setProduct] = useState("");
  const [lastInteraction, setLastInteraction] = useState("");
  const [daysSinceLastContact, setDaysSinceLastContact] = useState("3");
  const [previousOutcome, setPreviousOutcome] = useState("no_response");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleGenerate() {
    if (!clientName.trim() || !product.trim() || !lastInteraction.trim()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("copyzap_token");
      const res = await fetch(`${API_BASE}/ai/follow-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName,
          product,
          lastInteraction,
          daysSinceLastContact: parseInt(daysSinceLastContact),
          previousOutcome,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao gerar follow-up");
      }

      const result = await res.json();
      onGenerated({
        id: result.id,
        clientName,
        product,
        messageType: "followup",
        tone: "amigavel",
        generatedText: result.generatedText,
        createdAt: result.createdAt,
      });

      queryClient.invalidateQueries({ queryKey: getListCopiesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCopyStatsQueryKey() });

      toast({ title: "Follow-up gerado!", description: result.followUpStrategy });
    } catch (err) {
      toast({
        title: "Erro ao gerar follow-up",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-primary to-cyan-500/50" />
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-primary/20 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Gerador de Follow-up</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Reative leads que pararam de responder
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Cliente</label>
            <Input
              placeholder="Nome do lead"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-background/50 font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Produto</label>
            <Input
              placeholder="Produto/serviço"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="bg-background/50 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Última interação
          </label>
          <Textarea
            placeholder="Ex: Ele disse que ia pensar e me respondeu no dia seguinte. Depois sumiu..."
            value={lastInteraction}
            onChange={(e) => setLastInteraction(e.target.value)}
            className="resize-none bg-background/50 min-h-[80px] font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              Dias sem contato
            </label>
            <Select onValueChange={setDaysSinceLastContact} defaultValue="3">
              <SelectTrigger className="bg-background/50 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dia</SelectItem>
                <SelectItem value="2">2 dias</SelectItem>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="5">5 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14+ dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              Situação anterior
            </label>
            <Select onValueChange={setPreviousOutcome} defaultValue="no_response">
              <SelectTrigger className="bg-background/50 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interested">Interessado</SelectItem>
                <SelectItem value="no_response">Sem resposta</SelectItem>
                <SelectItem value="objection">Fez objeção</SelectItem>
                <SelectItem value="ghosted">Sumiu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          className="w-full h-12 text-base font-display uppercase tracking-widest font-bold"
          disabled={loading || !clientName.trim() || !product.trim() || !lastInteraction.trim()}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Follow-up
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
