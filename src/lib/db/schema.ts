import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  secretKey: text("secret_key").unique().notNull(),
  avatarBase64: text("avatar_base64").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at")
    .notNull()
    .defaultNow(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  author: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));
