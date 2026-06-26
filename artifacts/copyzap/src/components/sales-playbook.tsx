import { MessageType, techniquesByType, messageTypeLabels } from "@/lib/sales-techniques";
import { Brain, Sparkles } from "lucide-react";

interface SalesPlaybookProps {
  messageType: MessageType;
}

export function SalesPlaybook({ messageType }: SalesPlaybookProps) {
  const techniques = techniquesByType[messageType];

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-primary">IA Treinada</p>
          <p className="text-[11px] text-muted-foreground">{messageTypeLabels[messageType]}</p>
        </div>
      </div>

      <div className="space-y-2">
        {techniques.map((tech) => (
          <div
            key={tech.id}
            className="flex items-start gap-2 p-2 rounded-md bg-background/40 border border-border/50 hover:border-primary/30 transition-colors"
          >
            <span className="text-base leading-none mt-0.5">{tech.icon}</span>
            <div>
              <p className="text-xs font-semibold text-foreground">{tech.name}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{tech.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-primary" />
        Técnicas aplicadas automaticamente na geração
      </div>
    </div>
  );
}
