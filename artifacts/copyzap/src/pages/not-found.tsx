import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Zap } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-border bg-card">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">404</h1>
            <p className="text-muted-foreground font-mono text-sm mt-2">
              Página não encontrada
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary hover:underline font-mono"
          >
            <Zap className="w-4 h-4" />
            Voltar ao CopyZap AI
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
