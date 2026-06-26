import { Copy, useDeleteCopy, useUpdateCopyOutcome, getListCopiesQueryKey, getGetCopyStatsQueryKey, getGetCopyAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy as CopyIcon, Check, Trash2, Send, Clock, Tag, Eye, FileText, MessageSquareReply, MessageSquareX, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { techniquesByType, messageTypeLabels, MessageType } from "@/lib/sales-techniques";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CopyCard({
  copy,
  isLatest = false,
  showPreview = false,
}: {
  copy: Copy;
  isLatest?: boolean;
  showPreview?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const deleteCopy = useDeleteCopy();
  const updateOutcome = useUpdateCopyOutcome();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListCopiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCopyStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCopyAnalyticsQueryKey() });
  };

  const handleOutcome = (outcome: "sent" | "responded" | "no_response") => {
    updateOutcome.mutate(
      { id: copy.id, data: { outcome } },
      {
        onSuccess: () => {
          invalidateAll();
          const labels = { sent: "Marcado como enviado", responded: "Cliente respondeu!", no_response: "Sem resposta registrada" };
          toast({ title: labels[outcome] });
        },
      }
    );
  };

  const techniques = techniquesByType[copy.messageType as MessageType] ?? [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copy.generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Cole direto no WhatsApp do cliente.",
      });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(copy.generatedText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    if (!copy.outcome) {
      handleOutcome("sent");
    }
  };

  const handleDelete = () => {
    deleteCopy.mutate(
      { id: copy.id },
      {
        onSuccess: () => {
          invalidateAll();
          toast({ title: "Copy removida do histórico" });
        },
      }
    );
  };

  const outcomeBadge = copy.outcome === "responded"
    ? { label: "Respondeu", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
    : copy.outcome === "no_response"
      ? { label: "Sem resposta", className: "bg-orange-500/10 text-orange-400 border-orange-500/30" }
      : copy.outcome === "sent"
        ? { label: "Enviado", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" }
        : null;

  return (
    <Card
      className={`border-border bg-card/80 backdrop-blur-sm overflow-hidden transition-all ${
        isLatest
          ? "ring-1 ring-primary/50 shadow-xl shadow-primary/10 border-primary/20"
          : "hover:border-primary/30"
      }`}
    >
      <CardHeader className="py-3 px-4 border-b border-border/50 bg-background/30 flex flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs uppercase bg-primary/5 border-primary/20 text-primary">
            <Tag className="w-3 h-3 mr-1" />
            {messageTypeLabels[copy.messageType as MessageType] ?? copy.messageType}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs uppercase bg-background text-muted-foreground">
            {copy.tone}
          </Badge>
          {outcomeBadge && (
            <Badge variant="outline" className={`font-mono text-xs uppercase ${outcomeBadge.className}`}>
              {outcomeBadge.label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground font-mono flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {format(new Date(copy.createdAt), "dd/MM HH:mm", { locale: ptBR })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={handleDelete}
          disabled={deleteCopy.isPending}
          title="Deletar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/50">
          <div className="p-4 md:col-span-1 space-y-3 bg-card/30">
            <div>
              <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider mb-1">
                Cliente
              </span>
              <span className="font-sans font-medium text-sm">{copy.clientName}</span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider mb-1">
                Produto
              </span>
              <span className="font-sans font-medium text-sm">{copy.product}</span>
            </div>
            {copy.value && (
              <div>
                <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider mb-1">
                  Valor
                </span>
                <span className="font-mono text-sm text-primary">{copy.value}</span>
              </div>
            )}
            {techniques.length > 0 && (
              <div className="pt-2 border-t border-border/30">
                <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider mb-2">
                  Técnicas IA
                </span>
                <div className="flex flex-wrap gap-1">
                  {techniques.map((t) => (
                    <span
                      key={t.id}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                      title={t.description}
                    >
                      {t.icon} {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 md:col-span-3 bg-background/30">
            {showPreview ? (
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="mb-3 bg-background/50">
                  <TabsTrigger value="preview" className="text-xs font-mono uppercase gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Preview WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="text" className="text-xs font-mono uppercase gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Texto
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-0">
                  <WhatsAppPreview message={copy.generatedText} clientName={copy.clientName} />
                </TabsContent>
                <TabsContent value="text" className="mt-0">
                  <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 p-3 rounded-lg bg-background/50 border border-border/50">
                    {copy.generatedText}
                  </p>
                </TabsContent>
              </Tabs>
            ) : (
              <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                {copy.generatedText}
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t border-border/50 bg-background/30 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
            Resultado:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOutcome("sent")}
            disabled={updateOutcome.isPending}
            className={`font-mono text-[10px] uppercase h-7 ${copy.outcome === "sent" ? "border-blue-500/50 bg-blue-500/10" : ""}`}
          >
            <CheckCheck className="w-3 h-3 mr-1" />
            Enviado
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOutcome("responded")}
            disabled={updateOutcome.isPending}
            className={`font-mono text-[10px] uppercase h-7 ${copy.outcome === "responded" ? "border-emerald-500/50 bg-emerald-500/10" : ""}`}
          >
            <MessageSquareReply className="w-3 h-3 mr-1" />
            Respondeu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOutcome("no_response")}
            disabled={updateOutcome.isPending}
            className={`font-mono text-[10px] uppercase h-7 ${copy.outcome === "no_response" ? "border-orange-500/50 bg-orange-500/10" : ""}`}
          >
            <MessageSquareX className="w-3 h-3 mr-1" />
            Sem resposta
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={handleCopy} className="font-mono text-xs uppercase tracking-wider">
          {copied ? <Check className="w-4 h-4 mr-2 text-primary" /> : <CopyIcon className="w-4 h-4 mr-2" />}
          {copied ? "Copiado!" : "Copiar"}
        </Button>
        <Button
          onClick={handleWhatsApp}
          className="font-mono text-xs uppercase tracking-wider bg-[#25D366] hover:bg-[#25D366]/90 text-white shadow-md shadow-[#25D366]/20"
        >
          <Send className="w-4 h-4 mr-2" />
          Abrir no WhatsApp
        </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
