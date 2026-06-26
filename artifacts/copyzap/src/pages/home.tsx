import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatsBar } from "@/components/stats-bar";
import { GeneratorForm } from "@/components/generator-form";
import { ClosingAssistant } from "@/components/closing-assistant";
import { ResponseAnalytics } from "@/components/response-analytics";
import { CopyHistory } from "@/components/copy-history";
import { CopyCard } from "@/components/copy-card";
import { CyberBackground } from "@/components/cyber-background";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "@workspace/api-client-react";
import { Bot, Zap, MessageCircle, TrendingUp, Brain, Wand2 } from "lucide-react";
import { aiCapabilities } from "@/lib/sales-techniques";

export default function Home() {
  const [latestCopy, setLatestCopy] = useState<Copy | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans dark selection:bg-primary selection:text-primary-foreground relative">
      <CyberBackground />

      <header className="sticky top-0 z-40 border-b border-primary/10 bg-card/60 backdrop-blur-xl">
        <div className="container max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-primary-foreground font-display font-bold text-xl leading-none shadow-lg shadow-primary/25">
                Z
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-card animate-pulse" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                CopyZap AI
              </span>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest hidden sm:block">
                Vendas WhatsApp · IA 100%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-primary">Motor IA Ativo</span>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5">
        <div className="container max-w-[1400px] mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                Venda mais no{" "}
                <span className="text-[#25D366]">WhatsApp</span>{" "}
                com IA treinada em vendas
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Use o assistente guiado para fechar vendas ou gere copys rápidas. Acompanhe qual tipo de mensagem converte mais.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiCapabilities.slice(0, 3).map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border border-border/60 bg-card/50 text-muted-foreground"
                >
                  <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StatsBar />
      <ResponseAnalytics />

      <main className="flex-1 container max-w-[1400px] mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-4">
          <Tabs defaultValue="assistant" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-card/50 border border-border/50">
              <TabsTrigger value="assistant" className="font-mono text-xs uppercase gap-1.5 data-[state=active]:bg-primary/10">
                <Brain className="w-3.5 h-3.5" />
                Assistente
              </TabsTrigger>
              <TabsTrigger value="generator" className="font-mono text-xs uppercase gap-1.5 data-[state=active]:bg-primary/10">
                <Wand2 className="w-3.5 h-3.5" />
                Gerador Rápido
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="mt-4">
              <ClosingAssistant onGenerated={setLatestCopy} />
            </TabsContent>

            <TabsContent value="generator" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-sm tracking-tight uppercase flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  Modo manual
                </h2>
              </div>
              <GeneratorForm onGenerated={setLatestCopy} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {latestCopy && (
              <motion.div
                key={latestCopy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-lg tracking-tight uppercase text-primary flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Copy Gerada
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4" />
                </div>
                <CopyCard copy={latestCopy} isLatest showPreview />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg tracking-tight uppercase">Histórico</h2>
              <div className="h-px flex-1 bg-border ml-4" />
            </div>
            <CopyHistory latestCopyId={latestCopy?.id} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-4 mt-auto">
        <div className="container max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            CopyZap AI · Inteligência artificial para vendedores brasileiros
          </p>
        </div>
      </footer>
    </div>
  );
}
