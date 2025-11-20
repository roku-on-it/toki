import { relations } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  displayName: text("display_name").notNull(),
  secretKey: text("secret_key").unique().notNull(),
  avatarBase64: text("avatar_base64").notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  body: text("body").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  userId: text("user_id")
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
