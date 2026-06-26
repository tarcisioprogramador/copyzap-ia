import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SalesPlaybook } from "./sales-playbook";

describe("SalesPlaybook", () => {
  it("renders techniques for 'venda' message type", () => {
    render(<SalesPlaybook messageType="venda" />);

    expect(screen.getByText("IA Treinada")).toBeInTheDocument();
    expect(screen.getByText("AIDA")).toBeInTheDocument();
    expect(screen.getByText("SPIN")).toBeInTheDocument();
    expect(screen.getByText("Prova Social")).toBeInTheDocument();
  });

  it("renders techniques for 'followup' message type", () => {
    render(<SalesPlaybook messageType="followup" />);

    expect(screen.getByText("Reciprocidade")).toBeInTheDocument();
    expect(screen.getByText("CTA Suave")).toBeInTheDocument();
  });

  it("renders techniques for 'urgencia' message type", () => {
    render(<SalesPlaybook messageType="urgencia" />);

    expect(screen.getByText("Escassez")).toBeInTheDocument();
    expect(screen.getByText("FOMO")).toBeInTheDocument();
    expect(screen.getByText("Deadline")).toBeInTheDocument();
  });

  it("renders techniques for 'posVenda' message type", () => {
    render(<SalesPlaybook messageType="posVenda" />);

    expect(screen.getByText("LTV")).toBeInTheDocument();
    expect(screen.getByText("Indicação")).toBeInTheDocument();
    expect(screen.getByText("NPS")).toBeInTheDocument();
  });

  it("renders techniques for 'objecao' message type", () => {
    render(<SalesPlaybook messageType="objecao" />);

    expect(screen.getByText("Sinto / Senti / Descobri")).toBeInTheDocument();
    expect(screen.getByText("Reframe")).toBeInTheDocument();
    expect(screen.getByText("Comparativo")).toBeInTheDocument();
  });

  it("shows the message type label in the description", () => {
    render(<SalesPlaybook messageType="venda" />);

    expect(screen.getByText("Venda / Primeiro contato")).toBeInTheDocument();
  });

  it("shows the 'Técnicas aplicadas automaticamente' footer", () => {
    render(<SalesPlaybook messageType="venda" />);

    expect(
      screen.getByText("Técnicas aplicadas automaticamente na geração"),
    ).toBeInTheDocument();
  });
});
