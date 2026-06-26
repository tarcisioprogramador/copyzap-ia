import { Copy, useListCopies } from "@workspace/api-client-react";
import { CopyCard } from "./copy-card";
import { MessageSquarePlus, Sparkles } from "lucide-react";

export function CopyHistory({ latestCopyId }: { latestCopyId?: number }) {
  const { data: copies, isLoading } = useListCopies();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 rounded-lg bg-card/50 border border-border/50 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  if (!copies || copies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-primary/20 rounded-xl bg-card/20 backdrop-blur-sm">
        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 glow-primary">
          <MessageSquarePlus className="w-7 h-7 text-primary" />
        </div>
        <p className="text-foreground font-display font-semibold text-lg">Nenhuma copy ainda</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Preencha o formulário ao lado e clique em{" "}
          <span className="text-primary font-mono text-xs">Gerar Copy com IA</span> para criar sua primeira mensagem de vendas.
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-primary" />
          IA treinada em técnicas de conversão
        </div>
      </div>
    );
  }

  const displayCopies = copies.filter((c) => c.id !== latestCopyId);

  return (
    <div className="space-y-4">
      {displayCopies.map((copy) => (
        <CopyCard key={copy.id} copy={copy} />
      ))}

      {displayCopies.length === 0 && latestCopyId && (
        <p className="text-xs text-muted-foreground font-mono text-center py-6 border border-dashed border-border/50 rounded-lg">
          Sua copy mais recente está destacada acima.
        </p>
      )}
    </div>
  );
}
