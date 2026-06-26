export type MessageType = "venda" | "followup" | "urgencia" | "posVenda" | "objecao";
export type Tone = "profissional" | "amigavel" | "direto" | "emocional";

export interface SalesTechnique {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const messageTypeLabels: Record<MessageType, string> = {
  venda: "Venda / Primeiro contato",
  followup: "Follow-up / Acompanhamento",
  urgencia: "Urgência / Escassez",
  posVenda: "Pós-venda / Fidelização",
  objecao: "Quebra de objeção",
};

export const toneLabels: Record<Tone, string> = {
  profissional: "Profissional",
  amigavel: "Amigável",
  direto: "Direto",
  emocional: "Emocional",
};

export const techniquesByType: Record<MessageType, SalesTechnique[]> = {
  venda: [
    { id: "aida", name: "AIDA", description: "Atenção → Interesse → Desejo → Ação", icon: "🎯" },
    { id: "spin", name: "SPIN", description: "Situação, Problema, Implicação, Necessidade", icon: "🔄" },
    { id: "social-proof", name: "Prova Social", description: "Resultados de clientes similares", icon: "⭐" },
  ],
  followup: [
    { id: "reciprocity", name: "Reciprocidade", description: "Ofereça valor antes de pedir", icon: "🤝" },
    { id: "soft-cta", name: "CTA Suave", description: "Convite sem pressão excessiva", icon: "💬" },
    { id: "timeline", name: "Timeline", description: "Referência ao último contato", icon: "📅" },
  ],
  urgencia: [
    { id: "scarcity", name: "Escassez", description: "Vagas, prazo ou bônus limitado", icon: "⏳" },
    { id: "fomo", name: "FOMO", description: "Medo de perder a oportunidade", icon: "🔥" },
    { id: "deadline", name: "Deadline", description: "Prazo concreto e real", icon: "⚡" },
  ],
  posVenda: [
    { id: "ltv", name: "LTV", description: "Fidelização e recompra", icon: "💎" },
    { id: "referral", name: "Indicação", description: "Peça indicações naturalmente", icon: "📣" },
    { id: "nps", name: "NPS", description: "Satisfação e feedback genuíno", icon: "❤️" },
  ],
  objecao: [
    { id: "feel-felt-found", name: "Sinto / Senti / Descobri", description: "Validar e redirecionar objeção", icon: "🛡️" },
    { id: "reframe", name: "Reframe", description: "Transformar objeção em benefício", icon: "🔀" },
    { id: "comparison", name: "Comparativo", description: "Custo vs. valor percebido", icon: "⚖️" },
  ],
};

export interface QuickTemplate {
  id: string;
  label: string;
  clientName: string;
  product: string;
  value?: string;
  context: string;
  messageType: MessageType;
  tone: Tone;
}

export const quickTemplates: QuickTemplate[] = [
  {
    id: "first-contact",
    label: "Primeiro contato",
    clientName: "",
    product: "",
    context: "Lead veio do Instagram, ainda não conhece o produto",
    messageType: "venda",
    tone: "amigavel",
  },
  {
    id: "price-objection",
    label: "Objeção de preço",
    clientName: "",
    product: "",
    context: "Cliente disse que está caro comparado à concorrência",
    messageType: "objecao",
    tone: "profissional",
  },
  {
    id: "closing-today",
    label: "Fechar hoje",
    clientName: "",
    product: "",
    context: "Bônus exclusivo expira hoje à meia-noite",
    messageType: "urgencia",
    tone: "direto",
  },
  {
    id: "ghost-followup",
    label: "Follow-up fantasma",
    clientName: "",
    product: "",
    context: "Cliente parou de responder há 3 dias após ver a proposta",
    messageType: "followup",
    tone: "amigavel",
  },
  {
    id: "post-sale",
    label: "Pós-venda",
    clientName: "",
    product: "",
    context: "Cliente comprou ontem, quero garantir satisfação e pedir indicação",
    messageType: "posVenda",
    tone: "emocional",
  },
];

export const aiCapabilities = [
  "Técnicas AIDA, SPIN e PAS integradas",
  "Linguagem natural brasileira para WhatsApp",
  "Quebra de objeções com empatia",
  "CTAs otimizados para conversão",
  "Tom adaptável ao perfil do cliente",
];
