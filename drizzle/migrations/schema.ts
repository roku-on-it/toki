import { sqliteTable, AnySQLiteColumn, foreignKey, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const messages = sqliteTable("messages", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	body: text().notNull(),
	sentAt: integer("sent_at").notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	displayName: text("display_name").notNull(),
	secretKey: text("secret_key").notNull(),
  avatarBase64: text("avatar_base64").notNull(),
},
(table) => [
	uniqueIndex("users_secret_key_unique").on(table.secretKey),
]);
