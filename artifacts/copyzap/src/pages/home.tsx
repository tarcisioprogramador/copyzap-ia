import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { StatsBar } from "@/components/stats-bar";
import { GeneratorForm } from "@/components/generator-form";
import { CopyHistory } from "@/components/copy-history";
import { CopyCard } from "@/components/copy-card";
import { SellerMode } from "@/components/seller-mode";
import { CopyImprover } from "@/components/copy-improver";
import { FollowUpGenerator } from "@/components/follow-up-generator";
import { Copy } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, Wand2, MessageSquare, RotateCcw, PenTool } from "lucide-react";

type ActiveTab = "generator" | "seller" | "improve" | "followup";

export default function Home() {
  const [latestCopy, setLatestCopy] = useState<Copy | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("generator");
  const { user, logout } = useAuth();

  const tabs = [
    { id: "generator" as const, label: "Gerador", icon: <PenTool className="w-4 h-4" /> },
    { id: "seller" as const, label: "Modo Vendedor", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "improve" as const, label: "Correção de Copy", icon: <Wand2 className="w-4 h-4" /> },
    { id: "followup" as const, label: "Follow-up", icon: <RotateCcw className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans dark selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl leading-none">
              Z
            </div>
            <span className="font-display font-bold text-xl tracking-tight">CopyZap AI</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-xs text-muted-foreground hidden sm:block font-mono">
                  {user.name} · <span className={user.plan === "pro" ? "text-primary" : ""}>{user.plan.toUpperCase()}</span>
                </span>
                <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <StatsBar />

      <div className="border-b border-border bg-card/30">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container max-w-[1400px] mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg tracking-tight uppercase">
              {activeTab === "generator" && "Gerador de Copy"}
              {activeTab === "seller" && "Modo Vendedor IA"}
              {activeTab === "improve" && "Correção de Copy"}
              {activeTab === "followup" && "Gerador de Follow-up"}
            </h2>
            <div className="h-px flex-1 bg-border ml-4" />
          </div>

          {activeTab === "generator" && <GeneratorForm onGenerated={setLatestCopy} />}
          {activeTab === "seller" && <SellerMode onGenerated={setLatestCopy} />}
          {activeTab === "improve" && <CopyImprover onGenerated={setLatestCopy} />}
          {activeTab === "followup" && <FollowUpGenerator onGenerated={setLatestCopy} />}
        </div>
        
        <div className="xl:col-span-8 space-y-8">
          {latestCopy && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg tracking-tight uppercase text-primary">Resultado Atual</h2>
                <div className="h-px flex-1 bg-primary/20 ml-4" />
              </div>
              <CopyCard copy={latestCopy} isLatest />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg tracking-tight uppercase">Histórico Operacional</h2>
              <div className="h-px flex-1 bg-border ml-4" />
            </div>
            <CopyHistory latestCopyId={latestCopy?.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
