import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const copiesTable = pgTable("copies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  product: text("product").notNull(),
  value: text("value"),
  context: text("context"),
  messageType: text("message_type").notNull(),
  tone: text("tone").notNull().default("profissional"),
  generatedText: text("generated_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("copies_user_id_idx").on(table.userId),
  index("copies_created_at_idx").on(table.createdAt),
  index("copies_user_created_idx").on(table.userId, table.createdAt),
]);

export const insertCopySchema = createInsertSchema(copiesTable).omit({ id: true, createdAt: true });
export type InsertCopy = z.infer<typeof insertCopySchema>;
export type Copy = typeof copiesTable.$inferSelect;
