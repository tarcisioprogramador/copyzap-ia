import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("Health Check", () => {
  it("GET /api/healthz returns 200 with status ok", async () => {
    const res = await request(app).get("/api/healthz");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/healthz returns JSON content type", async () => {
    const res = await request(app).get("/api/healthz");

    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
