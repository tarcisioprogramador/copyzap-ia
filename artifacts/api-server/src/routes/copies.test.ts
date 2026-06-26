import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app";

// Access mocked db module to override in each test
const dbModule = await import("@workspace/db");
const db = dbModule.db as unknown as Record<string, ReturnType<typeof vi.fn>>;

const mockCopy = {
  id: 1,
  clientName: "Maria Silva",
  product: "Curso de Marketing Digital",
  value: "R$ 497",
  context: "Lead veio do Instagram",
  messageType: "venda",
  tone: "direto",
  generatedText:
    "Olá Maria! Tudo bem? Vi que você se interessou pelo nosso curso. Tenho uma oportunidade para você!",
  outcome: null,
  outcomeAt: null,
  createdAt: new Date("2025-06-26T10:00:00Z"),
};

describe("Copies API", () => {
  describe("GET /api/copies/stats", () => {
    it("returns copy statistics with total, byType and todayCount", async () => {
      // Route makes 3 select().from() chains - we need from() to return different things
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call: total count - no where/groupBy
            return Promise.resolve([{ count: 10 }]);
          } else if (callCount === 2) {
            // Second call: byType with groupBy()
            return {
              groupBy: vi.fn().mockResolvedValue([
                { messageType: "venda", count: 5 },
                { messageType: "followup", count: 3 },
              ]),
            };
          } else {
            // Third call: today count with where()
            return {
              where: vi.fn().mockResolvedValue([{ count: 3 }]),
            };
          }
        }),
      }));

      const res = await request(app).get("/api/copies/stats");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        total: 10,
        byType: { venda: 5, followup: 3 },
        todayCount: 3,
      });
    });
  });

  describe("GET /api/copies/analytics", () => {
    it("returns analytics with overall and byType metrics", async () => {
      const analyticsData = [
        { messageType: "venda", outcome: "responded" },
        { messageType: "venda", outcome: "no_response" },
        { messageType: "followup", outcome: "sent" },
        { messageType: "venda", outcome: null },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockResolvedValue(analyticsData),
      });

      const res = await request(app).get("/api/copies/analytics");

      expect(res.status).toBe(200);
      expect(res.body.overall).toBeDefined();
      expect(res.body.overall.responseRate).toBeTypeOf("number");
      expect(res.body.overall.total).toBe(4);
      expect(res.body.byType.venda).toBeDefined();
    });
  });

  describe("GET /api/copies", () => {
    it("returns list of copies ordered by createdAt desc", async () => {
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockCopy]),
          }),
        }),
      }));

      const res = await request(app).get("/api/copies");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe(1);
    });

    it("returns empty array when no copies exist", async () => {
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const res = await request(app).get("/api/copies");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/copies", () => {
    it("generates a copy successfully with valid input", async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCopy]),
        }),
      });

      const res = await request(app)
        .post("/api/copies")
        .send({
          clientName: "Maria Silva",
          product: "Curso de Marketing Digital",
          messageType: "venda",
          tone: "direto",
        });

      expect(res.status).toBe(201);
      expect(res.body.clientName).toBe("Maria Silva");
      expect(res.body.generatedText).toBeTruthy();
    });

    it("returns 400 for invalid input with missing required fields", async () => {
      const res = await request(app)
        .post("/api/copies")
        .send({ clientName: "Maria" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 for empty clientName", async () => {
      const res = await request(app)
        .post("/api/copies")
        .send({
          clientName: "",
          product: "Curso",
          messageType: "venda",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid messageType", async () => {
      const res = await request(app)
        .post("/api/copies")
        .send({
          clientName: "Maria",
          product: "Curso",
          messageType: "invalid_type",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/copies/:id/outcome", () => {
    it("updates copy outcome successfully", async () => {
      const updatedCopy = { ...mockCopy, outcome: "responded" as const, outcomeAt: new Date() };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCopy]),
          }),
        }),
      });

      const res = await request(app)
        .patch("/api/copies/1/outcome")
        .send({ outcome: "responded" });

      expect(res.status).toBe(200);
      expect(res.body.outcome).toBe("responded");
    });

    it("returns 404 for non-existent copy", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await request(app)
        .patch("/api/copies/999/outcome")
        .send({ outcome: "responded" });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid outcome value", async () => {
      const res = await request(app)
        .patch("/api/copies/1/outcome")
        .send({ outcome: "invalid" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for non-numeric id", async () => {
      const res = await request(app)
        .patch("/api/copies/abc/outcome")
        .send({ outcome: "sent" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/copies/:id", () => {
    it("deletes a copy successfully", async () => {
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await request(app).delete("/api/copies/1");

      expect(res.status).toBe(204);
    });

    it("returns 400 for invalid id", async () => {
      const res = await request(app).delete("/api/copies/invalid");

      expect(res.status).toBe(400);
    });
  });
});
