import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getListCopiesQueryKey, getGetCopyStatsQueryKey } from "@workspace/api-client-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface CopyImproverProps {
  onGenerated: (copy: any) => void;
}

export function CopyImprover({ onGenerated }: CopyImproverProps) {
  const [originalMessage, setOriginalMessage] = useState("");
  const [goal, setGoal] = useState("venda");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleImprove() {
    if (!originalMessage.trim()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("copyzap_token");
      const res = await fetch(`${API_BASE}/ai/improve-copy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalMessage,
          goal,
          additionalInstructions: additionalInstructions || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao melhorar copy");
      }

      const result = await res.json();
      onGenerated({
        id: result.id,
        clientName: "Correção de Copy",
        product: "Mensagem melhorada",
        messageType: "venda",
        tone: "direto",
        generatedText: result.improvedText,
        createdAt: result.createdAt,
      });

      queryClient.invalidateQueries({ queryKey: getListCopiesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCopyStatsQueryKey() });

      toast({ title: "Copy melhorada!", description: "Versão otimizada pronta." });
    } catch (err) {
      toast({
        title: "Erro ao melhorar copy",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-primary to-pink-500/50" />
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Correção de Copy</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Cole sua mensagem e a IA melhora a persuasão
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Sua mensagem atual
          </label>
          <Textarea
            placeholder="Cole aqui a mensagem que você quer melhorar..."
            value={originalMessage}
            onChange={(e) => setOriginalMessage(e.target.value)}
            className="resize-none bg-background/50 min-h-[120px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Objetivo da melhoria
          </label>
          <Select onValueChange={setGoal} defaultValue="venda">
            <SelectTrigger className="bg-background/50 font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venda">Vendas / Conversão</SelectItem>
              <SelectItem value="profissional">Profissional / Corporativo</SelectItem>
              <SelectItem value="amigavel">Amigável / Próximo</SelectItem>
              <SelectItem value="urgencia">Urgência / Escassez</SelectItem>
              <SelectItem value="emocional">Emocional / Empático</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Instruções extras (opcional)
          </label>
          <Textarea
            placeholder="Ex: Mantenha o tom formal, não mude o preço..."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            className="resize-none bg-background/50 min-h-[60px] font-mono text-sm"
          />
        </div>

        <Button
          onClick={handleImprove}
          className="w-full h-12 text-base font-display uppercase tracking-widest font-bold"
          disabled={loading || !originalMessage.trim()}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Melhorar Copy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
