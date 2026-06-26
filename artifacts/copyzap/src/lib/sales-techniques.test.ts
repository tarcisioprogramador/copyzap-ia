import { describe, it, expect } from "vitest";
import {
  messageTypeLabels,
  toneLabels,
  techniquesByType,
  quickTemplates,
  aiCapabilities,
} from "./sales-techniques";

describe("Sales Techniques", () => {
  describe("messageTypeLabels", () => {
    it("has labels for all message types", () => {
      const types = ["venda", "followup", "urgencia", "posVenda", "objecao"];
      for (const type of types) {
        expect(messageTypeLabels[type as keyof typeof messageTypeLabels]).toBeDefined();
        expect(messageTypeLabels[type as keyof typeof messageTypeLabels].length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = Object.values(messageTypeLabels);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe("toneLabels", () => {
    it("has labels for all tones", () => {
      const tones = ["profissional", "amigavel", "direto", "emocional"];
      for (const tone of tones) {
        expect(toneLabels[tone as keyof typeof toneLabels]).toBeDefined();
      }
    });
  });

  describe("techniquesByType", () => {
    it("has techniques for all message types", () => {
      const types = ["venda", "followup", "urgencia", "posVenda", "objecao"];
      for (const type of types) {
        expect(techniquesByType[type as keyof typeof techniquesByType]).toBeDefined();
        expect(techniquesByType[type as keyof typeof techniquesByType].length).toBeGreaterThan(0);
      }
    });

    it("each technique has required fields", () => {
      const allTechniques = Object.values(techniquesByType).flat();
      for (const technique of allTechniques) {
        expect(technique.id).toBeTruthy();
        expect(technique.name).toBeTruthy();
        expect(technique.description).toBeTruthy();
        expect(technique.icon).toBeTruthy();
      }
    });

    it("has unique technique IDs across all types", () => {
      const allIds = Object.values(techniquesByType)
        .flat()
        .map((t) => t.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe("quickTemplates", () => {
    it("has all template fields populated", () => {
      for (const template of quickTemplates) {
        expect(template.id).toBeTruthy();
        expect(template.label).toBeTruthy();
        expect(template.context).toBeTruthy();
        expect(["venda", "followup", "urgencia", "posVenda", "objecao"]).toContain(
          template.messageType,
        );
        expect(["profissional", "amigavel", "direto", "emocional"]).toContain(template.tone);
      }
    });

    it("has unique template IDs", () => {
      const ids = quickTemplates.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("provides default empty strings for client and product", () => {
      for (const template of quickTemplates) {
        expect(template.clientName).toBe("");
        expect(template.product).toBe("");
      }
    });
  });

  describe("aiCapabilities", () => {
    it("has a non-empty list of capabilities", () => {
      expect(aiCapabilities.length).toBeGreaterThan(0);
    });

    it("each capability is a non-empty string", () => {
      for (const cap of aiCapabilities) {
        expect(cap.length).toBeGreaterThan(0);
      }
    });
  });
});
