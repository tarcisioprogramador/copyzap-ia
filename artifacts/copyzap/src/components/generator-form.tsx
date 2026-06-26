import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGenerateCopy, getListCopiesQueryKey, getGetCopyStatsQueryKey, Copy } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SalesPlaybook } from "@/components/sales-playbook";
import { quickTemplates, MessageType } from "@/lib/sales-techniques";

const formSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  product: z.string().min(1, "Produto ou serviço é obrigatório"),
  value: z.string().optional(),
  context: z.string().optional(),
  messageType: z.enum(["venda", "followup", "urgencia", "posVenda", "objecao"]),
  tone: z.enum(["profissional", "amigavel", "direto", "emocional"])
});

type FormValues = z.infer<typeof formSchema>;

const loadingMessages = [
  "Aplicando framework AIDA...",
  "Analisando perfil do lead...",
  "Otimizando CTA para WhatsApp...",
  "Calibrando tom de voz...",
  "Inserindo gatilhos de conversão...",
];

export function GeneratorForm({ onGenerated }: { onGenerated: (copy: Copy) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const generateCopy = useGenerateCopy();
  const [loadingIdx, setLoadingIdx] = useState(0);

  useEffect(() => {
    if (!generateCopy.isPending) return;
    const interval = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [generateCopy.isPending]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      product: "",
      value: "",
      context: "",
      messageType: "venda",
      tone: "direto"
    }
  });

  const messageType = form.watch("messageType") as MessageType;

  function applyTemplate(templateId: string) {
    const template = quickTemplates.find((t) => t.id === templateId);
    if (!template) return;

    form.setValue("messageType", template.messageType);
    form.setValue("tone", template.tone);
    form.setValue("context", template.context);
    toast({
      title: "Template aplicado",
      description: `"${template.label}" — preencha nome e produto.`,
    });
  }

  function onSubmit(data: FormValues) {
    generateCopy.mutate({ data }, {
      onSuccess: (result) => {
        onGenerated(result);
        queryClient.invalidateQueries({ queryKey: getListCopiesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCopyStatsQueryKey() });
        toast({
          title: "Copy gerada com sucesso",
          description: "Pronta para colar no WhatsApp e fechar a venda.",
        });
      },
      onError: (err: unknown) => {
        let description = "Ocorreu um erro. Tente novamente.";
        if (err && typeof err === "object") {
          const e = err as { response?: { data?: { error?: string } }; message?: string };
          const apiMsg = e?.response?.data?.error;
          if (apiMsg) {
            description = apiMsg;
          }
        }
        toast({
          title: "Erro ao gerar copy",
          description,
          variant: "destructive",
          duration: 8000,
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/10 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <CardContent className="pt-6 relative">
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Templates rápidos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((t) => (
                <Badge
                  key={t.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-[11px] font-normal py-1"
                  onClick={() => applyTemplate(t.id)}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                      Nome do Cliente
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Maria, João..."
                        className="bg-background/50 border-primary/10 focus-visible:ring-primary font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                        Produto / Serviço
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="O que você vende?"
                          className="bg-background/50 border-primary/10 focus-visible:ring-primary font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                        Valor (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 497"
                          className="bg-background/50 border-primary/10 focus-visible:ring-primary font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="messageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                        Tipo de Mensagem
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary font-mono text-sm">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="venda">Venda / Primeiro contato</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                          <SelectItem value="urgencia">Urgência / Escassez</SelectItem>
                          <SelectItem value="posVenda">Pós-venda</SelectItem>
                          <SelectItem value="objecao">Quebra de objeção</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                        Tom de Voz
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/10 focus:ring-primary font-mono text-sm">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="direto">Direto e objetivo</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="amigavel">Amigável / Próximo</SelectItem>
                          <SelectItem value="emocional">Emocional / Inspirador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                      Contexto da conversa
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Lead veio do Instagram, disse que está caro, precisa fechar hoje..."
                        className="resize-none bg-background/50 border-primary/10 min-h-[90px] focus-visible:ring-primary font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-display uppercase tracking-widest font-bold bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-primary-foreground transition-all duration-300 group mt-2 shadow-lg shadow-primary/20"
                disabled={generateCopy.isPending}
              >
                {generateCopy.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="animate-pulse">{loadingMessages[loadingIdx]}</span>
                  </span>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Gerar Copy com IA
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <SalesPlaybook messageType={messageType} />
    </div>
  );
}
