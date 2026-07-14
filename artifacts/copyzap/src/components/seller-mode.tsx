import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getListCopiesQueryKey, getGetCopyStatsQueryKey } from "@workspace/api-client-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface SellerModeProps {
  onGenerated: (copy: any) => void;
}

export function SellerMode({ onGenerated }: SellerModeProps) {
  const [clientDescription, setClientDescription] = useState("");
  const [product, setProduct] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleGenerate() {
    if (!clientDescription.trim() || !product.trim()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("copyzap_token");
      const res = await fetch(`${API_BASE}/ai/seller-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientDescription, product, context: context || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao gerar resposta");
      }

      const result = await res.json();
      onGenerated({
        id: result.id,
        clientName: clientDescription.slice(0, 100),
        product,
        messageType: "venda",
        tone: "amigavel",
        generatedText: result.generatedText,
        createdAt: result.createdAt,
      });

      queryClient.invalidateQueries({ queryKey: getListCopiesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCopyStatsQueryKey() });

      toast({ title: "Resposta do vendedor gerada!", description: "Pronta para enviar." });
    } catch (err) {
      toast({
        title: "Erro ao gerar resposta",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/50 via-primary to-emerald-500/50" />
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Modo Vendedor IA</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Descreva o cliente, a IA responde como um vendedor humano
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Descreva o cenário do cliente
          </label>
          <Textarea
            placeholder="Ex: Maria viu meu anúncio de um curso de marketing digital. Ela é dona de uma loja online pequena e disse que está caro. Mostrou interesse mas não respondeu os últimos 2 dias..."
            value={clientDescription}
            onChange={(e) => setClientDescription(e.target.value)}
            className="resize-none bg-background/50 min-h-[120px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Produto</label>
          <Input
            placeholder="Ex: Curso de Marketing Digital"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="bg-background/50 font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Contexto extra (opcional)</label>
          <Input
            placeholder="Ex: Bônus especial expira hoje"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="bg-background/50 font-mono text-sm"
          />
        </div>

        <Button
          onClick={handleGenerate}
          className="w-full h-12 text-base font-display uppercase tracking-widest font-bold"
          disabled={loading || !clientDescription.trim() || !product.trim()}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Resposta do Vendedor
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
