import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GeneratorForm } from "./generator-form";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";

// Mock the API hooks
vi.mock("@workspace/api-client-react", () => ({
  useGenerateCopy: () => ({
    mutate: vi.fn((_data: unknown, options?: { onSuccess?: (result: unknown) => void }) => {
      options?.onSuccess?.({
        id: 1,
        clientName: "Maria",
        product: "Curso",
        messageType: "venda",
        tone: "direto",
        generatedText: "Olá Maria! Teste.",
        createdAt: new Date().toISOString(),
      });
    }),
    isPending: false,
  }),
  getListCopiesQueryKey: () => ["/api/copies"],
  getGetCopyStatsQueryKey: () => ["/api/copies/stats"],
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}

describe("GeneratorForm", () => {
  const onGeneratedMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<GeneratorForm onGenerated={onGeneratedMock} />, { wrapper: Wrapper });

    expect(screen.getByText("Nome do Cliente")).toBeInTheDocument();
    expect(screen.getByText("Produto / Serviço")).toBeInTheDocument();
    expect(screen.getByText("Valor (opcional)")).toBeInTheDocument();
    expect(screen.getByText("Tipo de Mensagem")).toBeInTheDocument();
    expect(screen.getByText("Tom de Voz")).toBeInTheDocument();
    expect(screen.getByText("Contexto da conversa")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<GeneratorForm onGenerated={onGeneratedMock} />, { wrapper: Wrapper });

    expect(screen.getByRole("button", { name: /gerar copy com ia/i })).toBeInTheDocument();
  });

  it("renders quick template badges section", () => {
    render(<GeneratorForm onGenerated={onGeneratedMock} />, { wrapper: Wrapper });

    expect(screen.getByText("Templates rápidos")).toBeInTheDocument();
    expect(screen.getByText("Primeiro contato")).toBeInTheDocument();
    expect(screen.getByText("Objeção de preço")).toBeInTheDocument();
    expect(screen.getByText("Fechar hoje")).toBeInTheDocument();
    expect(screen.getByText("Follow-up fantasma")).toBeInTheDocument();

    // Use getAllByText for "Pós-venda" which appears in both badges and selects
    const posVendaElements = screen.getAllByText("Pós-venda");
    expect(posVendaElements.length).toBeGreaterThan(0);
    // Should have at least one badge with this text
    const badgeElement = posVendaElements[0];
    expect(badgeElement).toBeInTheDocument();
  });

  it("enables submit button when required fields are filled", async () => {
    const user = userEvent.setup();
    render(<GeneratorForm onGenerated={onGeneratedMock} />, { wrapper: Wrapper });

    const submitButton = screen.getByRole("button", { name: /gerar copy com ia/i });
    expect(submitButton).toBeInTheDocument();

    // Fill in required fields
    const nameInput = screen.getByPlaceholderText("Ex: Maria, João...");
    const productInput = screen.getByPlaceholderText("O que você vende?");

    await user.type(nameInput, "Maria Silva");
    await user.type(productInput, "Curso de Marketing");

    expect(submitButton).not.toBeDisabled();
  });

  it("applies a template when clicking a badge", async () => {
    const user = userEvent.setup();
    render(<GeneratorForm onGenerated={onGeneratedMock} />, { wrapper: Wrapper });

    // Click on "Objeção de preço" template
    await user.click(screen.getByText("Objeção de preço"));

    // The context field should show the template's context
    const contextField = screen.getByPlaceholderText(
      "Ex: Lead veio do Instagram, disse que está caro, precisa fechar hoje...",
    );

    await waitFor(() => {
      expect(contextField).not.toHaveValue("");
    });
  });

  it("renders SalesPlaybook with default message type (venda)", () => {
    render(<GeneratorForm onGenerated={onGeneratedMock} />, { wrapper: Wrapper });

    // By default, "venda" techniques should be visible
    expect(screen.getByText("IA Treinada")).toBeInTheDocument();
    expect(screen.getByText("AIDA")).toBeInTheDocument();
    expect(screen.getByText("SPIN")).toBeInTheDocument();
  });
});
