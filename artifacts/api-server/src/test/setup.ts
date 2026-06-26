import { vi } from "vitest";

// Mock environment variables
process.env.GROQ_API_KEY = "test-groq-key";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock Groq SDK — use a class so `new Groq()` works as a constructor
const mockGroqCreate = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content:
          "Olá Maria! Tudo bem? Vi que você se interessou pelo nosso curso de marketing digital. Tenho uma oportunidade imperdível para você hoje! Posso te enviar os detalhes?",
      },
    },
  ],
});

vi.mock("groq-sdk", () => ({
  default: class MockGroq {
    chat = {
      completions: {
        create: mockGroqCreate,
      },
    };
  },
}));

// Mock @workspace/db with a builder pattern for chainable queries
const mockDbQuery = (result: unknown) => {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  return chain;
};

const copiesTable = {
  id: "copies",
  clientName: "client_name",
  product: "product",
  value: "value",
  context: "context",
  messageType: "message_type",
  tone: "tone",
  generatedText: "generated_text",
  outcome: "outcome",
  outcomeAt: "outcome_at",
  createdAt: "created_at",
};

// Create a db mock with default behavior
const createMockDb = () => {
  const db: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  };
  return db;
};

vi.mock("@workspace/db", () => ({
  db: createMockDb(),
  copiesTable,
}));
