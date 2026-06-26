import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGenerateCopy,
  getListCopiesQueryKey,
  getGetCopyStatsQueryKey,
  Copy,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ClosingAssistantAnswers,
  assistantSteps,
  buildClosingRecommendation,
  leadStageOptions,
  objectionOptions,
  urgencyOptions,
  LeadStage,
  ObjectionType,
  UrgencyLevel,
} from "@/lib/closing-assistant";
import { messageTypeLabels, toneLabels } from "@/lib/sales-techniques";
import { cn } from "@/lib/utils";

const defaultAnswers: ClosingAssistantAnswers = {
  clientName: "",
  product: "",
  value: "",
  leadStage: "first_contact",
  objection: "none",
  urgency: "none",
  extraContext: "",
};

export function ClosingAssistant({ onGenerated }: { onGenerated: (copy: Copy) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ClosingAssistantAnswers>(defaultAnswers);
  const generateCopy = useGenerateCopy();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const recommendation = buildClosingRecommendation(answers);
  const progress = ((step + 1) / assistantSteps.length) * 100;
  const currentStep = assistantSteps[step];

  function update(partial: Partial<ClosingAssistantAnswers>) {
    setAnswers((prev) => ({ ...prev, ...partial }));
  }

  function canProceed(): boolean {
    switch (currentStep.id) {
      case "client":
        return answers.clientName.trim().length > 0;
      case "product":
        return answers.product.trim().length > 0;
      default:
        return true;
    }
  }

  function handleGenerate() {
    generateCopy.mutate(
      {
        data: {
          clientName: answers.clientName,
          product: answers.product,
          value: answers.value || undefined,
          context: recommendation.context,
          messageType: recommendation.messageType,
          tone: recommendation.tone,
        },
      },
      {
        onSuccess: (result) => {
          onGenerated(result);
          queryClient.invalidateQueries({ queryKey: getListCopiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCopyStatsQueryKey() });
          toast({
            title: "Copy estratégica gerada!",
            description: `Tipo: ${messageTypeLabels[recommendation.messageType]}`,
          });
        },
        onError: () => {
          toast({ title: "Erro ao gerar", variant: "destructive" });
        },
      }
    );
  }

  return (
    <Card className="border-primary/10 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500/50 via-primary to-emerald-500/50" />

      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-primary/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Assistente de Fechamento</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Passo {step + 1} de {assistantSteps.length} · {currentStep.subtitle}
            </p>
          </div>
        </div>

        <Progress value={progress} className="h-1 bg-muted/30" />

        <div className="flex gap-1 overflow-x-auto pb-1">
          {assistantSteps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "shrink-0 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors",
                i === step
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : i < step
                    ? "text-primary/60 hover:bg-primary/10 cursor-pointer"
                    : "text-muted-foreground/50"
              )}
            >
              {s.title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[180px]"
          >
            {currentStep.id === "client" && (
              <StepField label="Nome do cliente">
                <Input
                  placeholder="Ex: Maria Silva"
                  value={answers.clientName}
                  onChange={(e) => update({ clientName: e.target.value })}
                  className="bg-background/50 border-primary/10 font-mono"
                  autoFocus
                />
              </StepField>
            )}

            {currentStep.id === "product" && (
              <div className="space-y-4">
                <StepField label="Produto ou serviço">
                  <Input
                    placeholder="Ex: Curso de marketing digital"
                    value={answers.product}
                    onChange={(e) => update({ product: e.target.value })}
                    className="bg-background/50 border-primary/10 font-mono"
                    autoFocus
                  />
                </StepField>
                <StepField label="Valor (opcional)">
                  <Input
                    placeholder="Ex: R$ 997"
                    value={answers.value}
                    onChange={(e) => update({ value: e.target.value })}
                    className="bg-background/50 border-primary/10 font-mono"
                  />
                </StepField>
              </div>
            )}

            {currentStep.id === "stage" && (
              <OptionGrid
                options={leadStageOptions.map((o) => ({
                  value: o.value,
                  label: o.label,
                  description: o.description,
                }))}
                selected={answers.leadStage}
                onSelect={(v) => update({ leadStage: v as LeadStage })}
              />
            )}

            {currentStep.id === "objection" && (
              <OptionGrid
                options={objectionOptions.map((o) => ({ value: o.value, label: o.label }))}
                selected={answers.objection}
                onSelect={(v) => update({ objection: v as ObjectionType })}
              />
            )}

            {currentStep.id === "urgency" && (
              <OptionGrid
                options={urgencyOptions.map((o) => ({ value: o.value, label: o.label }))}
                selected={answers.urgency}
                onSelect={(v) => update({ urgency: v as UrgencyLevel })}
              />
            )}

            {currentStep.id === "context" && (
              <StepField label="Contexto extra (opcional)">
                <Textarea
                  placeholder="Ex: Ela viu o anúncio ontem, disse que volta amanhã..."
                  value={answers.extraContext}
                  onChange={(e) => update({ extraContext: e.target.value })}
                  className="bg-background/50 border-primary/10 font-mono min-h-[100px] resize-none"
                  autoFocus
                />
              </StepField>
            )}

            {currentStep.id === "review" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono uppercase tracking-wider text-primary">
                      Estratégia recomendada pela IA
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {messageTypeLabels[recommendation.messageType]}
                    </Badge>
                    <Badge variant="outline">{toneLabels[recommendation.tone]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.reasoning}</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Próximos passos
                  </p>
                  <ul className="space-y-1.5">
                    {recommendation.nextSteps.map((s, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-muted-foreground font-mono p-2 rounded bg-muted/20 border border-border/30">
                  <span className="text-muted-foreground/70">Contexto gerado: </span>
                  {recommendation.context}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="font-mono text-xs uppercase"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}

          {step < assistantSteps.length - 1 ? (
            <Button
              type="button"
              className="flex-1 font-mono text-xs uppercase bg-primary/90"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 font-display uppercase tracking-wider font-bold bg-gradient-to-r from-primary to-emerald-600"
              disabled={generateCopy.isPending}
              onClick={handleGenerate}
            >
              {generateCopy.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando estratégia...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Copy Estratégica
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StepField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string; description?: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={cn(
            "text-left p-3 rounded-lg border transition-all",
            selected === opt.value
              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
              : "border-border/50 bg-background/30 hover:border-primary/30"
          )}
        >
          <p className="text-sm font-medium">{opt.label}</p>
          {opt.description && <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>}
        </button>
      ))}
    </div>
  );
}
