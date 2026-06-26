import { MessageType, Tone } from "./sales-techniques";

export type LeadStage =
  | "first_contact"
  | "proposal_sent"
  | "almost_closing"
  | "ghosted"
  | "post_sale";

export type ObjectionType =
  | "none"
  | "price"
  | "time"
  | "competition"
  | "trust";

export type UrgencyLevel = "none" | "moderate" | "high";

export interface ClosingAssistantAnswers {
  clientName: string;
  product: string;
  value: string;
  leadStage: LeadStage;
  objection: ObjectionType;
  urgency: UrgencyLevel;
  extraContext: string;
}

export interface ClosingRecommendation {
  messageType: MessageType;
  tone: Tone;
  context: string;
  reasoning: string;
  nextSteps: string[];
}

export const leadStageOptions: { value: LeadStage; label: string; description: string }[] = [
  { value: "first_contact", label: "Primeiro contato", description: "Lead novo, ainda não conversamos direito" },
  { value: "proposal_sent", label: "Proposta enviada", description: "Já mandei valores ou proposta" },
  { value: "almost_closing", label: "Quase fechando", description: "Cliente interessado, falta empurrar" },
  { value: "ghosted", label: "Sumiu / Fantasma", description: "Parou de responder" },
  { value: "post_sale", label: "Já comprou", description: "Cliente existente, pós-venda" },
];

export const objectionOptions: { value: ObjectionType; label: string }[] = [
  { value: "none", label: "Nenhuma objeção clara" },
  { value: "price", label: "Preço / Está caro" },
  { value: "time", label: "Tempo / Preciso pensar" },
  { value: "competition", label: "Concorrência" },
  { value: "trust", label: "Desconfiança / Não conheço" },
];

export const urgencyOptions: { value: UrgencyLevel; label: string }[] = [
  { value: "none", label: "Sem urgência" },
  { value: "moderate", label: "Prazo moderado", },
  { value: "high", label: "Precisa fechar hoje", },
];

const objectionLabels: Record<ObjectionType, string> = {
  none: "",
  price: "Objeção principal: acha caro ou comparou preço.",
  time: "Objeção principal: precisa pensar ou não tem tempo agora.",
  competition: "Objeção principal: está comparando com concorrente.",
  trust: "Objeção principal: desconfiança ou não conhece a marca.",
};

const stageLabels: Record<LeadStage, string> = {
  first_contact: "Lead em primeiro contato, ainda explorando.",
  proposal_sent: "Proposta ou valores já foram enviados.",
  almost_closing: "Cliente quente, falta decisão final.",
  ghosted: "Cliente parou de responder após contato anterior.",
  post_sale: "Cliente já comprou, foco em satisfação e indicação.",
};

export function buildClosingRecommendation(answers: ClosingAssistantAnswers): ClosingRecommendation {
  let messageType: MessageType = "venda";
  let tone: Tone = "amigavel";
  const contextParts: string[] = [stageLabels[answers.leadStage]];

  if (answers.objection !== "none") {
    contextParts.push(objectionLabels[answers.objection]);
  }
  if (answers.extraContext.trim()) {
    contextParts.push(answers.extraContext.trim());
  }
  if (answers.urgency === "high") {
    contextParts.push("Urgência real: precisa fechar hoje ou perde bônus/prazo.");
  } else if (answers.urgency === "moderate") {
    contextParts.push("Há um prazo moderado para decisão.");
  }

  switch (answers.leadStage) {
    case "first_contact":
      messageType = answers.objection !== "none" ? "objecao" : "venda";
      tone = answers.objection === "trust" ? "profissional" : "amigavel";
      break;
    case "proposal_sent":
      messageType = answers.objection !== "none" ? "objecao" : "followup";
      tone = "profissional";
      break;
    case "almost_closing":
      messageType = answers.urgency === "high" ? "urgencia" : "venda";
      tone = "direto";
      break;
    case "ghosted":
      messageType = "followup";
      tone = "amigavel";
      break;
    case "post_sale":
      messageType = "posVenda";
      tone = "emocional";
      break;
  }

  if (answers.objection === "price" && messageType !== "posVenda") {
    messageType = "objecao";
    tone = "profissional";
  }

  const reasoning = getReasoning(messageType, tone, answers);
  const nextSteps = getNextSteps(messageType, answers);

  return {
    messageType,
    tone,
    context: contextParts.join(" "),
    reasoning,
    nextSteps,
  };
}

function getReasoning(messageType: MessageType, tone: Tone, answers: ClosingAssistantAnswers): string {
  const typeReasons: Record<MessageType, string> = {
    venda: "Primeiro contato pede AIDA + SPIN para gerar interesse sem pressionar.",
    followup: "Follow-up com reciprocidade funciona melhor quando o lead esfriou.",
    urgencia: "Cliente quente + prazo = escassez e FOMO com credibilidade.",
    posVenda: "Pós-venda fortalece relacionamento e abre indicações.",
    objecao: "Objeção detectada — técnica Feel-Felt-Found antes de argumentar.",
  };
  const toneReasons: Record<Tone, string> = {
    direto: "Tom direto acelera fechamento quando o lead já está decidido.",
    amigavel: "Tom amigável reconecta sem parecer desesperado.",
    profissional: "Tom profissional transmite confiança em objeções de preço.",
    emocional: "Tom emocional cria conexão genuína pós-compra.",
  };
  return `${typeReasons[messageType]} ${toneReasons[tone]}`;
}

function getNextSteps(messageType: MessageType, answers: ClosingAssistantAnswers): string[] {
  const base: Record<MessageType, string[]> = {
    venda: [
      "Envie a copy e aguarde 2-4h",
      "Se não responder, faça follow-up amanhã",
      "Marque o resultado aqui para melhorar suas métricas",
    ],
    followup: [
      "Envie em horário comercial (9h-18h)",
      "Não envie mais de 2 follow-ups seguidos",
      "Ofereça algo de valor na próxima mensagem",
    ],
    urgencia: [
      "Envie agora — urgência perde força com delay",
      "Confirme o prazo real com o cliente",
      "Tenha resposta pronta para objeção de preço",
    ],
    posVenda: [
      "Aguarde 24-48h após a compra",
      "Peça feedback antes de pedir indicação",
      "Registre como 'respondeu' se cliente interagir",
    ],
    objecao: [
      "Valide a objeção antes de contra-argumentar",
      "Use prova social se disponível",
      "Proponha próximo passo concreto (call, demo, parcelamento)",
    ],
  };

  const steps = [...base[messageType]];
  if (answers.urgency === "high" && messageType !== "urgencia") {
    steps.unshift("Considere mencionar prazo limite na mensagem");
  }
  return steps;
}

export const assistantSteps = [
  { id: "client", title: "Cliente", subtitle: "Quem é o lead?" },
  { id: "product", title: "Produto", subtitle: "O que você vende?" },
  { id: "stage", title: "Momento", subtitle: "Em que fase está?" },
  { id: "objection", title: "Objeção", subtitle: "O que trava a venda?" },
  { id: "urgency", title: "Urgência", subtitle: "Qual o prazo?" },
  { id: "context", title: "Detalhes", subtitle: "Algo mais?" },
  { id: "review", title: "Estratégia", subtitle: "IA recomenda" },
] as const;
